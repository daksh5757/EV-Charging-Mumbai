# ⚡ EV-Charging-Mumbai

## EV Charging Infrastructure Demand Forecasting & Location Optimization for Mumbai

> An ongoing data-driven project for forecasting EV charging demand and identifying suitable locations for future EV charging infrastructure across Mumbai's BMC wards.

**Status:** 🚧 Active Development

---

## 📌 Project Overview

Mumbai is experiencing rapid growth in electric vehicle adoption, creating an increasing need for reliable and strategically distributed EV charging infrastructure.

Simply increasing the number of charging stations is not enough. Charging infrastructure needs to be placed where it can effectively serve current and future EV demand.

This project aims to develop a data-driven decision-support system that combines:

- Machine Learning
- Demand Forecasting
- Geospatial Analysis
- Spatial Data Processing
- Infrastructure Analysis
- Location Ranking
- Optimization

to answer two major questions:

1. Where is EV charging demand likely to increase?
2. Where should new EV charging stations be strategically located?

The current implementation focuses on Mumbai's BMC wards and is being progressively expanded into a comprehensive EV infrastructure planning platform.

---

## 🎯 Objectives

### 1. EV Demand Forecasting

Analyze historical EV registration data and develop forecasting models to estimate future EV demand.

### 2. Ward-Level Demand Allocation

Estimate EV demand at the BMC ward level using spatial and demographic factors such as:

- Population
- Population density
- Commercial activity
- Existing EV infrastructure
- Geographic characteristics
- Points of Interest

### 3. Charging Station Analysis

Analyze existing EV charging infrastructure to identify:

- Areas with high infrastructure coverage
- Areas with low infrastructure coverage
- Spatial gaps
- Relationship between EV demand and charging availability

### 4. Optimal Charging Location Identification

Develop an optimization framework that ranks potential locations for new charging stations using multiple factors:

- Predicted EV demand
- Accessibility
- Population
- Commercial activity
- Existing charging infrastructure
- Road connectivity
- Electrical infrastructure
- Spatial constraints

### 5. Power Infrastructure Integration

The project is also being expanded to incorporate power-grid substations.

This helps ensure that a location with high EV demand is also evaluated from an electrical-infrastructure perspective.

---

## 🧠 Methodology

The overall pipeline is currently structured as:

EV Registration Data
        ↓
Data Cleaning & Preprocessing
        ↓
Demand Forecasting
        ↓
Ward-Level Demand Allocation
        ↓
Spatial Analysis
        ↓
Existing Charging Infrastructure Analysis
        ↓
Power-Grid Infrastructure Analysis
        ↓
Candidate Location Scoring
        ↓
Optimization
        ↓
Ranked Charging Locations
        ↓
Interactive Dashboard

---

## 🗺️ Geographic Scope

The current project focuses on Mumbai's BMC ward-level geography.

The spatial framework allows datasets from different sources to be integrated into a common geographic structure.

Current geographic components include:

- BMC ward boundaries
- EV registration data
- Existing EV charging stations
- Roads and relevant POIs
- Population information
- Power-grid substations

---

## 📊 Dataset Components

### EV Registration Data

Historical EV registration records are used as the primary signal for estimating EV demand.

Current dataset:

`data/raw/mumbai_ev_registrations_2023_2025_clean.csv`

The dataset will be expanded with newer registration periods as additional data becomes available.

### Existing Charging Infrastructure

Used to analyze the current distribution of EV charging stations.

`data/raw/cleaned_ev_charging_data.csv`

### Mumbai Ward Boundaries

Used as the geographic framework for ward-level analysis.

`data/raw/BMC_Wards (1).geojson`

### Power Grid Infrastructure

Curated power-grid substation data is used to incorporate electrical infrastructure into the optimization process.

`data/raw/mumbai_power_grid_substations_curated.csv`

---

## 🤖 Machine Learning & Data Science

The project combines machine learning, data analytics and spatial optimization.

| Component | Purpose |
|---|---|
| Data preprocessing | Clean and standardize datasets |
| Exploratory analysis | Understand EV adoption patterns |
| Demand forecasting | Estimate future EV demand |
| Spatial analysis | Analyze geographic patterns |
| Demand allocation | Estimate ward-level demand |
| Ranking | Prioritize candidate locations |
| Optimization | Identify suitable charging locations |
| Power-grid integration | Consider electrical feasibility |
| Visualization | Present results through an interactive dashboard |

---

## 🏗️ Backend Architecture

The backend is built using Python and FastAPI.

```text
backend/
│
├── app/
│   ├── api/
│   │   └── routes_analysis.py
│   │
│   ├── core/
│   │   └── config.py
│   │
│   ├── services/
│   │   ├── charging.py
│   │   ├── demand_allocation.py
│   │   ├── forecasting.py
│   │   ├── optimizer.py
│   │   ├── pipeline.py
│   │   ├── ranking.py
│   │   └── spatial_utils.py
│   │
│   └── main.py
│
├── tests/
│   ├── test_forecasting.py
│   └── test_spatial_utils.py
│
└── requirements.txt





The service-based architecture allows individual components of the analysis pipeline to be improved independently.

🖥️ Frontend

The dashboard is being developed using:

React
TypeScript
Vite
CSS
Interactive map visualization

Current frontend components include:

frontend/
│
├── public/
│
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── MumbaiMap.tsx
│   ├── api.ts
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── types/
│   │   └── analysis.ts
│   │
│   └── data/
│       └── BMC_Wards.geojson
│
├── package.json
└── vite.config.ts

The frontend will provide an interactive interface for exploring Mumbai's EV infrastructure and visualizing outputs from the backend analysis pipeline.

⚡ Optimization Framework

The charging-location optimization layer evaluates multiple criteria rather than selecting locations based on EV count alone.

A conceptual suitability score is:

Location Score =
    Demand
  + Accessibility
  + Population
  + Commercial Activity
  + Infrastructure Gap
  + Power Availability
  - Distance / Constraint Penalties

The exact weighting and optimization strategy are currently being refined as development continues.

⚡ Why Power-Grid Data Matters

Charging-station planning is not only a transportation problem.

A location may have:

High EV demand
Good accessibility
High population
Strong commercial activity

but still be difficult to implement if suitable electrical infrastructure is unavailable nearby.

Therefore, the project is being expanded to incorporate power-grid infrastructure into the location-ranking process.

🚧 Current Development Status
Implemented
 Mumbai BMC ward geographic data
 EV registration dataset integration
 Existing charging infrastructure dataset
 Power-grid substation dataset
 FastAPI backend structure
 Data-processing services
 Forecasting module
 Spatial utility functions
 Demand allocation module
 Candidate ranking module
 Optimization module
 Analysis API
 React + TypeScript frontend
 Mumbai ward map integration
 Initial backend tests
 Git/GitHub project structure
Currently Being Expanded
 Improve demand forecasting accuracy
 Add newer EV registration periods
 Improve ward-level demand allocation
 Refine optimization weights
 Improve power-grid integration
 Add additional spatial features
 Improve candidate-location ranking
 Connect all backend outputs to the dashboard
 Improve interactive map visualization
 Add analytics and charts
 Validate recommendations against real-world constraints
Future Scope
 Real-time/periodic EV registration updates
 Traffic and mobility data integration
 Charging-station utilization data
 EV type and battery-category analysis
 Time-based charging demand
 Multi-objective optimization
 Grid capacity constraints
 Scenario-based infrastructure planning
 Cloud deployment

**This is the format I meant.** You can copy the entire block directly into `README.md`.

If you want, I can also **create the complete README.md file for you automatically**, so you don't have to copy/paste this huge thing.
