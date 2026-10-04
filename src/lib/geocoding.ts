import type { Coordinate } from "@/types/routing";

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";

export type GeocodedAddress = Coordinate & {
  displayName: string;
};

export async function geocodeMarDelPlata(address: string): Promise<GeocodedAddress | null> {
  const query = `${address}, Mar del Plata, Buenos Aires, Argentina`;
  const baseUrl = process.env.NOMINATIM_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ar");

  const response = await fetch(url, {
    headers: { "User-Agent": "RuteaMDP/0.1 contact@rutea.local" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 86400 }
  });

  if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`);
  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  const result = results[0];
  if (!result) return null;

  return { lat: Number(result.lat), lng: Number(result.lon), displayName: result.display_name };
}
