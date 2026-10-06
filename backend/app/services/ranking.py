import pandas as pd


class RankingService:

    @staticmethod
    def min_max(series: pd.Series, invert: bool = False) -> pd.Series:
        minimum = series.min()
        maximum = series.max()

        norm = (series - minimum) / (maximum - minimum + 1e-6)

        if invert:
            return 1 - norm

        return norm

    @staticmethod
    def rank_sites(candidate_sites: pd.DataFrame) -> pd.DataFrame:

        required_columns = [
            "predicted_ward_demand",
            "demand_per_station",
            "dist_to_grid_m",
            "road_network_km",
        ]

        missing = [
            col for col in required_columns
            if col not in candidate_sites.columns
        ]

        if missing:
            raise ValueError(
                f"Missing ranking columns: {missing}"
            )

        result = candidate_sites.copy()

        # Original Cell 8 normalization
        norm_demand = RankingService.min_max(
            result["predicted_ward_demand"]
        )

        norm_gap = RankingService.min_max(
            result["demand_per_station"]
        )

        # Closer to grid = better
        norm_grid = RankingService.min_max(
            result["dist_to_grid_m"],
            invert=True,
        )

        norm_roads = RankingService.min_max(
            result["road_network_km"]
        )

        # Exact MCDE weights from notebook
        result["composite_score"] = (
            0.35 * norm_demand
            + 0.25 * norm_gap
            + 0.20 * norm_grid
            + 0.20 * norm_roads
        ) * 100

        result = (
            result
            .sort_values(
                by="composite_score",
                ascending=False,
            )
            .reset_index(drop=True)
        )

        result["rank"] = result.index + 1

        return result