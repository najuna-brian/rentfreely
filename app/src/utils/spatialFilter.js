/**
 * Client-side spatial filtering for observations with geolocation.
 */

/**
 * Haversine distance in km between two lat/lng points
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Filter observations by map bounds
 * @param {Array} observations - Array of observations with geolocation
 * @param {Object} bounds - { north, south, east, west }
 */
export function filterByBounds(observations, bounds) {
  if (!bounds) return observations;
  const { north, south, east, west } = bounds;
  return observations.filter((obs) => {
    const geo = obs.geolocation;
    if (!geo || geo.latitude == null || geo.longitude == null) return false;
    return (
      geo.latitude >= south &&
      geo.latitude <= north &&
      geo.longitude >= west &&
      geo.longitude <= east
    );
  });
}

/**
 * Filter observations by radius from a center point
 * @param {Array} observations - Array of observations with geolocation
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 */
export function filterByRadius(observations, lat, lng, radiusKm) {
  return observations.filter((obs) => {
    const geo = obs.geolocation;
    if (!geo || geo.latitude == null || geo.longitude == null) return false;
    return haversineDistance(lat, lng, geo.latitude, geo.longitude) <= radiusKm;
  });
}
