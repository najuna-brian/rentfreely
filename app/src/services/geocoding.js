import { NOMINATIM_BASE, NOMINATIM_USER_AGENT } from '../config/constants';

let lastRequestTime = 0;

async function rateLimitedFetch(url) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: { 'User-Agent': NOMINATIM_USER_AGENT },
  });
  if (!res.ok) throw new Error('Geocoding request failed: ' + res.status);
  return res.json();
}

/**
 * Search for places by text query (forward geocoding)
 * @param {string} query - Search text (e.g. "Ntinda Kampala")
 * @returns {Array} Array of { display_name, lat, lon, ... }
 */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ug&limit=5&addressdetails=1`;
  try {
    return await rateLimitedFetch(url);
  } catch (err) {
    console.error('Geocoding search error:', err);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} lat
 * @param {number} lng
 * @returns {Object} { display_name, address: { ... } }
 */
export async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  try {
    return await rateLimitedFetch(url);
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return null;
  }
}
