import { getDrivingGeometry, getDrivingTable } from "@/lib/osrm";
import type { Coordinate, OptimizedRoute, OsrmTable, RouteStop, VehicleSettings } from "@/types/routing";

const DEFAULT_SERVICE_MINUTES = 7;

function routeCost(order: RouteStop[], stops: RouteStop[], table: OsrmTable) {
  if (!order.length) return 0;
  const indices = order.map((stop) => stops.indexOf(stop) + 1);
  let total = table.durations[0][indices[0]] || Number.POSITIVE_INFINITY;
  for (let index = 1; index < indices.length; index += 1) {
    total += table.durations[indices[index - 1]][indices[index]] || Number.POSITIVE_INFINITY;
  }
  total += table.durations[indices.at(-1)!][0] || Number.POSITIVE_INFINITY;
  return total;
}

function nearestNeighbor(stops: RouteStop[], table: OsrmTable) {
  const remaining = [...stops];
  const ordered: RouteStop[] = [];
  let currentIndex = 0;

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const candidateIndex = stops.indexOf(candidate) + 1;
      const windowBonus = candidate.receivingFrom || candidate.receivingUntil ? 300 : 0;
      const score = (table.durations[currentIndex][candidateIndex] || Number.POSITIVE_INFINITY) - windowBonus;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    currentIndex = stops.indexOf(next) + 1;
  }
  return ordered;
}

function twoOpt(stops: RouteStop[], initial: RouteStop[], table: OsrmTable) {
  let best = [...initial];
  let improved = true;
  while (improved) {
    improved = false;
    for (let start = 0; start < best.length - 1; start += 1) {
      for (let end = start + 1; end < best.length; end += 1) {
        const candidate = [...best.slice(0, start), ...best.slice(start, end + 1).reverse(), ...best.slice(end + 1)];
        if (routeCost(candidate, stops, table) + 0.001 < routeCost(best, stops, table)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return stops.length ? best : [];
}

export async function optimizeRoute(
  base: Coordinate,
  stops: RouteStop[],
  settings: VehicleSettings
): Promise<OptimizedRoute> {
  if (!stops.length) {
    return {
      orderedStops: [],
      legs: [],
      totalKilometers: 0,
      estimatedMinutes: 0,
      fuelLiters: 0,
      fuelCostCents: 0,
      geometry: { type: "LineString", coordinates: [[base.lng, base.lat], [base.lng, base.lat]] }
    };
  }

  const table = await getDrivingTable(base, stops);
  const orderedStops = twoOpt(stops, nearestNeighbor(stops, table), table);
  const orderedIndices = orderedStops.map((stop) => stops.indexOf(stop) + 1);
  const sequence = [0, ...orderedIndices, 0];
  const legs = sequence.slice(0, -1).map((fromIndex, index) => {
    const toIndex = sequence[index + 1];
    return {
      fromId: fromIndex === 0 ? "base" : stops[fromIndex - 1].id,
      toId: toIndex === 0 ? "base" : stops[toIndex - 1].id,
      kilometers: table.distances[fromIndex][toIndex] / 1000,
      seconds: table.durations[fromIndex][toIndex]
    };
  });
  const totalKilometers = legs.reduce((total, leg) => total + leg.kilometers, 0);
  const travelSeconds = legs.reduce((total, leg) => total + leg.seconds, 0);
  const serviceMinutes = orderedStops.reduce((total, stop) => total + (stop.serviceMinutes || DEFAULT_SERVICE_MINUTES), 0);
  const geometry = await getDrivingGeometry([base, ...orderedStops, base]);
  const fuelLiters = (totalKilometers * settings.litersPer100Km) / 100;

  return {
    orderedStops,
    legs,
    totalKilometers,
    estimatedMinutes: Math.ceil(travelSeconds / 60 + serviceMinutes),
    fuelLiters,
    fuelCostCents: Math.round(fuelLiters * settings.fuelPriceCents),
    geometry
  };
}
