import numpy as np
import pandas as pd
import pulp


class PMedianOptimizer:

    @staticmethod
    def optimize(
        wards: pd.DataFrame,
        distance_matrix: np.ndarray,
        p: int = 8,
        alpha: float = 0.05,
    ) -> tuple[pd.DataFrame, str]:

        n_wards = len(wards)

        # ---------------------------------------------------------
        # Validation
        # ---------------------------------------------------------

        if distance_matrix.shape != (n_wards, n_wards):
            raise ValueError(
                "Distance matrix dimensions do not match ward count."
            )

        if "predicted_ward_demand" not in wards.columns:
            raise ValueError(
                "Missing required column: predicted_ward_demand"
            )

        if "dist_to_grid_m" not in wards.columns:
            raise ValueError(
                "Missing required column: dist_to_grid_m"
            )

        if p > n_wards:
            raise ValueError(
                f"p={p} cannot exceed {n_wards} wards."
            )

        # ---------------------------------------------------------
        # Model inputs
        # ---------------------------------------------------------

        demand_vector = wards[
            "predicted_ward_demand"
        ].to_numpy(dtype=float)

        grid_penalty = (
            wards["dist_to_grid_m"].to_numpy(dtype=float)
            * alpha
        )

        # ---------------------------------------------------------
        # Create ILP model
        # ---------------------------------------------------------

        model = pulp.LpProblem(
            "Mumbai_EV_p_Median_Optimization",
            pulp.LpMinimize,
        )

        # ---------------------------------------------------------
        # Decision variables
        #
        # y[j] = 1 if facility j is opened
        #
        # x[i,j] = 1 if ward i is assigned to facility j
        # ---------------------------------------------------------

        y = model.add_variable_dicts(
            "SiteOpen",
            range(n_wards),
            cat="Binary",
        )

        x = model.add_variable_dicts(
            "Assign",
            (
                (i, j)
                for i in range(n_wards)
                for j in range(n_wards)
            ),
            cat="Binary",
        )

        # ---------------------------------------------------------
        # Objective
        #
        # Demand-weighted travel distance
        # +
        # Grid interconnection penalty
        # ---------------------------------------------------------

        travel_cost = pulp.lpSum(
            demand_vector[i]
            * distance_matrix[i][j]
            * x[i, j]
            for i in range(n_wards)
            for j in range(n_wards)
        )

        grid_cost = pulp.lpSum(
            grid_penalty[j] * y[j]
            for j in range(n_wards)
        )

        model += travel_cost + grid_cost

        # ---------------------------------------------------------
        # Constraint 1
        #
        # Exactly p facilities
        # ---------------------------------------------------------

        model += (
            pulp.lpSum(
                y[j]
                for j in range(n_wards)
            )
            == p
        )

        # ---------------------------------------------------------
        # Constraint 2
        #
        # Every ward assigned exactly once
        # ---------------------------------------------------------

        for i in range(n_wards):
            model += (
                pulp.lpSum(
                    x[i, j]
                    for j in range(n_wards)
                )
                == 1
            )

        # ---------------------------------------------------------
        # Constraint 3
        #
        # Assignment only to opened facility
        # ---------------------------------------------------------

        for i in range(n_wards):
            for j in range(n_wards):
                model += (
                    x[i, j] <= y[j]
                )

        # ---------------------------------------------------------
        # Solve with CBC
        # ---------------------------------------------------------

        solver = pulp.COIN_CMD(
            msg=False
        )

        stats = model.solve(solver)

        # PuLP 4.0 returns LpSolveStats
        status = stats.status_str

        if not stats.has_solution:
            raise RuntimeError(
                "p-Median optimization failed. "
                f"Solver status: {status}"
            )

        # ---------------------------------------------------------
        # Extract selected facilities
        # ---------------------------------------------------------

        selected_indices = [
            j
            for j in range(n_wards)
            if y[j].value() == 1
        ]

        if len(selected_indices) != p:
            raise RuntimeError(
                f"Expected {p} selected facilities, "
                f"but found {len(selected_indices)}."
            )

        # ---------------------------------------------------------
        # Selected candidate wards
        # ---------------------------------------------------------

        selected_sites = wards.iloc[
            selected_indices
        ].copy()

        selected_sites["facility_index"] = (
            selected_indices
        )

        return selected_sites, status