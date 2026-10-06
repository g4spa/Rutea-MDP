export type Coordinate = {
  lat: number;
  lng: number;
};

export type RouteStop = Coordinate & {
  id: string;
  address: string;
  receivingFrom?: string | null;
  receivingUntil?: string | null;
  serviceMinutes?: number;
};

export type VehicleSettings = {
  litersPer100Km: number;
  fuelPriceCents: number;
  averageSpeedKmh?: number;
};

export type OptimizedRoute = {
  orderedStops: RouteStop[];
  legs: Array<{ fromId: string; toId: string; kilometers: number; seconds: number }>;
  totalKilometers: number;
  estimatedMinutes: number;
  fuelLiters: number;
  fuelCostCents: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

export type OsrmTable = {
  distances: number[][];
  durations: number[][];
};
