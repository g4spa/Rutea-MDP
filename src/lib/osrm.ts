import type { Coordinate, OsrmTable, RouteStop } from "@/types/routing";

const DEFAULT_OSRM_URL = "https://router.project-osrm.org";
const REQUEST_TIMEOUT_MS = 15000;

function coordinatesParam(points: Coordinate[]) {
  // OSRM requires longitude,latitude, unlike the application model.
  return points.map((point) => `${point.lng},${point.lat}`).join(";");
}

async function osrmFetch<T>(path: string): Promise<T> {
  const baseUrl = process.env.OSRM_BASE_URL || DEFAULT_OSRM_URL;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`OSRM request failed with status ${response.status}`);
  const payload = (await response.json()) as { code?: string };
  if (payload.code !== "Ok") throw new Error(`OSRM returned ${payload.code || "an invalid response"}`);
  return payload as T;
}

export async function getDrivingTable(base: Coordinate, stops: RouteStop[]): Promise<OsrmTable> {
  const points = [base, ...stops];
  const payload = await osrmFetch<{ distances?: Array<Array<number | null>>; durations?: Array<Array<number | null>> }>(
    `/table/v1/driving/${coordinatesParam(points)}?annotations=duration,distance`
  );

  if (!payload.distances || !payload.durations || payload.distances.length !== points.length) {
    throw new Error("OSRM table response is incomplete");
  }

  const distances = payload.distances.map((row) => row.map((value) => value ?? Number.POSITIVE_INFINITY));
  const durations = (payload.durations || []).map((row) => row.map((value) => value ?? Number.POSITIVE_INFINITY));
  if (durations.length !== points.length || distances.some((row) => row.length !== points.length) || durations.some((row) => row.length !== points.length)) {
    throw new Error("OSRM table dimensions do not match the route");
  }
  return { distances, durations };
}

export async function getDrivingGeometry(points: Coordinate[]) {
  const payload = await osrmFetch<{
    routes?: Array<{ geometry?: { type: "LineString"; coordinates: [number, number][] } }>;
  }>(`/route/v1/driving/${coordinatesParam(points)}?overview=full&geometries=geojson`);
  const geometry = payload.routes?.[0]?.geometry;
  if (!geometry || geometry.type !== "LineString" || geometry.coordinates.length < 2) {
    throw new Error("OSRM route geometry is unavailable");
  }
  return geometry;
}
