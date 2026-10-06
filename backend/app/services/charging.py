import pandas as pd
import geopandas as gpd
from pathlib import Path
from shapely.geometry import Point

from app.core.config import settings


class ChargingService:

    @staticmethod
    def load_charging_data(file_path: Path) -> gpd.GeoDataFrame:
        if not file_path.exists():
            raise FileNotFoundError(
                f"Charging data file not found at {file_path}"
            )

        df = pd.read_csv(file_path)

        required_columns = [
            "name",
            "address",
            "lattitude",
            "longitude",
        ]

        missing_columns = [
            column
            for column in required_columns
            if column not in df.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {missing_columns}"
            )

        # Match original notebook logic
        df["lattitude"] = pd.to_numeric(
            df["lattitude"],
            errors="coerce",
        )

        df["longitude"] = pd.to_numeric(
            df["longitude"],
            errors="coerce",
        )

        df = (
            df
            .dropna(subset=["lattitude", "longitude"])
            .drop_duplicates(subset=["name", "address"])
        )

        charging_gdf = gpd.GeoDataFrame(
            df,
            geometry=[
                Point(xy)
                for xy in zip(
                    df["longitude"],
                    df["lattitude"],
                )
            ],
            crs=settings.GEOGRAPHIC_CRS,
        )

        return charging_gdf

    @staticmethod
    def count_stations_by_ward(
        charging_gdf: gpd.GeoDataFrame,
        wards_gdf: gpd.GeoDataFrame,
    ) -> pd.DataFrame:

        mumbai_chargers = gpd.sjoin(
            charging_gdf,
            wards_gdf[["ward_name", "geometry"]],
            how="inner",
            predicate="within",
        )

        charger_counts = (
            mumbai_chargers["ward_name"]
            .value_counts()
            .reset_index()
        )

        charger_counts.columns = [
            "ward_name",
            "num_charging_stations",
        ]

        return charger_counts

    @staticmethod
    def add_station_counts(
        wards_gdf: gpd.GeoDataFrame,
        charging_gdf: gpd.GeoDataFrame,
    ) -> gpd.GeoDataFrame:

        charger_counts = ChargingService.count_stations_by_ward(
            charging_gdf,
            wards_gdf,
        )

        wards = wards_gdf.copy()

        wards = wards.merge(
            charger_counts,
            on="ward_name",
            how="left",
        )

        wards["num_charging_stations"] = (
            wards["num_charging_stations"]
            .fillna(0)
            .astype(int)
        )

        return wards