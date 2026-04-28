const CACHE_PREFIX = 'rf_cache_';
const QUEUE_KEY = 'rf_offline_queue';

/**
 * Cache data to localStorage with a key
 */
export function cacheData(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
}

/**
 * Get cached data (returns null if expired or missing)
 * @param {string} key
 * @param {number} maxAgeMs - Max age in milliseconds (default 30 min)
 */
export function getCachedData(key, maxAgeMs = 30 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Add a pending operation to the offline queue
 */
export function enqueueOfflineOp(operation) {
  try {
    const queue = getOfflineQueue();
    queue.push({ ...operation, queued_at: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Offline queue write failed:', err);
  }
}

/**
 * Get all pending offline operations
 */
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the offline queue (after successful sync)
 */
export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Check if the browser is online
 */
export function isOnline() {
  return navigator.onLine;
}
