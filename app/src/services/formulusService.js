/**
 * Wrapper around the Formulus bridge API for RentFreely data operations.
 * When running in browser (no Formulus), falls back to localStorage mock.
 */

import { FORM_TYPES } from '../config/constants';
import { generateObservationId } from '../utils/ids';

let _api = null;

/**
 * Initialize with the Formulus API instance
 */
export function setFormulusApi(api) {
  _api = api;
}

/**
 * Check if we have a real Formulus API (vs browser mock)
 */
export function hasFormulusApi() {
  return _api !== null && typeof _api.getVersion === 'function';
}

// ---------------------------------------------------------------------------
// Mock storage for browser development (no Formulus shell)
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'rentfreely_observations';

function getMockStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMockStore(observations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

// ---------------------------------------------------------------------------
// Observation CRUD
// ---------------------------------------------------------------------------

/**
 * Get all observations of a given form type
 */
export async function getObservations(formType, options = {}) {
  if (hasFormulusApi()) {
    try {
      const result = await _api.getObservations({
        formType,
        isDraft: false,
        includeDeleted: options.includeDeleted || false,
      });
      return result || [];
    } catch (err) {
      console.error('formulusService.getObservations error:', err);
      return [];
    }
  }

  // Mock: filter localStorage
  const store = getMockStore();
  return store.filter(
    (obs) => obs.form_type === formType && (!obs.deleted || options.includeDeleted)
  );
}

/**
 * Submit a new observation
 */
export async function submitObservation(formType, data, geolocation = null) {
  const observationId = generateObservationId(formType);
  const now = new Date().toISOString();

  const observation = {
    observation_id: observationId,
    form_type: formType,
    form_version: '1.0',
    data,
    geolocation,
    created_at: now,
    updated_at: now,
    deleted: false,
  };

  if (hasFormulusApi()) {
    try {
      await _api.submitObservation(observation);
      return observation;
    } catch (err) {
      console.error('formulusService.submitObservation error:', err);
      throw err;
    }
  }

  // Mock: save to localStorage
  const store = getMockStore();
  store.push(observation);
  saveMockStore(store);
  return observation;
}

/**
 * Update an existing observation
 */
export async function updateObservation(observationId, formType, data, geolocation = null) {
  const now = new Date().toISOString();

  if (hasFormulusApi()) {
    try {
      await _api.updateObservation({
        observation_id: observationId,
        form_type: formType,
        form_version: '1.0',
        data,
        geolocation,
        updated_at: now,
        deleted: false,
      });
      return true;
    } catch (err) {
      console.error('formulusService.updateObservation error:', err);
      throw err;
    }
  }

  // Mock: update in localStorage
  const store = getMockStore();
  const idx = store.findIndex((o) => o.observation_id === observationId);
  if (idx >= 0) {
    store[idx] = { ...store[idx], data, geolocation, updated_at: now };
    saveMockStore(store);
  }
  return true;
}

/**
 * Soft-delete an observation
 */
export async function deleteObservation(observationId) {
  if (hasFormulusApi()) {
    try {
      await _api.updateObservation({
        observation_id: observationId,
        deleted: true,
        updated_at: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error('formulusService.deleteObservation error:', err);
      throw err;
    }
  }

  // Mock
  const store = getMockStore();
  const idx = store.findIndex((o) => o.observation_id === observationId);
  if (idx >= 0) {
    store[idx].deleted = true;
    store[idx].updated_at = new Date().toISOString();
    saveMockStore(store);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

export async function getPropertyListings() {
  return getObservations(FORM_TYPES.PROPERTY_LISTING);
}

export async function getUserProfile(username) {
  const profiles = await getObservations(FORM_TYPES.USER_PROFILE);
  return profiles.find((p) => p.data?.synkronus_username === username) || null;
}

export async function getInquiriesForProperty(propertyObservationId) {
  const inquiries = await getObservations(FORM_TYPES.INQUIRY);
  return inquiries.filter((i) => i.data?.property_observation_id === propertyObservationId);
}

export async function getReviewsForProperty(propertyObservationId) {
  const reviews = await getObservations(FORM_TYPES.REVIEW);
  return reviews.filter((r) => r.data?.property_observation_id === propertyObservationId);
}

export async function getSavedListings(username) {
  const saved = await getObservations(FORM_TYPES.SAVED_LISTING);
  return saved.filter((s) => s.data?.saved_by_username === username);
}

/**
 * Request camera access (via Formulus bridge)
 */
export async function requestCamera() {
  if (hasFormulusApi() && typeof _api.requestCamera === 'function') {
    return _api.requestCamera();
  }
  // Browser fallback: use file input
  return null;
}

/**
 * Request GPS location (via Formulus bridge)
 */
export async function requestLocation() {
  if (hasFormulusApi() && typeof _api.requestLocation === 'function') {
    return _api.requestLocation();
  }
  // Browser fallback: use navigator.geolocation
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Trigger sync (via Formulus bridge)
 */
export async function syncNow() {
  if (hasFormulusApi() && typeof _api.syncNow === 'function') {
    return _api.syncNow();
  }
  return { success: true, message: 'Browser mode — no sync needed' };
}

/**
 * Get current user info (via Formulus bridge)
 */
export async function getCurrentUser() {
  if (hasFormulusApi() && typeof _api.getCurrentUser === 'function') {
    return _api.getCurrentUser();
  }
  // Browser mock user
  return {
    username: 'demo_user',
    role: 'read-write',
  };
}
