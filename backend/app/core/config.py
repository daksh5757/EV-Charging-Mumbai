from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ---------------------------------------------------------
    # PROJECT PATHS
    # ---------------------------------------------------------

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    DATA_DIR: Path = BASE_DIR.parent / "data"

    RAW_DATA_DIR: Path = DATA_DIR / "raw"

    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"

    # ---------------------------------------------------------
    # COORDINATE REFERENCE SYSTEMS
    # ---------------------------------------------------------

    GEOGRAPHIC_CRS: str = "EPSG:4326"

    METRIC_CRS: str = "EPSG:32643"

    # ---------------------------------------------------------
    # DATASET INTEGRITY
    # ---------------------------------------------------------

    TOTAL_WARDS: int = 24

    TOTAL_SUBSTATIONS: int = 35

    # ---------------------------------------------------------
    # RESEARCH MODEL PARAMETERS
    # ---------------------------------------------------------

    # p-Median number of facilities
    P_MEDIAN_SITES: int = 8

    # Grid penalty coefficient used in the original model
    GRID_PENALTY_ALPHA: float = 0.05

    # Dasymetric demand weights
    POPULATION_WEIGHT: float = 0.60

    POI_WEIGHT: float = 0.40

    # MCDE weights
    MCDE_DEMAND_WEIGHT: float = 0.35

    MCDE_SUPPLY_GAP_WEIGHT: float = 0.25

    MCDE_GRID_WEIGHT: float = 0.20

    MCDE_ROAD_WEIGHT: float = 0.20

    # ---------------------------------------------------------
    # API
    # ---------------------------------------------------------

    API_PREFIX: str = "/api"

    PROJECT_NAME: str = "Urban Charge — Mumbai EV Infrastructure"

    VERSION: str = "1.0.0"

    # ---------------------------------------------------------
    # CORS
    # ---------------------------------------------------------

    FRONTEND_ORIGIN: str = "http://localhost:5173"


settings = Settings()