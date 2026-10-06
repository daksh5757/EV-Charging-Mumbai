import numpy as np
import pandas as pd


# ------------------------------------------------------------------
# Static ward-level research features
#
# These are the ward statistics used in the original research
# notebook. Do not replace these with fabricated values.
# ------------------------------------------------------------------

WARD_STATS = {
    "A": {
        "pop_density": 16505.7,
        "poi_density": 48.09,
        "road_km": 118.2,
    },
    "B": {
        "pop_density": 47885.5,
        "poi_density": 47.02,
        "road_km": 64.5,
    },
    "C": {
        "pop_density": 86857.7,
        "poi_density": 35.02,
        "road_km": 52.1,
    },
    "D": {
        "pop_density": 42180.2,
        "poi_density": 22.74,
        "road_km": 134.8,
    },
    "E": {
        "pop_density": 54068.2,
        "poi_density": 6.46,
        "road_km": 112.4,
    },
    "F/N": {
        "pop_density": 43068.2,
        "poi_density": 22.79,
        "road_km": 145.0,
    },
    "F/S": {
        "pop_density": 36879.3,
        "poi_density": 4.19,
        "road_km": 88.6,
    },
    "G/N": {
        "pop_density": 68351.1,
        "poi_density": 26.47,
        "road_km": 168.3,
    },
    "G/S": {
        "pop_density": 40645.4,
        "poi_density": 13.67,
        "road_km": 122.9,
    },
    "H/E": {
        "pop_density": 44869.0,
        "poi_density": 18.20,
        "road_km": 178.5,
    },
    "H/W": {
        "pop_density": 34065.3,
        "poi_density": 105.33,
        "road_km": 142.1,
    },
    "K/E": {
        "pop_density": 34380.2,
        "poi_density": 13.77,
        "road_km": 252.6,
    },
    "K/W": {
        "pop_density": 30492.9,
        "poi_density": 47.12,
        "road_km": 276.2,
    },
    "L": {
        "pop_density": 57534.7,
        "poi_density": 10.59,
        "road_km": 207.8,
    },
    "M/E": {
        "pop_density": 24415.3,
        "poi_density": 7.41,
        "road_km": 130.4,
    },
    "M/W": {
        "pop_density": 23667.1,
        "poi_density": 7.64,
        "road_km": 110.1,
    },
    "N": {
        "pop_density": 24245.2,
        "poi_density": 5.06,
        "road_km": 148.9,
    },
    "P/N": {
        "pop_density": 20150.5,
        "poi_density": 1.71,
        "road_km": 214.3,
    },
    "P/S": {
        "pop_density": 18399.7,
        "poi_density": 4.13,
        "road_km": 165.7,
    },
    "R/C": {
        "pop_density": 11704.9,
        "poi_density": 2.71,
        "road_km": 125.0,
    },
    "R/N": {
        "pop_density": 30423.4,
        "poi_density": 4.94,
        "road_km": 139.2,
    },
    "R/S": {
        "pop_density": 37745.1,
        "poi_density": 5.84,
        "road_km": 198.6,
    },
    "S": {
        "pop_density": 24999.2,
        "poi_density": 17.31,
        "road_km": 186.4,
    },
    "T": {
        "pop_density": 7964.1,
        "poi_density": 7.70,
        "road_km": 141.0,
    },
}


class DemandAllocationService:
    """
    Allocates forecast citywide EV demand to the 24 Mumbai wards.

    Research methodology:

        Wi =
            0.60 * normalized population density
            +
            0.40 * normalized POI density

        predicted_ward_demand =
            Wi * predicted_city_demand

    The implementation follows the original research notebook.
    """

    @staticmethod
    def get_ward_stats() -> pd.DataFrame:
        """
        Return the research ward statistics as a DataFrame.
        """

        rows = []

        for ward_name, values in WARD_STATS.items():
            rows.append(
                {
                    "ward_name": ward_name,
                    "pop_density": values["pop_density"],
                    "poi_density": values["poi_density"],
                    "road_network_km": values["road_km"],
                }
            )

        return pd.DataFrame(rows)

    @staticmethod
    def allocate_demand(
        wards: pd.DataFrame,
        predicted_city_demand: float,
    ) -> pd.DataFrame:
        """
        Add research-based demand allocation to the ward dataset.
        """

        if predicted_city_demand < 0:
            raise ValueError(
                "Predicted city demand cannot be negative."
            )

        required_columns = ["ward_name"]

        missing_columns = [
            column
            for column in required_columns
            if column not in wards.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {missing_columns}"
            )

        result = wards.copy()

        stats = DemandAllocationService.get_ward_stats()

        result = result.merge(
            stats,
            on="ward_name",
            how="left",
            validate="one_to_one",
        )

        if result[
            ["pop_density", "poi_density", "road_network_km"]
        ].isnull().any().any():
            missing_wards = result.loc[
                result[
                    ["pop_density", "poi_density", "road_network_km"]
                ].isnull().any(axis=1),
                "ward_name",
            ].tolist()

            raise ValueError(
                f"Missing research statistics for wards: {missing_wards}"
            )

        # ----------------------------------------------------------
        # Normalize population and POI density by citywide totals.
        # This follows the original notebook.
        # ----------------------------------------------------------

        population_total = result["pop_density"].sum()

        poi_total = result["poi_density"].sum()

        if population_total <= 0:
            raise ValueError(
                "Total population density must be positive."
            )

        if poi_total <= 0:
            raise ValueError(
                "Total POI density must be positive."
            )

        result["population_share"] = (
            result["pop_density"] / population_total
        )

        result["poi_share"] = (
            result["poi_density"] / poi_total
        )

        # ----------------------------------------------------------
        # 60% population + 40% POI
        # ----------------------------------------------------------

        result["demand_weight"] = (
            0.60 * result["population_share"]
            + 0.40 * result["poi_share"]
        )

        # ----------------------------------------------------------
        # Allocate forecast citywide demand to wards.
        # ----------------------------------------------------------

        result["predicted_ward_demand"] = np.round(
            result["demand_weight"] * predicted_city_demand,
            1,
        )

        # ----------------------------------------------------------
        # Existing charging supply gap.
        # ----------------------------------------------------------

        if "num_charging_stations" in result.columns:
            result["demand_per_station"] = np.where(
                result["num_charging_stations"] == 0,
                result["predicted_ward_demand"],
                np.round(
                    result["predicted_ward_demand"]
                    / result["num_charging_stations"],
                    1,
                ),
            )

        return result