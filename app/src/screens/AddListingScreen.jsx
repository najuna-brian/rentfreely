import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera, X, Plus } from 'lucide-react';
import usePropertyStore from '../stores/propertyStore';
import useUiStore from '../stores/uiStore';
import { PROPERTY_TYPES, PRICE_PERIODS, AMENITIES, LISTING_STATUS } from '../config/constants';
import { requestLocation, requestCamera } from '../services/formulusService';
import { reverseGeocode } from '../services/geocoding';

const STEPS = [
  { id: 1, title: 'Location', subtitle: 'Drop a pin or use GPS' },
  { id: 2, title: 'Property Type', subtitle: 'What kind of property?' },
  { id: 3, title: 'Details', subtitle: 'Price, bedrooms, bathrooms' },
  { id: 4, title: 'Amenities', subtitle: 'Select available amenities' },
  { id: 5, title: 'Photos', subtitle: 'Add property photos' },
  { id: 6, title: 'Review', subtitle: 'Review and publish' },
];

export default function AddListingScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_period: 'monthly',
    property_type: '',
    bedrooms: '',
    bathrooms: '',
    address_text: '',
    parish: '',
    district: '',
    amenities: [],
    photos: [],
    geolocation: null,
  });
  const navigate = useNavigate();
  const { createListing } = usePropertyStore();
  const { showToast, showLoading, hideLoading } = useUiStore();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Initialize map for step 1
  useEffect(() => {
    if (currentStep === 1 && window.google && !mapInstance.current && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0.3476, lng: 32.5825 },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData((d) => ({ ...d, geolocation: { latitude: lat, longitude: lng } }));
        placeMarker({ lat, lng });
        reverseGeocode(lat, lng).then((result) => {
          if (result) {
            setFormData((d) => ({
              ...d,
              address_text: result.display_name,
              parish: result.address?.suburb || result.address?.village || '',
              district: result.address?.county || 'Kampala',
            }));
          }
        });
      });

      mapInstance.current = map;
    }
  }, [currentStep]);

  const placeMarker = (position) => {
    if (markerRef.current) {
      markerRef.current.position = position;
    } else {
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="background: #1B7A4A; color: white; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: bold;">
          New Property
        </div>
      `;
      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        position,
        content,
      });
    }
  };

  const handleGPS = async () => {
    try {
      const pos = await requestLocation();
      setFormData((d) => ({ ...d, geolocation: pos }));
      if (mapInstance.current) {
        mapInstance.current.panTo(pos);
        mapInstance.current.setZoom(15);
      }
      placeMarker(pos);
      reverseGeocode(pos.latitude, pos.longitude).then((result) => {
        if (result) {
          setFormData((d) => ({
            ...d,
            address_text: result.display_name,
            parish: result.address?.suburb || result.address?.village || '',
            district: result.address?.county || 'Kampala',
          }));
        }
      });
    } catch (err) {
      showToast('Could not get location', 'error');
    }
  };

  const handleAddPhoto = async () => {
    try {
      const photo = await requestCamera();
      if (photo) {
        setFormData((d) => ({ ...d, photos: [...d.photos, photo] }));
      }
    } catch (err) {
      showToast('Could not take photo', 'error');
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData((d) => ({
      ...d,
      photos: d.photos.filter((_, i) => i !== index),
    }));
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData((d) => ({
      ...d,
      amenities: d.amenities.includes(amenityId)
        ? d.amenities.filter((a) => a !== amenityId)
        : [...d.amenities, amenityId],
    }));
  };

  const next = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.geolocation) {
      showToast('Please set property location', 'error');
      return;
    }
    if (!formData.title || !formData.price) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    showLoading('Publishing listing...');
    try {
      await createListing(
        {
          ...formData,
          price: parseInt(formData.price),
          status: LISTING_STATUS.AVAILABLE,
        },
        formData.geolocation
      );
      showToast('Listing published successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast('Failed to publish listing', 'error');
    } finally {
      hideLoading();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="h-64 bg-gray-100 rounded-xl overflow-hidden relative">
              <div ref={mapRef} className="w-full h-full" />
              <button
                onClick={handleGPS}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
              >
                <MapPin size={20} className="text-primary" />
              </button>
            </div>
            {formData.geolocation && (
              <div className="bg-primary-light rounded-xl p-3">
                <p className="text-sm font-medium text-primary">Location set</p>
                <p className="text-xs text-gray-600 truncate">{formData.address_text || 'Address fetched'}</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData((d) => ({ ...d, property_type: type.id }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.property_type === type.id
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Property title"
              value={formData.title}
              onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
              className="input-field"
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
              className="input-field min-h-[100px]"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Price (UGX)"
                value={formData.price}
                onChange={(e) => setFormData((d) => ({ ...d, price: e.target.value }))}
                className="input-field"
              />
              <select
                value={formData.price_period}
                onChange={(e) => setFormData((d) => ({ ...d, price_period: e.target.value }))}
                className="input-field"
              >
                {PRICE_PERIODS.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Bedrooms"
                value={formData.bedrooms}
                onChange={(e) => setFormData((d) => ({ ...d, bedrooms: e.target.value }))}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Bathrooms"
                value={formData.bathrooms}
                onChange={(e) => setFormData((d) => ({ ...d, bathrooms: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity.id}
                  onClick={() => handleAmenityToggle(amenity.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.amenities.includes(amenity.id)
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{amenity.icon}</div>
                  <div className="text-xs text-center">{amenity.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddPhoto}
                className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400"
              >
                <Camera size={24} />
                <span className="text-xs mt-1">Add Photo</span>
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Review Your Listing</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Title:</span> {formData.title}</p>
                <p><span className="font-medium">Price:</span> UGX {parseInt(formData.price || 0).toLocaleString()}/{formData.price_period}</p>
                <p><span className="font-medium">Type:</span> {PROPERTY_TYPES.find(t => t.id === formData.property_type)?.label}</p>
                <p><span className="font-medium">Location:</span> {formData.address_text}</p>
                {formData.bedrooms && <p><span className="font-medium">Bedrooms:</span> {formData.bedrooms}</p>}
                {formData.bathrooms && <p><span className="font-medium">Bathrooms:</span> {formData.bathrooms}</p>}
                {formData.amenities.length > 0 && (
                  <p><span className="font-medium">Amenities:</span> {formData.amenities.length} selected</p>
                )}
                {formData.photos.length > 0 && (
                  <p><span className="font-medium">Photos:</span> {formData.photos.length} uploaded</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const step = STEPS[currentStep - 1];

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-semibold">{step.title}</h2>
          <p className="text-xs text-gray-400">{step.subtitle}</p>
        </div>
        <div className="w-8" />
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full ${
                i + 1 <= currentStep ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderStep()}
      </div>

      {/* Actions */}
      <div className="flex gap-3 p-4 border-t">
        {currentStep > 1 && (
          <button onClick={prev} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600">
            Back
          </button>
        )}
        <button
          onClick={currentStep === STEPS.length ? handleSubmit : next}
          className="flex-1 btn-primary"
          disabled={currentStep === 1 && !formData.geolocation}
        >
          {currentStep === STEPS.length ? 'Publish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
