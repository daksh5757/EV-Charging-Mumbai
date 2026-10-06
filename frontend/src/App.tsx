import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BarChart3,
  BatteryCharging,
  Building2,
  MapPin,
  Network,
  Zap,
  X,
} from "lucide-react";

import MumbaiMap from "./MumbaiMap";
import { getAnalysisMapData } from "./api";

import type {
  AnalysisMapData,
  AnalysisFilters,
  LayerVisibility,
  MapSelection,
} from "./types/analysis";

import "./App.css";
const WARD_DISPLAY_NAMES: Record<string, string> = {
  A: "A · Colaba / Fort",
  B: "B · Dongri / Bhendi Bazaar",
  C: "C · Girgaon / Marine Lines",
  D: "D · Grant Road / Malabar Hill",
  E: "E · Byculla",
  "F/S": "F/S · Parel / Sewri",
  "G/S": "G/S · Prabhadevi / Lower Parel",
  "F/N": "F/N · Matunga / Sion",
  "G/N": "G/N · Dadar / Mahim",
  N: "N · Ghatkopar",
  "R/C": "R/C · Kandivali",
  S: "S · Bhandup",
  T: "T · Mulund",
  "K/W": "K/W · Andheri West / Jogeshwari",
  "R/N": "R/N · Borivali",
  "M/E": "M/E · Govandi / Deonar",
  "M/W": "M/W · Chembur",
  "H/E": "H/E · Bandra East / Khar East",
  "K/E": "K/E · Andheri East",
  "P/S": "P/S · Goregaon",
  "P/N": "P/N · Malad",
  "R/S": "R/S · Dahisar",
  "H/W": "H/W · Bandra West / Khar West",
  L: "L · Kurla",
};

function getWardDisplayName(wardName: string): string {
  return WARD_DISPLAY_NAMES[wardName] ?? wardName;
}

const DEFAULT_LAYERS: LayerVisibility = {
  wards: true,
  chargers: true,
  substations: true,
  recommended_sites: true,
  pois: false,
};

const DEFAULT_FILTERS: AnalysisFilters = {
  ward: "ALL",
  minimumDemand: 0,
  minimumDemandPerStation: 0,
  selectedSitesOnly: false,
};

function App() {
  const [mapData, setMapData] = useState<AnalysisMapData | null>(null);
  const [layers, setLayers] =
    useState<LayerVisibility>(DEFAULT_LAYERS);

  const [filters, setFilters] =
    useState<AnalysisFilters>(DEFAULT_FILTERS);

  const [selection, setSelection] =
    useState<MapSelection>({
      type: null,
      id: null,
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAnalysisMapData();

        if (mounted) {
          setMapData(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analysis data.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredWards = useMemo(() => {
    if (!mapData) return [];

    return mapData.wards.filter((ward) => {
      const wardMatch =
        filters.ward === "ALL" ||
        ward.ward_name === filters.ward;

      const demandMatch =
        ward.predicted_ward_demand >= filters.minimumDemand;

      const supplyMatch =
        ward.demand_per_station >=
        filters.minimumDemandPerStation;

      return wardMatch && demandMatch && supplyMatch;
    });
  }, [mapData, filters]);

  const filteredSites = useMemo(() => {
    if (!mapData) return [];

    return mapData.recommended_sites.filter((site) => {
      const wardMatch =
        filters.ward === "ALL" ||
        site.ward_name === filters.ward;

      const demandMatch =
        site.predicted_ward_demand >= filters.minimumDemand;

      const supplyMatch =
        site.num_charging_stations === 0 ||
        site.predicted_ward_demand /
          Math.max(site.num_charging_stations, 1) >=
          filters.minimumDemandPerStation;

      return wardMatch && demandMatch && supplyMatch;
    });
  }, [mapData, filters]);

  const displayMapData = useMemo(() => {
    if (!mapData) return null;

    return {
      ...mapData,
      wards: filteredWards,
      recommended_sites: filters.selectedSitesOnly
        ? filteredSites
        : filteredSites,
    };
  }, [mapData, filteredWards, filteredSites, filters.selectedSitesOnly]);

  const selectedWard = useMemo(() => {
    if (!mapData || selection.type !== "ward") return null;

    return (
      mapData.wards.find(
        (ward) => ward.ward_name === selection.id,
      ) ?? null
    );
  }, [mapData, selection]);

  const selectedSite = useMemo(() => {
    if (!mapData || selection.type !== "site") return null;

    return (
      mapData.recommended_sites.find(
        (site) => site.ward_name === selection.id,
      ) ?? null
    );
  }, [mapData, selection]);

  const selectedCharger = useMemo(() => {
    if (!mapData || selection.type !== "charger") return null;

    const index = Number(
      selection.id?.split("-").pop(),
    );

    if (!Number.isNaN(index)) {
      return mapData.charging_stations[index] ?? null;
    }

    return null;
  }, [mapData, selection]);

  const selectedSubstation = useMemo(() => {
    if (!mapData || selection.type !== "substation") {
      return null;
    }

    const index = Number(
      selection.id?.split("-").pop(),
    );

    if (!Number.isNaN(index)) {
      return mapData.substations[index] ?? null;
    }

    return null;
  }, [mapData, selection]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const toggleLayer = (
    layer: keyof LayerVisibility,
  ) => {
    setLayers((current) => ({
      ...current,
      [layer]: !current[layer],
    }));
  };

  const closeInspector = () => {
    setSelection({
      type: null,
      id: null,
    });
  };

  return (
    <div className="app">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-mark">
            <Zap size={17} />
          </div>

          <span>URBAN CHARGE</span>
        </div>

        <div className="nav-links">
          <a href="#overview">Overview</a>
          <a href="#methodology">Methodology</a>
          <a href="#results">Results</a>
          <a href="#data">Data</a>
        </div>

        <a
          href="#analysis"
          className="nav-button"
        >
          Explore model
          <ArrowUpRight size={15} />
        </a>
      </nav>

      <main>
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              MUMBAI · EV INFRASTRUCTURE · SPATIAL OPTIMIZATION
            </p>

            <h1>
              Where should
              <br />
              <em>Mumbai</em> charge next?
            </h1>

            <p className="hero-description">
              A data-driven spatial optimization model for
              locating the next generation of electric vehicle
              charging infrastructure across Mumbai's 24 BMC
              wards.
            </p>

            <div className="hero-actions">
              <a
                href="#analysis"
                className="primary-button"
              >
                Explore the model
                <ArrowDown size={16} />
              </a>

              <a
                href="#methodology"
                className="secondary-button"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="hero-map">
            <div className="map-label">
              <span>LIVE MODEL VIEW</span>
              <span>MUMBAI · 24 WARDS</span>
            </div>

            <div className="hero-map-container">
              {mapData ? (
                <MumbaiMap
                  mapData={mapData}
                  layers={layers}
                  selection={selection}
                  onSelectionChange={setSelection}
                />
              ) : (
                <div className="map-loading">
                  Loading Mumbai spatial analysis...
                </div>
              )}
            </div>

            <div className="map-overlay">
              <div>
                <span>OPTIMIZATION</span>
                <strong>8 sites</strong>
              </div>

              <div>
                <span>FORECAST</span>
                <strong>
                  {mapData
                    ? mapData.metadata.predicted_city_demand.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 1,
                        },
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="stats-strip">
          <div className="stat">
            <span className="stat-number">
              {mapData?.metadata.wards ?? 24}
            </span>
            <span className="stat-label">
              BMC wards
            </span>
          </div>

          <div className="stat">
            <span className="stat-number">
              {mapData?.metadata.substations ?? 35}
            </span>
            <span className="stat-label">
              Power substations
            </span>
          </div>

          <div className="stat">
            <span className="stat-number">
              {mapData?.metadata.mapped_existing_chargers ??
                54}
            </span>
            <span className="stat-label">
              Existing chargers mapped
            </span>
          </div>

          <div className="stat">
            <span className="stat-number">
              {mapData?.metadata.p ?? 8}
            </span>
            <span className="stat-label">
              Recommended sites
            </span>
          </div>
        </section>

        {/* =====================================================
            OVERVIEW
        ===================================================== */}

        <section
          className="content-section"
          id="overview"
        >
          <div className="section-heading">
            <p className="eyebrow">
              01 · OVERVIEW
            </p>

            <h2>
              Turning Mumbai's
              <br />
              <em>spatial data</em> into decisions.
            </h2>
          </div>

          <div className="section-content">
            <p className="large-text">
              EV adoption is increasing, but charging
              infrastructure needs to grow in the right
              places. Our model combines historical EV
              registrations, population, points of interest,
              existing chargers, road networks and power-grid
              proximity.
            </p>

            <p>
              The result is a ward-level decision system that
              identifies candidate locations where projected
              demand can be served while maintaining
              reasonable access to the electrical grid.
            </p>
          </div>
        </section>

        {/* =====================================================
            METHODOLOGY
        ===================================================== */}

        <section
          className="methodology-section"
          id="methodology"
        >
          <div className="section-heading">
            <p className="eyebrow">
              02 · METHODOLOGY
            </p>

            <h2>
              From raw data
              <br />
              to <em>site selection.</em>
            </h2>
          </div>

          <div className="method-grid">
            <div className="method-card">
              <div className="method-icon">
                <BarChart3 size={21} />
              </div>

              <span className="method-number">
                01
              </span>

              <h3>
                Demand forecasting
              </h3>

              <p>
                Historical monthly EV registrations from
                2023–2025 are used to estimate the next
                monthly citywide demand.
              </p>

              <div className="method-tag">
                Linear Regression
              </div>
            </div>

            <div className="method-card">
              <div className="method-icon">
                <Building2 size={21} />
              </div>

              <span className="method-number">
                02
              </span>

              <h3>
                Ward-level demand
              </h3>

              <p>
                Forecast demand is distributed across the
                24 wards using population density and POI
                density.
              </p>

              <div className="method-tag">
                60% Population · 40% POI
              </div>
            </div>

            <div className="method-card">
              <div className="method-icon">
                <Network size={21} />
              </div>

              <span className="method-number">
                03
              </span>

              <h3>
                p-Median optimization
              </h3>

              <p>
                Eight facility locations are selected by
                minimizing demand-weighted travel distance
                while incorporating grid proximity.
              </p>

              <div className="method-tag">
                p = 8 · ILP
              </div>
            </div>

            <div className="method-card">
              <div className="method-icon">
                <BatteryCharging size={21} />
              </div>

              <span className="method-number">
                04
              </span>

              <h3>
                MCDE ranking
              </h3>

              <p>
                Candidate wards are ranked using demand,
                supply gap, grid proximity and road-network
                coverage.
              </p>

              <div className="method-tag">
                Multi-criteria scoring
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RESULTS
        ===================================================== */}

        <section
          className="results-section"
          id="results"
        >
          <div className="results-header">
            <div>
              <p className="eyebrow">
                03 · RESULTS
              </p>

              <h2>
                What the model
                <br />
                <em>sees.</em>
              </h2>
            </div>

            <p className="results-intro">
              The current model forecasts approximately{" "}
              <strong>
                {mapData
                  ? mapData.metadata.predicted_city_demand.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 1,
                      },
                    )
                  : "—"}
              </strong>{" "}
              EV registrations for the next monthly period
              and identifies eight candidate facility wards.
            </p>
          </div>

          <div className="results-grid">
            <div className="forecast-card">
              <div className="result-card-top">
                <span>FORECAST DEMAND</span>
                <BarChart3 size={18} />
              </div>

              <div className="big-number">
                {mapData
                  ? mapData.metadata.predicted_city_demand.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 1,
                      },
                    )
                  : "—"}
              </div>

              <p>
                Predicted citywide EV registrations
              </p>

              <div className="trend">
                <ArrowUpRight size={14} />
                Historical trend · 2023–2025
              </div>
            </div>

            <div className="site-card">
              <div className="result-card-top">
                <span>SELECTED SITES</span>
                <MapPin size={18} />
              </div>

              <div className="big-number">
                {mapData
                  ? String(
                      mapData.recommended_sites.length,
                    ).padStart(2, "0")
                  : "—"}
              </div>

              <p>
                Facilities selected by the current
                p-Median model
              </p>

              <div className="site-list">
                {mapData?.recommended_sites.map(
                  (site) => (
                    <span key={site.ward_name}>
                      {site.ward_name}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            DATA
        ===================================================== */}

        <section
          className="data-section"
          id="data"
        >
          <div className="section-heading">
            <p className="eyebrow">
              04 · DATA
            </p>

            <h2>
              Built from
              <br />
              <em>real datasets.</em>
            </h2>
          </div>

          <div className="data-table">
            <div className="data-row data-header">
              <span>DATASET</span>
              <span>ROLE IN MODEL</span>
              <span>COVERAGE</span>
            </div>

            <div className="data-row">
              <span>EV Registrations</span>
              <span>Demand forecasting</span>
              <span>2023–2025</span>
            </div>

            <div className="data-row">
              <span>BMC Ward Boundaries</span>
              <span>Spatial analysis</span>
              <span>24 wards</span>
            </div>

            <div className="data-row">
              <span>Population Density</span>
              <span>Demand allocation</span>
              <span>24 wards</span>
            </div>

            <div className="data-row">
              <span>OSM Roads & POIs</span>
              <span>Demand + accessibility</span>
              <span>Mumbai</span>
            </div>

            <div className="data-row">
              <span>Existing Charging Stations</span>
              <span>Supply gap</span>
              <span>
                {mapData?.metadata.mapped_existing_chargers ??
                  54}{" "}
                mapped
              </span>
            </div>

            <div className="data-row">
              <span>Power Grid Substations</span>
              <span>Grid proximity</span>
              <span>
                {mapData?.metadata.substations ?? 35}
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            OPERATING WINDOW
        ===================================================== */}

        <section
          className="analysis-workspace"
          id="analysis"
        >
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">
                OPERATING WINDOW
              </p>

              <h2>
                Mumbai spatial analysis
              </h2>
            </div>

            <div className="workspace-status">
              <span className="status-dot" />
              {loading
                ? "Loading model"
                : error
                  ? "Model error"
                  : "Live model data"}
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <strong>
                Unable to load analysis
              </strong>
              <span>{error}</span>
            </div>
          )}

          <div className="workspace-grid">
            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="workspace-sidebar">
              <div className="panel">
                <div className="panel-heading">
                  LAYERS
                </div>

                <label className="layer-row">
                  <input
                    type="checkbox"
                    checked={layers.wards}
                    onChange={() =>
                      toggleLayer("wards")
                    }
                  />
                  <span>Ward boundaries</span>
                </label>

                <label className="layer-row">
                  <input
                    type="checkbox"
                    checked={layers.chargers}
                    onChange={() =>
                      toggleLayer("chargers")
                    }
                  />
                  <span>Existing chargers</span>
                </label>

                <label className="layer-row">
                  <input
                    type="checkbox"
                    checked={layers.substations}
                    onChange={() =>
                      toggleLayer("substations")
                    }
                  />
                  <span>Power substations</span>
                </label>

                <label className="layer-row">
                  <input
                    type="checkbox"
                    checked={
                      layers.recommended_sites
                    }
                    onChange={() =>
                      toggleLayer(
                        "recommended_sites",
                      )
                    }
                  />
                  <span>Recommended sites</span>
                </label>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  FILTERS
                </div>

                <label className="filter-label">
                  Ward

                  <select
                    value={filters.ward}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        ward: event.target.value,
                      }))
                    }
                  >
                    <option value="ALL">
                      All wards
                    </option>

                    {mapData?.wards.map(
  (ward) => (
    <option
      key={ward.ward_name}
      value={ward.ward_name}
    >
      {getWardDisplayName(ward.ward_name)}
    </option>
  ),
)}
                  </select>
                </label>

                <label className="filter-label">
                  Minimum demand

                  <input
                    type="number"
                    min="0"
                    value={
                      filters.minimumDemand
                    }
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        minimumDemand:
                          Number(
                            event.target.value,
                          ) || 0,
                      }))
                    }
                  />
                </label>

                <label className="filter-label">
                  Minimum demand / station

                  <input
                    type="number"
                    min="0"
                    value={
                      filters.minimumDemandPerStation
                    }
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        minimumDemandPerStation:
                          Number(
                            event.target.value,
                          ) || 0,
                      }))
                    }
                  />
                </label>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      filters.selectedSitesOnly
                    }
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        selectedSitesOnly:
                          event.target.checked,
                      }))
                    }
                  />

                  <span>
                    Show selected sites only
                  </span>
                </label>

                <button
                  className="reset-button"
                  onClick={resetFilters}
                >
                  RESET FILTERS
                </button>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <span>
                    RECOMMENDATIONS
                  </span>

                  <strong>
                    {filteredSites.length}
                  </strong>
                </div>

                <div className="recommendation-list">
                  {filteredSites.map(
                    (site, index) => (
                      <button
                        key={site.ward_name}
                        className={`recommendation-item ${
                          selection.type ===
                            "site" &&
                          selection.id ===
                            site.ward_name
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setSelection({
                            type: "site",
                            id: site.ward_name,
                          })
                        }
                      >
                        <span className="recommendation-rank">
                          {String(index + 1).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        <span>
                          <strong>
                            {getWardDisplayName(site.ward_name)}
                          </strong>

                          <small>
                            Demand{" "}
                            {site.predicted_ward_demand.toFixed(
                              1,
                            )}
                          </small>
                        </span>
                      </button>
                    ),
                  )}

                  {filteredSites.length === 0 && (
                    <div className="no-results">
                      No sites match the current
                      filters.
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* =================================================
                MAP — NOTHING IS PLACED OVER IT
            ================================================= */}

            <section className="workspace-map">
              {displayMapData ? (
                <MumbaiMap
                  mapData={displayMapData}
                  layers={layers}
                  selection={selection}
                  onSelectionChange={
                    setSelection
                  }
                />
              ) : (
                <div className="map-loading">
                  <div>
                    <span className="loading-dot" />
                    Loading Mumbai spatial analysis...
                  </div>
                </div>
              )}

              {/* Small map metadata strip.
                  It is intentionally NOT a white full-size overlay. */}
              {mapData && (
                <div className="map-meta">
                  <div>
                    <span>SELECTED MODEL</span>
                    <strong>
                      p = {mapData.metadata.p}
                    </strong>
                  </div>

                  <div>
                    <span>SOLVER</span>
                    <strong>
                      {mapData.metadata.solver_status}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                INSPECTOR
            ================================================= */}

            <aside className="workspace-inspector">
              {!selection.type && (
                <div className="empty-inspector">
                  <p className="inspector-kicker">
                    INSPECTOR
                  </p>

                  <h3>
                    Select an element
                  </h3>

                  <p>
                    Click a ward or recommended site
                    on the map to inspect its spatial
                    and demand characteristics.
                  </p>
                </div>
              )}

              {selectedWard && (
                <div className="inspector-content">
                  <button
                    className="close-inspector"
                    onClick={closeInspector}
                  >
                    <X size={15} />
                  </button>

                  <p className="inspector-kicker">
                    WARD
                  </p>

                  <h3>
                    {selectedWard.ward_name}
                  </h3>

                  <div className="inspector-metrics">
                    <div>
                      <span>
                        FORECAST DEMAND
                      </span>
                      <strong>
                        {selectedWard.predicted_ward_demand.toFixed(
                          1,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        EXISTING CHARGERS
                      </span>
                      <strong>
                        {
                          selectedWard.num_charging_stations
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        DEMAND / STATION
                      </span>
                      <strong>
                        {selectedWard.demand_per_station.toFixed(
                          1,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        GRID DISTANCE
                      </span>
                      <strong>
                        {Math.round(
                          selectedWard.dist_to_grid_m,
                        )}{" "}
                        m
                      </strong>
                    </div>

                    <div>
                      <span>
                        POP. DENSITY
                      </span>
                      <strong>
                        {Math.round(
                          selectedWard.pop_density,
                        ).toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        ROAD NETWORK
                      </span>
                      <strong>
                        {selectedWard.road_network_km.toFixed(
                          1,
                        )}{" "}
                        km
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedSite && (
                <div className="inspector-content">
                  <button
                    className="close-inspector"
                    onClick={closeInspector}
                  >
                    <X size={15} />
                  </button>

                  <p className="inspector-kicker">
                    RECOMMENDED SITE
                  </p>

                  <h3>
                    {selectedSite.ward_name}
                  </h3>

                  <div className="inspector-metrics">
                    <div>
                      <span>
                        FORECAST DEMAND
                      </span>
                      <strong>
                        {selectedSite.predicted_ward_demand.toFixed(
                          1,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        EXISTING CHARGERS
                      </span>
                      <strong>
                        {
                          selectedSite.num_charging_stations
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        GRID DISTANCE
                      </span>
                      <strong>
                        {Math.round(
                          selectedSite.dist_to_grid_m,
                        )}{" "}
                        m
                      </strong>
                    </div>

                    <div>
                      <span>
                        ROAD NETWORK
                      </span>
                      <strong>
                        {selectedSite.road_network_km.toFixed(
                          1,
                        )}{" "}
                        km
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedCharger && (
                <div className="inspector-content">
                  <button
                    className="close-inspector"
                    onClick={closeInspector}
                  >
                    <X size={15} />
                  </button>

                  <p className="inspector-kicker">
                    EXISTING CHARGER
                  </p>

                  <h3>
                    {selectedCharger.name}
                  </h3>

                  <p className="inspector-description">
                    {selectedCharger.address}
                  </p>

                  <div className="inspector-single">
                    <span>WARD</span>
                    <strong>
                      {selectedCharger.ward_name}
                    </strong>
                  </div>
                </div>
              )}

              {selectedSubstation && (
                <div className="inspector-content">
                  <button
                    className="close-inspector"
                    onClick={closeInspector}
                  >
                    <X size={15} />
                  </button>

                  <p className="inspector-kicker">
                    POWER SUBSTATION
                  </p>

                  <h3>
                    {
                      selectedSubstation.substation_name
                    }
                  </h3>

                  <div className="inspector-single">
                    <span>UTILITY</span>
                    <strong>
                      {selectedSubstation.utility}
                    </strong>
                  </div>

                  <div className="inspector-single">
                    <span>VOLTAGE</span>
                    <strong>
                      {
                        selectedSubstation.voltage_level_kv
                      }{" "}
                      kV
                    </strong>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">
        <div className="footer-brand">
          <div className="brand-mark">
            <Zap size={17} />
          </div>

          <span>URBAN CHARGE</span>
        </div>

        <div className="footer-center">
          Spatial Optimization of EV Charging
          Infrastructure in Mumbai
        </div>

        <div className="footer-right">
          <span>FYP · 2026</span>
        </div>
      </footer>
    </div>
  );
}

export default App;