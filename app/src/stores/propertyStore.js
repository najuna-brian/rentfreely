import { create } from 'zustand';
import { FORM_TYPES, LISTING_STATUS } from '../config/constants';
import * as formulusService from '../services/formulusService';
import { filterByBounds } from '../utils/spatialFilter';
import { cacheData, getCachedData } from '../services/offlineCache';

const CACHE_KEY = 'property_listings';

const usePropertyStore = create((set, get) => ({
  // State
  allListings: [],
  filteredListings: [],
  selectedProperty: null,
  isLoading: false,
  error: null,

  // Map state
  mapBounds: null,
  mapCenter: null,
  mapZoom: null,

  // Filters
  filters: {
    priceMin: 0,
    priceMax: Infinity,
    bedrooms: null,
    propertyType: null,
    availableNow: false,
  },

  // Actions
  loadListings: async () => {
    set({ isLoading: true, error: null });
    try {
      let listings = await formulusService.getPropertyListings();

      // Filter to only available listings
      listings = listings.filter(
        (l) => l.data?.status === LISTING_STATUS.AVAILABLE && !l.deleted
      );

      // Cache for offline use
      cacheData(CACHE_KEY, listings);

      set({ allListings: listings, isLoading: false });
      get().applyFilters();
    } catch (err) {
      console.error('loadListings error:', err);
      // Try cache
      const cached = getCachedData(CACHE_KEY, 60 * 60 * 1000); // 1 hour
      if (cached) {
        set({ allListings: cached, isLoading: false });
        get().applyFilters();
      } else {
        set({ error: 'Failed to load listings', isLoading: false });
      }
    }
  },

  setMapBounds: (bounds) => {
    set({ mapBounds: bounds });
    get().applyFilters();
  },

  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  resetFilters: () => {
    set({
      filters: {
        priceMin: 0,
        priceMax: Infinity,
        bedrooms: null,
        propertyType: null,
        availableNow: false,
      },
    });
    get().applyFilters();
  },

  applyFilters: () => {
    const { allListings, mapBounds, filters } = get();
    let result = allListings;

    // Spatial filter by map bounds
    if (mapBounds) {
      result = filterByBounds(result, mapBounds);
    }

    // Price filter
    if (filters.priceMin > 0 || filters.priceMax < Infinity) {
      result = result.filter((l) => {
        const price = l.data?.price || 0;
        return price >= filters.priceMin && price <= filters.priceMax;
      });
    }

    // Bedrooms filter
    if (filters.bedrooms !== null) {
      result = result.filter((l) => {
        const beds = l.data?.bedrooms || 0;
        return filters.bedrooms === '4+' ? beds >= 4 : beds === parseInt(filters.bedrooms);
      });
    }

    // Property type filter
    if (filters.propertyType) {
      result = result.filter((l) => l.data?.property_type === filters.propertyType);
    }

    set({ filteredListings: result });
  },

  selectProperty: (property) => set({ selectedProperty: property }),
  clearSelection: () => set({ selectedProperty: null }),

  // Landlord actions
  createListing: async (data, geolocation) => {
    const observation = await formulusService.submitObservation(
      FORM_TYPES.PROPERTY_LISTING,
      { ...data, status: LISTING_STATUS.AVAILABLE, view_count: 0 },
      geolocation
    );
    // Reload listings
    await get().loadListings();
    return observation;
  },

  updateListing: async (observationId, data, geolocation) => {
    await formulusService.updateObservation(
      observationId,
      FORM_TYPES.PROPERTY_LISTING,
      data,
      geolocation
    );
    await get().loadListings();
  },

  deleteListing: async (observationId) => {
    await formulusService.deleteObservation(observationId);
    await get().loadListings();
  },

  getMyListings: (username) => {
    return get().allListings.filter(
      (l) => l.data?.owner_username === username || l.data?.agent_username === username
    );
  },
}));

export default usePropertyStore;
