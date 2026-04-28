import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePropertyStore from '../stores/propertyStore';
import useUiStore from '../stores/uiStore';
import BottomSheet from '../components/BottomSheet';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import { formatPriceShort } from '../utils/formatPrice';
import { GOOGLE_MAPS_KEY, KAMPALA_CENTER } from '../config/constants';

export default function TenantMapScreen() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const { filteredListings, selectedProperty, selectProperty, setMapBounds, setMapCenter, setMapZoom } = usePropertyStore();
  const { showToast } = useUiStore();

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google || !mapRef.current || mapInstance.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: KAMPALA_CENTER,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstance.current = map;

    // Listen to map changes
    map.addListener('idle', () => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setMapBounds({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
      setMapCenter(map.getCenter().toJSON());
      setMapZoom(map.getZoom());
    });

    // Load marker clustering
    import('@googlemaps/markerclusterer').then(({ MarkerClusterer }) => {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: {
          render: ({ count, position }) => {
            const div = document.createElement('div');
            div.className = 'price-pin';
            div.textContent = `${count} listings`;
            div.style.fontSize = '11px';
            div.style.padding = '3px 6px';
            return new window.google.maps.marker.AdvancedMarkerElement({
              position,
              content: div,
              zIndex: 1000,
            });
          },
        },
      });
    });

    setMapLoaded(true);
  }, []);

  // Update markers when listings change
  useEffect(() => {
    if (!mapLoaded || !clustererRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.map = null);
    markersRef.current = [];

    // Create new markers
    const markers = filteredListings.map((listing) => {
      const geo = listing.geolocation;
      if (!geo || geo.latitude == null || geo.longitude == null) return null;

      const price = listing.data?.price || 0;
      const content = document.createElement('div');
      content.className = 'price-pin';
      content.textContent = formatPriceShort(price);
      content.onclick = () => selectProperty(listing);

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: geo.latitude, lng: geo.longitude },
        content,
        zIndex: selectedProperty?.observation_id === listing.observation_id ? 100 : 10,
      });

      markersRef.current.push(marker);
      return marker;
    }).filter(Boolean);

    clustererRef.current.markers = markers;
  }, [filteredListings, mapLoaded, selectedProperty]);

  const handlePlaceSelect = (place) => {
    if (mapInstance.current) {
      mapInstance.current.panTo(place);
      mapInstance.current.setZoom(15);
    }
  };

  const handleCurrentLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      if (mapInstance.current) {
        mapInstance.current.panTo(pos);
        mapInstance.current.setZoom(15);
      }
    } catch (err) {
      showToast('Could not get location', 'error');
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  return (
    <div className="h-full w-full relative bg-gray-100">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Top search bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 bg-white rounded-xl shadow-card px-4 py-3 flex items-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="text-gray-400 text-sm">Search Kampala...</span>
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="bg-white rounded-xl shadow-card p-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B7A4A" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
          </button>
          <button
            onClick={handleCurrentLocation}
            className="bg-white rounded-xl shadow-card p-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B7A4A" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom sheet for selected property */}
      <BottomSheet
        isOpen={!!selectedProperty}
        onClose={() => selectProperty(null)}
        height="40vh"
      >
        {selectedProperty && (
          <div>
            <PropertyCard property={selectedProperty} compact={false} />
            <button
              onClick={() => navigate(`/property/${selectedProperty.observation_id}`)}
              className="btn-primary w-full mt-4"
            >
              View Details
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Search modal */}
      {showSearch && (
        <div className="absolute inset-0 bg-white z-30 p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShowSearch(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2 className="text-xl font-bold">Search</h2>
          </div>
          <SearchBar onPlaceSelect={handlePlaceSelect} />
        </div>
      )}

      {/* Filters modal */}
      {showFilters && (
        <div className="absolute inset-0 bg-white z-30 p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShowFilters(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2 className="text-xl font-bold">Filters</h2>
          </div>
          <FilterBar onClose={() => setShowFilters(false)} />
        </div>
      )}
    </div>
  );
}
