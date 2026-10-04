import type { Coordinate, OptimizedRoute, RouteStop, VehicleSettings } from "@/types/routing";

const EARTH_RADIUS_KM = 6371;
const DEFAULT_SPEED_KMH = 32;
const DEFAULT_SERVICE_MINUTES = 7;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKilometers(a: Coordinate, b: Coordinate) {
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const latA = toRadians(a.lat);
  const latB = toRadians(b.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

function distanceForOrder(base: Coordinate, stops: RouteStop[]) {
  return stops.reduce(
    (total, stop, index) =>
      total + haversineKilometers(index === 0 ? base : stops[index - 1], stop),
    haversineKilometers(stops.at(-1) ?? base, base)
  );
}

function nearestNeighbor(base: Coordinate, stops: RouteStop[]) {
  const remaining = [...stops];
  const ordered: RouteStop[] = [];
  let current = base;

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const distance = haversineKilometers(current, candidate);
      const hasWindow = Boolean(candidate.receivingFrom || candidate.receivingUntil);
      const score = distance - (hasWindow ? 0.35 : 0);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

function twoOpt(base: Coordinate, initial: RouteStop[]) {
  let best = [...initial];
  let improved = true;

  while (improved) {
    improved = false;
    for (let start = 0; start < best.length - 1; start += 1) {
      for (let end = start + 1; end < best.length; end += 1) {
        const candidate = [
          ...best.slice(0, start),
          ...best.slice(start, end + 1).reverse(),
          ...best.slice(end + 1)
        ];
        if (distanceForOrder(base, candidate) + 0.001 < distanceForOrder(base, best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }

  return best;
}

export function optimizeRoute(
  base: Coordinate,
  stops: RouteStop[],
  settings: VehicleSettings
): OptimizedRoute {
  if (!stops.length) {
    return {
      orderedStops: [],
      legs: [],
      totalKilometers: 0,
      estimatedMinutes: 0,
      fuelLiters: 0,
      fuelCostCents: 0
    };
  }

  const orderedStops = twoOpt(base, nearestNeighbor(base, stops));
  const points = [base, ...orderedStops, base];
  const legs = points.slice(0, -1).map((from, index) => ({
    fromId: index === 0 ? "base" : orderedStops[index - 1].id,
    toId: index === orderedStops.length ? "base" : orderedStops[index].id,
    kilometers: haversineKilometers(from, points[index + 1])
  }));
  const totalKilometers = legs.reduce((total, leg) => total + leg.kilometers, 0);
  const travelMinutes = (totalKilometers / (settings.averageSpeedKmh || DEFAULT_SPEED_KMH)) * 60;
  const serviceMinutes = orderedStops.reduce(
    (total, stop) => total + (stop.serviceMinutes || DEFAULT_SERVICE_MINUTES),
    0
  );
  const fuelLiters = (totalKilometers * settings.litersPer100Km) / 100;

  return {
    orderedStops,
    legs,
    totalKilometers,
    estimatedMinutes: Math.ceil(travelMinutes + serviceMinutes),
    fuelLiters,
    fuelCostCents: Math.round(fuelLiters * settings.fuelPriceCents)
  };
}
