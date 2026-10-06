from app.core.config import settings

from app.services.spatial_utils import SpatialService
from app.services.forecasting import ForecastingService
from app.services.demand_allocation import DemandAllocationService
from app.services.charging import ChargingService
from app.services.optimizer import PMedianOptimizer


class AnalysisPipeline:
    """
    Central research pipeline for the Mumbai EV charging analysis.

    Research flow:

        EV registrations
              ↓
        Linear regression forecast
              ↓
        Ward demand allocation
              ↓
        Existing charging supply
              ↓
        Grid proximity
              ↓
        Ward distance matrix
              ↓
        p-Median ILP
    """

    # =========================================================
    # SOURCE DATA
    # =========================================================

    @staticmethod
    def load_wards():
        ward_file = settings.RAW_DATA_DIR / "BMC_Wards (1).geojson"

        if not ward_file.exists():
            ward_file = settings.RAW_DATA_DIR / "BMC_Wards.geojson"

        return SpatialService.load_wards(ward_file)

    @staticmethod
    def load_substations():
        substation_file = (
            settings.RAW_DATA_DIR
            / "mumbai_power_grid_substations_curated.csv"
        )

        return SpatialService.load_substations(
            substation_file
        )

    @staticmethod
    def load_ev_registrations():
        ev_file = (
            settings.RAW_DATA_DIR
            / "mumbai_ev_registrations_2023_2025_clean.csv"
        )

        return ForecastingService.load_registrations(
            ev_file
        )

    @staticmethod
    def load_chargers():
        charger_file = (
            settings.RAW_DATA_DIR
            / "cleaned_ev_charging_data.csv"
        )

        return ChargingService.load_charging_data(
            charger_file
        )

    # =========================================================
    # BASE DATA
    # =========================================================

    @classmethod
    def load_base_data(cls):
        """
        Load all real source datasets and calculate the
        spatial features required by the research model.
        """

        wards = cls.load_wards()

        substations = cls.load_substations()

        ev_registrations = cls.load_ev_registrations()

        chargers = cls.load_chargers()

        # Ward area and centroid information
        wards = SpatialService.calculate_ward_metrics(
            wards
        )

        # Existing charging stations mapped to wards
        wards = ChargingService.add_station_counts(
            wards,
            chargers,
        )

        # Distance from each ward centroid to the
        # nearest power-grid substation
        grid_distances = (
            SpatialService.calculate_grid_proximity(
                wards,
                substations,
            )
        )

        wards["dist_to_grid_m"] = grid_distances

        return {
            "wards": wards,
            "substations": substations,
            "ev_registrations": ev_registrations,
            "chargers": chargers,
        }

    # =========================================================
    # FORECAST
    # =========================================================

    @classmethod
    def run_forecast(cls):
        """
        Run the same city-level next-month linear regression
        used in the original research notebook.
        """

        ev_registrations = cls.load_ev_registrations()

        predicted_city_demand = (
            ForecastingService.predict_next_month(
                ev_registrations
            )
        )

        monthly_trend = (
            ForecastingService.get_monthly_trend(
                ev_registrations
            )
        )

        return {
            "predicted_city_demand": predicted_city_demand,
            "historical_months": len(monthly_trend),
            "monthly_trend": monthly_trend,
        }

    # =========================================================
    # DEMAND ALLOCATION
    # =========================================================

    @classmethod
    def run_demand_allocation(cls):
        """
        Allocate the forecast citywide demand to the
        24 BMC wards using the research 60/40 model.
        """

        base_data = cls.load_base_data()

        forecast = cls.run_forecast()

        wards = DemandAllocationService.allocate_demand(
            base_data["wards"],
            forecast["predicted_city_demand"],
        )

        return {
            "wards": wards,
            "substations": base_data["substations"],
            "chargers": base_data["chargers"],
            "ev_registrations": base_data["ev_registrations"],
            "predicted_city_demand": (
                forecast["predicted_city_demand"]
            ),
            "historical_months": (
                forecast["historical_months"]
            ),
            "monthly_trend": forecast["monthly_trend"],
        }

    # =========================================================
    # P-MEDIAN OPTIMIZATION
    # =========================================================

    @classmethod
    def run_p_median(cls):
        """
        Run the research p-Median integer linear programming model.

        Objective:

            demand-weighted ward-to-facility distance
            +
            grid proximity penalty

        Configuration:

            p = 8
            alpha = 0.05
        """

        # -----------------------------------------------------
        # Run demand allocation first.
        # -----------------------------------------------------

        demand_data = cls.run_demand_allocation()

        wards = demand_data["wards"]

        # -----------------------------------------------------
        # Generate the real ward-to-ward distance matrix.
        #
        # SpatialService projects the ward geometries into
        # EPSG:32643 before calculating centroid distances.
        # -----------------------------------------------------

        distance_matrix = (
            SpatialService.generate_distance_matrix(
                wards
            )
        )

        # -----------------------------------------------------
        # Run the existing p-Median optimizer.
        #
        # IMPORTANT:
        # We are using the existing optimizer unchanged.
        # -----------------------------------------------------

        selected_sites, solver_status = (
            PMedianOptimizer.optimize(
                wards=wards,
                distance_matrix=distance_matrix,
                p=settings.P_MEDIAN_SITES,
                alpha=settings.GRID_PENALTY_ALPHA,
            )
        )

        return {
            "wards": wards,

            "substations": demand_data[
                "substations"
            ],

            "chargers": demand_data[
                "chargers"
            ],

            "ev_registrations": demand_data[
                "ev_registrations"
            ],

            "monthly_trend": demand_data[
                "monthly_trend"
            ],

            "predicted_city_demand": demand_data[
                "predicted_city_demand"
            ],

            "historical_months": demand_data[
                "historical_months"
            ],

            "distance_matrix": distance_matrix,

            "selected_sites": selected_sites,

            "solver_status": solver_status,
        }