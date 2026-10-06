import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.linear_model import LinearRegression


class ForecastingService:
    @staticmethod
    def load_registrations(file_path: Path) -> pd.DataFrame:
        """Load pre-cleaned historical EV registration data."""

        if not file_path.exists():
            raise FileNotFoundError(
                f"EV registration file not found at {file_path}"
            )

        df = pd.read_csv(file_path)

        required_columns = [
            "Year",
            "Month",
            "EV Registrations"
        ]

        missing_columns = [
            column for column in required_columns
            if column not in df.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {missing_columns}"
            )

        return df

    @staticmethod
    def predict_next_month(ev_trend: pd.DataFrame) -> float:
        """
        Replicates the original notebook Cell 2 logic.

        1. Aggregate EV registrations by Year and Month.
        2. Create sequential month_index.
        3. Fit Linear Regression.
        4. Predict the following month.
        """

        # Original notebook:
        # monthly_trend = ev_trend.groupby(
        #     ['Year', 'Month']
        # )['EV Registrations'].sum().reset_index()

        monthly_trend = (
            ev_trend
            .groupby(["Year", "Month"])["EV Registrations"]
            .sum()
            .reset_index()
        )

        # Original notebook:
        # monthly_trend['month_index'] = np.arange(len(monthly_trend))

        monthly_trend["month_index"] = np.arange(
            len(monthly_trend)
        )

        X = monthly_trend[["month_index"]]
        y = monthly_trend["EV Registrations"]

        # Original notebook:
        # reg_model = LinearRegression()
        # reg_model.fit(X, y)

        reg_model = LinearRegression()
        reg_model.fit(X, y)

        # Original notebook:
        # next_month_idx = np.array([[len(monthly_trend)]])

        next_month_idx = np.array([
            [len(monthly_trend)]
        ])

        predicted_city_demand = float(
            reg_model.predict(next_month_idx)[0]
        )

        return predicted_city_demand

    @staticmethod
    def get_monthly_trend(
        ev_trend: pd.DataFrame
    ) -> pd.DataFrame:
        """Return the aggregated monthly city-wide EV trend."""

        monthly_trend = (
            ev_trend
            .groupby(["Year", "Month"])["EV Registrations"]
            .sum()
            .reset_index()
        )

        monthly_trend["month_index"] = np.arange(
            len(monthly_trend)
        )

        return monthly_trend