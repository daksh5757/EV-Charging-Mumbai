from fastapi import APIRouter, HTTPException
import geopandas as gpd

from app.services.pipeline import AnalysisPipeline


router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


# =========================================================
# HELPERS
# =========================================================

def _round_float(value, digits=2):
    return round(float(value), digits)


def _serialize_ward(row):
    geometry = None

    if row.geometry is not None:
        geometry = row.geometry.__geo_interface__

    return {
        "ward_name": str(row["ward_name"]),
        "ward_gid": (
            str(row["ward_gid"])
            if "ward_gid" in row.index
            else None
        ),
        "area_sqkm": _round_float(row["area_sqkm"], 3),
        "centroid": {
            "lat": _round_float(row["centroid_lat"], 6),
            "lng": _round_float(row["centroid_lon"], 6),
        },
        "pop_density": _round_float(row["pop_density"], 2),
        "poi_density": _round_float(row["poi_density"], 2),
        "road_network_km": _round_float(
            row["road_network_km"], 2
        ),
        "predicted_ward_demand": _round_float(
            row["predicted_ward_demand"], 1
        ),
        "num_charging_stations": int(
            row["num_charging_stations"]
        ),
        "demand_per_station": _round_float(
            row["demand_per_station"], 1
        ),
        "dist_to_grid_m": _round_float(
            row["dist_to_grid_m"], 1
        ),
        "geometry": geometry,
    }


def _serialize_charger(row):
    return {
        "name": str(row["name"]),
        "address": str(row["address"]),
        "latitude": _round_float(row["lattitude"], 6),
        "longitude": _round_float(row["longitude"], 6),
        "ward_name": (
            str(row["ward_name"])
            if "ward_name" in row.index
            and row["ward_name"] is not None
            else None
        ),
    }


def _serialize_substation(row):
    return {
        "substation_name": str(row["substation_name"]),
        "utility": str(row["utility"]),
        "voltage_level_kv": str(row["voltage_level_kv"]),
        "latitude": _round_float(row["latitude"], 6),
        "longitude": _round_float(row["longitude"], 6),
    }


def _serialize_selected_site(row):
    return {
        "ward_name": str(row["ward_name"]),
        "predicted_ward_demand": _round_float(
            row["predicted_ward_demand"], 1
        ),
        "num_charging_stations": int(
            row["num_charging_stations"]
        ),
        "dist_to_grid_m": _round_float(
            row["dist_to_grid_m"], 1
        ),
        "road_network_km": _round_float(
            row["road_network_km"], 2
        ),
        "facility_index": int(row["facility_index"]),
        "centroid": {
            "lat": _round_float(
                row["centroid_lat"], 6
            ),
            "lng": _round_float(
                row["centroid_lon"], 6
            ),
        },
    }


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def analysis_health():
    return {
        "status": "ok",
        "service": "EV Charging Mumbai Analysis API",
    }


# =========================================================
# SUMMARY
# =========================================================

@router.get("/summary")
def get_analysis_summary():
    try:
        base_data = AnalysisPipeline.load_base_data()
        forecast = AnalysisPipeline.run_forecast()

        wards = base_data["wards"]
        substations = base_data["substations"]
        chargers = base_data["chargers"]

        return {
            "status": "success",
            "forecast": {
                "predicted_city_demand": round(
                    forecast["predicted_city_demand"], 1
                ),
                "historical_months": forecast[
                    "historical_months"
                ],
            },
            "dataset_summary": {
                "wards": len(wards),
                "substations": len(substations),
                "cleaned_charging_records": len(
                    chargers
                ),
                "mapped_existing_chargers": int(
                    wards[
                        "num_charging_stations"
                    ].sum()
                ),
                "wards_with_existing_chargers": int(
                    (
                        wards[
                            "num_charging_stations"
                        ] > 0
                    ).sum()
                ),
                "wards_without_existing_chargers": int(
                    (
                        wards[
                            "num_charging_stations"
                        ] == 0
                    ).sum()
                ),
            },
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline failed: {exc}",
        ) from exc


# =========================================================
# OPTIMIZATION
# =========================================================

@router.get("/optimization")
def get_optimization():
    try:
        result = AnalysisPipeline.run_p_median()
        selected_sites = result["selected_sites"]

        required = [
            "ward_name",
            "predicted_ward_demand",
            "num_charging_stations",
            "dist_to_grid_m",
            "road_network_km",
            "facility_index",
            "centroid_lat",
            "centroid_lon",
        ]

        missing = [
            column
            for column in required
            if column not in selected_sites.columns
        ]

        if missing:
            raise ValueError(
                f"Selected-site data is missing columns: {missing}"
            )

        records = [
            _serialize_selected_site(row)
            for _, row in selected_sites.iterrows()
        ]

        return {
            "status": "success",
            "solver_status": result["solver_status"],
            "p": len(records),
            "selected_sites": records,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"p-Median optimization failed: {exc}",
        ) from exc


# =========================================================
# COMPLETE MAP DATA
# =========================================================

@router.get("/map-data")
def get_map_data():
    """
    Complete dataset for the future analysis workspace.

    Important:
    - cleaned charging records = source dataset size
    - mapped charging stations = stations spatially
      located inside the 24 BMC wards
    """

    try:
        result = AnalysisPipeline.run_p_median()

        wards = result["wards"]
        substations = result["substations"]
        chargers = result["chargers"]
        selected_sites = result["selected_sites"]

        # -------------------------------------------------
        # WARDS
        # -------------------------------------------------

        required_ward_columns = [
            "ward_name",
            "area_sqkm",
            "centroid_lat",
            "centroid_lon",
            "pop_density",
            "poi_density",
            "road_network_km",
            "predicted_ward_demand",
            "num_charging_stations",
            "demand_per_station",
            "dist_to_grid_m",
        ]

        missing = [
            c for c in required_ward_columns
            if c not in wards.columns
        ]

        if missing:
            raise ValueError(
                f"Ward data missing columns: {missing}"
            )

        ward_records = [
            _serialize_ward(row)
            for _, row in wards.iterrows()
        ]

        # -------------------------------------------------
        # MAP CHARGERS TO WARDS
        # -------------------------------------------------

        charger_gdf = chargers.copy()

        if not isinstance(
            charger_gdf,
            gpd.GeoDataFrame,
        ):
            raise ValueError(
                "Charging dataset is not a GeoDataFrame."
            )

        mapped_chargers = gpd.sjoin(
            charger_gdf,
            wards[
                ["ward_name", "geometry"]
            ],
            how="inner",
            predicate="within",
        )

        # Remove spatial-join helper column.
        if "index_right" in mapped_chargers.columns:
            mapped_chargers = mapped_chargers.drop(
                columns=["index_right"]
            )

        charger_records = [
            _serialize_charger(row)
            for _, row in mapped_chargers.iterrows()
        ]

        # -------------------------------------------------
        # SUBSTATIONS
        # -------------------------------------------------

        required_substation_columns = [
            "substation_name",
            "utility",
            "voltage_level_kv",
            "latitude",
            "longitude",
        ]

        missing = [
            c for c in required_substation_columns
            if c not in substations.columns
        ]

        if missing:
            raise ValueError(
                f"Substation data missing columns: {missing}"
            )

        substation_records = [
            _serialize_substation(row)
            for _, row in substations.iterrows()
        ]

        # -------------------------------------------------
        # RECOMMENDED SITES
        # -------------------------------------------------

        site_records = [
            _serialize_selected_site(row)
            for _, row in selected_sites.iterrows()
        ]

        # -------------------------------------------------
        # COMPLETE PAYLOAD
        # -------------------------------------------------

        return {
            "status": "success",

            "metadata": {
                "predicted_city_demand": round(
                    result["predicted_city_demand"],
                    1,
                ),
                "historical_months": (
                    result["historical_months"]
                ),
                "solver_status": (
                    result["solver_status"]
                ),
                "p": len(site_records),

                "wards": len(ward_records),

                "substations": len(
                    substation_records
                ),

                "cleaned_charging_records": len(
                    chargers
                ),

                "mapped_existing_chargers": len(
                    charger_records
                ),
            },

            "wards": ward_records,

            "charging_stations": (
                charger_records
            ),

            "substations": (
                substation_records
            ),

            "recommended_sites": (
                site_records
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Map data generation failed: {exc}",
        ) from exc