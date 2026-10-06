import pandas as pd
import geopandas as gpd
import numpy as np
from shapely.geometry import Point
from pathlib import Path

from app.core.config import settings


class SpatialService:

    @staticmethod
    def load_wards(file_path: Path) -> gpd.GeoDataFrame:
        """Load BMC ward boundaries, standardize names, and validate count."""

        if not file_path.exists():
            raise FileNotFoundError(
                f"Ward file not found at {file_path}"
            )

        gdf = gpd.read_file(file_path)

        # Standardization from source Cell 3
        gdf = gdf.rename(
            columns={
                "name": "ward_name",
                "gid": "ward_gid"
            }
        )

        gdf["ward_name"] = (
            gdf["ward_name"]
            .str.strip()
            .str.upper()
        )

        if len(gdf) != settings.TOTAL_WARDS:
            raise ValueError(
                f"Integrity error: Expected "
                f"{settings.TOTAL_WARDS} wards, "
                f"found {len(gdf)}"
            )

        if gdf.geometry.isnull().any():
            raise ValueError(
                "Invalid geometry detected in ward boundaries."
            )

        return gdf

    @staticmethod
    def load_substations(file_path: Path) -> gpd.GeoDataFrame:
        """Load substations from CSV and convert them to a GeoDataFrame."""

        if not file_path.exists():
            raise FileNotFoundError(
                f"Substation file not found at {file_path}"
            )

        df = pd.read_csv(file_path)

        if len(df) != settings.TOTAL_SUBSTATIONS:
            raise ValueError(
                f"Integrity error: Expected "
                f"{settings.TOTAL_SUBSTATIONS} substations, "
                f"found {len(df)}"
            )

        gdf = gpd.GeoDataFrame(
            df,
            geometry=[
                Point(xy)
                for xy in zip(
                    df["longitude"],
                    df["latitude"]
                )
            ],
            crs=settings.GEOGRAPHIC_CRS
        )

        return gdf

    @staticmethod
    def get_metric_gdf(
        gdf: gpd.GeoDataFrame
    ) -> gpd.GeoDataFrame:
        """Reproject a GeoDataFrame to metric CRS EPSG:32643."""

        return gdf.to_crs(settings.METRIC_CRS)

    @staticmethod
    def calculate_ward_metrics(
        wards_gdf: gpd.GeoDataFrame
    ) -> gpd.GeoDataFrame:
        """Calculate ward area and centroid coordinates."""

        # Reproject to metric CRS for accurate area calculations
        wards_metric = SpatialService.get_metric_gdf(
            wards_gdf
        )

        # Area in square kilometres
        wards_gdf["area_sqkm"] = (
            wards_metric.geometry.area / 1e6
        )

        # Calculate centroids in metric CRS
        centroids_metric = (
            wards_metric.geometry.centroid
        )

        # Convert centroids back to geographic CRS
        centroids_geo = centroids_metric.to_crs(
            settings.GEOGRAPHIC_CRS
        )

        wards_gdf["centroid_lon"] = centroids_geo.x
        wards_gdf["centroid_lat"] = centroids_geo.y

        return wards_gdf

    @staticmethod
    def calculate_grid_proximity(
        wards_gdf: gpd.GeoDataFrame,
        grid_gdf: gpd.GeoDataFrame
    ) -> list[float]:
        """Calculate distance in metres to the nearest substation."""

        wards_metric = SpatialService.get_metric_gdf(
            wards_gdf
        )

        grid_metric = SpatialService.get_metric_gdf(
            grid_gdf
        )

        nearest_distances = []

        for _, ward_row in wards_metric.iterrows():

            ward_centroid = ward_row.geometry.centroid

            dist = (
                grid_metric.geometry
                .distance(ward_centroid)
                .min()
            )

            nearest_distances.append(
                round(float(dist), 1)
            )

        return nearest_distances

    @staticmethod
    def generate_distance_matrix(
        wards_gdf: gpd.GeoDataFrame
    ) -> np.ndarray:
        """Generate ward-to-ward Euclidean distance matrix in metres."""

        wards_metric = SpatialService.get_metric_gdf(
            wards_gdf
        )

        centroids = np.array(
            list(
                zip(
                    wards_metric.geometry.centroid.x,
                    wards_metric.geometry.centroid.y
                )
            )
        )

        # Euclidean distance between every pair of ward centroids
        dist_matrix = np.linalg.norm(
            centroids[:, None, :] -
            centroids[None, :, :],
            axis=-1
        )

        return dist_matrix