export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GeoJSONGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

export interface Ward {
  ward_name: string;
  ward_gid?: string;
  area_sqkm: number;
  centroid: Coordinate;

  pop_density: number;
  poi_density: number;
  road_network_km: number;

  predicted_ward_demand: number;
  num_charging_stations: number;
  demand_per_station: number;
  dist_to_grid_m: number;

  geometry: GeoJSONGeometry;
}

export interface ChargingStation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  ward_name: string;
}

export interface Substation {
  substation_name: string;
  utility: string;
  voltage_level_kv: string;
  latitude: number;
  longitude: number;
}

export interface RecommendedSite {
  ward_name: string;
  predicted_ward_demand: number;
  num_charging_stations: number;
  dist_to_grid_m: number;
  road_network_km: number;
  facility_index: number;
  centroid: Coordinate;
}

export interface AnalysisMetadata {
  predicted_city_demand: number;
  historical_months: number;
  solver_status: string;
  p: number;
  wards: number;
  substations: number;
  cleaned_charging_records: number;
  mapped_existing_chargers: number;
}

export interface AnalysisMapData {
  status: string;
  metadata: AnalysisMetadata;
  wards: Ward[];
  charging_stations: ChargingStation[];
  substations: Substation[];
  recommended_sites: RecommendedSite[];
}

export interface AnalysisSummary {
  status: string;

  forecast: {
    predicted_city_demand: number;
    historical_months: number;
  };

  dataset_summary: {
    wards: number;
    substations: number;
    cleaned_charging_records: number;
    mapped_existing_chargers: number;
    wards_with_existing_chargers: number;
    wards_without_existing_chargers: number;
  };
}

export interface OptimizationResult {
  status: string;
  solver_status: string;
  p: number;
  selected_sites: RecommendedSite[];
}

/* -----------------------------
   Workspace state
----------------------------- */

export type MapLayer =
  | "wards"
  | "chargers"
  | "substations"
  | "recommended_sites"
  | "pois";

export interface LayerVisibility {
  wards: boolean;
  chargers: boolean;
  substations: boolean;
  recommended_sites: boolean;
  pois: boolean;
}

export interface AnalysisFilters {
  ward: string;
  minimumDemand: number;
  minimumDemandPerStation: number;
  selectedSitesOnly: boolean;
}

export type SelectionType =
  | "ward"
  | "charger"
  | "substation"
  | "site"
  | "poi"
  | null;

export interface MapSelection {
  type: SelectionType;
  id: string | null;
}