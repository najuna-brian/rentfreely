/**
 * Generate a unique observation ID
 * Format: rf_<type>_<timestamp>_<random>
 */
export function generateObservationId(formType) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `rf_${formType}_${ts}_${rand}`;
}
