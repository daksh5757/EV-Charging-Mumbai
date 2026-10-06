import type { AnalysisMapData } from "../types/analysis";

const API_BASE_URL = "http://localhost:8000/api";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

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

export async function getAnalysisMapData(): Promise<AnalysisMapData> {
  return fetchAPI<AnalysisMapData>("/analysis/map-data");
}

export async function getAnalysisSummary() {
  return fetchAPI("/analysis/summary");
}

export async function getOptimization() {
  return fetchAPI("/analysis/optimization");
}

export async function getAnalysisData() {
  const mapData = await getAnalysisMapData();

  return {
    mapData,
    summary: await getAnalysisSummary(),
    optimization: await getOptimization(),
  };
}
