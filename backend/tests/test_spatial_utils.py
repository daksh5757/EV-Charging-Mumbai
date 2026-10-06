import geopandas as gpd
import numpy as np
from shapely.geometry import Point

from app.services.spatial_utils import SpatialService
from app.core.config import settings


def test_crs_constants():
    assert settings.METRIC_CRS == "EPSG:32643"
    assert settings.GEOGRAPHIC_CRS == "EPSG:4326"


def test_distance_matrix_shape():
    data = {
        "ward_name": [f"W{i}" for i in range(24)],
        "geometry": [Point(0, i) for i in range(24)],
    }

    gdf = gpd.GeoDataFrame(
        data,
        crs=settings.METRIC_CRS
    )

    matrix = SpatialService.generate_distance_matrix(gdf)

    assert matrix.shape == (24, 24)
    assert matrix[0, 0] == 0