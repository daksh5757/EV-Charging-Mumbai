import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polygon,
} from "@vis.gl/react-google-maps";

import type {
  AnalysisMapData,
  LayerVisibility,
  MapSelection,
} from "./types/analysis";

const MUMBAI_CENTER = {
  lat: 19.076,
  lng: 72.8777,
};

/*
 * FRONTEND-ONLY DISPLAY NAMES
 *
 * These do NOT change the backend ward IDs.
 * Backend continues to use:
 * A, B, C, F/N, G/S, etc.
 */
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

interface MumbaiMapProps {
  mapData: AnalysisMapData | null;
  layers: LayerVisibility;
  selection: MapSelection;
  onSelectionChange: (selection: MapSelection) => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

function convertRing(
  coordinates: number[][],
): Coordinate[] {
  return coordinates.map(([lng, lat]) => ({
    lat,
    lng,
  }));
}

function getWardPolygons(
  geometry: {
    type: string;
    coordinates: unknown;
  },
): Coordinate[][] {
  if (geometry.type === "Polygon") {
    const coordinates =
      geometry.coordinates as number[][][];

    return coordinates.map((ring) =>
      convertRing(ring),
    );
  }

  if (geometry.type === "MultiPolygon") {
    const coordinates =
      geometry.coordinates as number[][][][];

    return coordinates.flatMap((polygon) =>
      polygon.map((ring) =>
        convertRing(ring),
      ),
    );
  }

  return [];
}

export default function MumbaiMap({
  mapData,
  layers,
  selection,
  onSelectionChange,
}: MumbaiMapProps) {
  if (!mapData) {
    return (
      <div className="map-loading">
        Loading Mumbai spatial analysis...
      </div>
    );
  }

  /*
   * IMPORTANT:
   * These remain the ORIGINAL backend IDs.
   */
  const selectedWard =
    selection.type === "ward"
      ? selection.id
      : null;

  const selectedSite =
    selection.type === "site"
      ? selection.id
      : null;

  return (
    <div className="mumbai-map-root">
      <APIProvider
        apiKey={
          import.meta.env
            .VITE_GOOGLE_MAPS_API_KEY
        }
      >
        <Map
          defaultCenter={MUMBAI_CENTER}
          defaultZoom={11}
          mapId="EV_CHARGING_MUMBAI"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl
          fullscreenControl
          streetViewControl
          mapTypeControl
          mapTypeControlOptions={{
            position: 3,
          }}
          zoomControlOptions={{
            position: 7,
          }}
          fullscreenControlOptions={{
            position: 9,
          }}
          streetViewControlOptions={{
            position: 9,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          {/* =================================================
              MUMBAI CENTER
          ================================================= */}

          <AdvancedMarker
            position={MUMBAI_CENTER}
          />

          {/* =================================================
              WARD BOUNDARIES
          ================================================= */}

          {layers.wards &&
            mapData.wards.flatMap((ward) =>
              getWardPolygons(
                ward.geometry,
              ).map(
                (
                  path,
                  polygonIndex,
                ) => {
                  const isSelected =
                    selectedWard ===
                    ward.ward_name;

                  return (
                    <Polygon
                      /*
                       * KEEP ORIGINAL WARD CODE
                       * AS INTERNAL KEY
                       */
                      key={`${ward.ward_name}-${polygonIndex}`}
                      paths={path}
                      options={{
                        fillColor: isSelected
                          ? "#b45309"
                          : "#d97745",

                        fillOpacity:
                          isSelected
                            ? 0.20
                            : 0.07,

                        strokeColor:
                          isSelected
                            ? "#92400e"
                            : "#c65b32",

                        strokeOpacity: 0.85,

                        strokeWeight:
                          isSelected
                            ? 2.5
                            : 1.3,

                        clickable: true,
                      }}
                      onClick={() =>
                        onSelectionChange({
                          type: "ward",

                          /*
                           * BACKEND ID UNCHANGED
                           */
                          id: ward.ward_name,
                        })
                      }
                    />
                  );
                },
              ),
            )}

          {/* =================================================
              WARD DISPLAY LABELS

              FRONTEND ONLY.

              Backend still uses:
              C
              G/S
              F/N
              etc.

              User sees:
              C · Girgaon / Marine Lines
              G/S · Prabhadevi / Lower Parel
              etc.
          ================================================= */}

          {layers.wards &&
            mapData.wards.map(
              (ward) => {
                const isSelected =
                  selectedWard ===
                  ward.ward_name;

                return (
                  <AdvancedMarker
                    /*
                     * ORIGINAL BACKEND CODE
                     */
                    key={`ward-label-${ward.ward_name}`}
                    position={
                      ward.centroid
                    }
                    zIndex={
                      isSelected
                        ? 20
                        : 10
                    }
                  >
                    <div
                      className={`ward-map-label ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();

                        onSelectionChange({
                          type: "ward",

                          /*
                           * ORIGINAL BACKEND ID
                           */
                          id: ward.ward_name,
                        });
                      }}
                    >
                      {getWardDisplayName(
                        ward.ward_name,
                      )}
                    </div>
                  </AdvancedMarker>
                );
              },
            )}

          {/* =================================================
              EXISTING CHARGERS
          ================================================= */}

          {layers.chargers &&
            mapData.charging_stations.map(
              (
                charger,
                index,
              ) => (
                <AdvancedMarker
                  key={`charger-${index}`}
                  position={{
                    lat:
                      charger.latitude,
                    lng:
                      charger.longitude,
                  }}
                  title={
                    charger.name
                  }
                  onClick={() =>
                    onSelectionChange({
                      type: "charger",
                      id: `${charger.name}-${index}`,
                    })
                  }
                />
              ),
            )}

          {/* =================================================
              POWER SUBSTATIONS
          ================================================= */}

          {layers.substations &&
            mapData.substations.map(
              (
                substation,
                index,
              ) => (
                <AdvancedMarker
                  key={`substation-${index}`}
                  position={{
                    lat:
                      substation.latitude,
                    lng:
                      substation.longitude,
                  }}
                  title={
                    substation.substation_name
                  }
                  onClick={() =>
                    onSelectionChange({
                      type: "substation",
                      id: `${substation.substation_name}-${index}`,
                    })
                  }
                />
              ),
            )}

          {/* =================================================
              RECOMMENDED SITES
          ================================================= */}

          {layers.recommended_sites &&
            mapData.recommended_sites.map(
              (
                site,
                index,
              ) => {
                const isSelected =
                  selectedSite ===
                  site.ward_name;

                return (
                  <AdvancedMarker
                    /*
                     * ORIGINAL WARD CODE
                     */
                    key={`site-${site.ward_name}-${index}`}
                    position={
                      site.centroid
                    }
                    title={`Recommended site — ${getWardDisplayName(
                      site.ward_name,
                    )}`}
                    zIndex={100}
                    onClick={() =>
                      onSelectionChange({
                        type: "site",

                        /*
                         * ORIGINAL BACKEND ID
                         */
                        id: site.ward_name,
                      })
                    }
                  >
                    <div
                      className={`recommended-marker ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                    >
                      <div className="recommended-marker-dot" />

                      <span>
                        {getWardDisplayName(
                          site.ward_name,
                        )}
                      </span>
                    </div>
                  </AdvancedMarker>
                );
              },
            )}

        </Map>
      </APIProvider>
    </div>
  );
}