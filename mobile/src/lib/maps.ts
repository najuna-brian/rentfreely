export type PlaceSuggestion = {
  placeId: string;
  description: string;
};

type LatLng = {
  latitude: number;
  longitude: number;
};

export type PlaceSearchResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  primaryType?: string;
  placeId?: string;
};

const apiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY ??
  '';

export async function searchPlaces(input: string): Promise<PlaceSuggestion[]> {
  if (!input.trim() || !apiKey) {
    return [];
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&components=country:ug&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = await response.json();
  const predictions = (data.predictions ?? []) as Array<{
    place_id: string;
    description: string;
  }>;

  return predictions.slice(0, 6).map((item) => ({
    placeId: item.place_id,
    description: item.description,
  }));
}

export async function geocodePlace(placeId: string): Promise<LatLng | null> {
  if (!placeId || !apiKey) {
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(
    placeId
  )}&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = await response.json();
  const location = data.results?.[0]?.geometry?.location;

  if (!location) {
    return null;
  }

  return {
    latitude: Number(location.lat),
    longitude: Number(location.lng),
  };
}

export async function searchPlacesWithCoordinates(
  input: string
): Promise<PlaceSearchResult[]> {
  if (!input.trim() || !apiKey) {
    return [];
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    input
  )}%20in%20Uganda&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = await response.json();
  const results = (data.results ?? []) as Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    types?: string[];
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;

  return results
    .filter((item) => item.geometry?.location?.lat && item.geometry?.location?.lng)
    .slice(0, 10)
    .map((item) => ({
      id: item.place_id,
      placeId: item.place_id,
      name: item.name,
      address: item.formatted_address,
      latitude: Number(item.geometry?.location?.lat),
      longitude: Number(item.geometry?.location?.lng),
      primaryType: item.types?.[0],
    }));
}
