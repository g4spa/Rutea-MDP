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
  legs: Array<{ fromId: string; toId: string; kilometers: number }>;
  totalKilometers: number;
  estimatedMinutes: number;
  fuelLiters: number;
  fuelCostCents: number;
};
