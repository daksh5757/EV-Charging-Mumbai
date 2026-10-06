import type { AnalysisMapData } from "./types/analysis";

const API_BASE_URL = "http://localhost:8000/api";

async function fetchAPI<T>(
  endpoint: string,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API request failed (${response.status}): ${
        errorText || response.statusText
      }`,
    );
  }

  return response.json() as Promise<T>;
}

/* =====================================================
   COMPLETE ANALYSIS DATA
===================================================== */

export async function getAnalysisMapData(): Promise<AnalysisMapData> {
  return fetchAPI<AnalysisMapData>(
    "/analysis/map-data",
  );
}

/* =====================================================
   SUMMARY
===================================================== */

export async function getAnalysisSummary() {
  return fetchAPI(
    "/analysis/summary",
  );
}

/* =====================================================
   OPTIMIZATION
===================================================== */

export async function getOptimization() {
  return fetchAPI(
    "/analysis/optimization",
  );
}

/* =====================================================
   CONVENIENCE LOADER
===================================================== */

export async function getAnalysisData() {
  const mapData =
    await getAnalysisMapData();

  return {
    mapData,
    summary: await getAnalysisSummary(),
    optimization:
      await getOptimization(),
  };
}