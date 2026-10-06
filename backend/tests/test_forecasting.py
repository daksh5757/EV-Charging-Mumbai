import pandas as pd

from app.services.forecasting import ForecastingService


def test_monthly_trend_has_30_months():
    data = pd.DataFrame({
        "Year": [2023, 2023, 2023, 2024, 2024, 2024],
        "Month": [1, 2, 3, 1, 2, 3],
        "EV Registrations": [100, 120, 140, 160, 180, 200]
    })

    monthly = ForecastingService.get_monthly_trend(data)

    assert len(monthly) == 6
    assert list(monthly["month_index"]) == [0, 1, 2, 3, 4, 5]


def test_forecast_returns_number():
    data = pd.DataFrame({
        "Year": [2023, 2023, 2023, 2024],
        "Month": [1, 2, 3, 1],
        "EV Registrations": [100, 120, 140, 160]
    })

    prediction = ForecastingService.predict_next_month(data)

    assert isinstance(prediction, float)