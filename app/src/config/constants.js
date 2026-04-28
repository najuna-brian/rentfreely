// Kampala center coordinates
export const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };
export const DEFAULT_ZOOM = 13;

// Google Maps API key (loaded from env or fallback)
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

// Nominatim geocoding
export const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
export const NOMINATIM_USER_AGENT = 'RentFreely/1.0';

// Currency
export const CURRENCY = 'UGX';
export const CURRENCY_LOCALE = 'en-UG';

// Phone
export const PHONE_COUNTRY_CODE = '+256';

// Property types
export const PROPERTY_TYPES = [
  { id: 'house', label: 'House', icon: '🏠' },
  { id: 'apartment', label: 'Apartment', icon: '🏢' },
  { id: 'single_room', label: 'Single Room', icon: '🚪' },
  { id: 'studio', label: 'Studio', icon: '🏨' },
];

// Price periods
export const PRICE_PERIODS = [
  { id: 'monthly', label: '/mo' },
  { id: 'weekly', label: '/wk' },
  { id: 'daily', label: '/day' },
];

// Amenities
export const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'generator', label: 'Generator', icon: '⚡' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'furnished', label: 'Furnished', icon: '🛋️' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'balcony', label: 'Balcony', icon: '🏗️' },
  { id: 'garden', label: 'Garden', icon: '🌿' },
  { id: 'gym', label: 'Gym', icon: '💪' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'ac', label: 'A/C', icon: '❄️' },
];

// Observation form types
export const FORM_TYPES = {
  USER_PROFILE: 'user_profile',
  PROPERTY_LISTING: 'property_listing',
  INQUIRY: 'inquiry',
  REVIEW: 'review',
  SAVED_LISTING: 'saved_listing',
};

// Listing statuses
export const LISTING_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  INACTIVE: 'inactive',
};

// App roles (stored in user_profile observation)
export const APP_ROLES = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
  AGENT: 'agent',
};

// Price filter presets (UGX)
export const PRICE_FILTERS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under 300K', min: 0, max: 300000 },
  { label: '300K - 500K', min: 300000, max: 500000 },
  { label: '500K - 1M', min: 500000, max: 1000000 },
  { label: '1M - 2M', min: 1000000, max: 2000000 },
  { label: 'Over 2M', min: 2000000, max: Infinity },
];
