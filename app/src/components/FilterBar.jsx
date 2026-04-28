import { useState } from 'react';
import usePropertyStore from '../stores/propertyStore';
import { PROPERTY_TYPES, PRICE_FILTERS } from '../config/constants';

const BEDROOM_OPTIONS = [
  { id: null, label: 'Any' },
  { id: 1, label: '1 bed' },
  { id: 2, label: '2 bed' },
  { id: 3, label: '3 bed' },
  { id: '4+', label: '4+ bed' },
];

export default function FilterBar({ onClose }) {
  const { filters, setFilters, resetFilters } = usePropertyStore();
  const [localFilters, setLocalFilters] = useState(filters);

  const handlePriceChange = (min, max) => {
    setLocalFilters((f) => ({ ...f, priceMin: min, priceMax: max }));
  };

  const handleBedroomsChange = (bedrooms) => {
    setLocalFilters((f) => ({ ...f, bedrooms }));
  };

  const handleTypeChange = (type) => {
    setLocalFilters((f) => ({ ...f, propertyType: type }));
  };

  const apply = () => {
    setFilters(localFilters);
    onClose();
  };

  const reset = () => {
    resetFilters();
    setLocalFilters({
      priceMin: 0,
      priceMax: Infinity,
      bedrooms: null,
      propertyType: null,
      availableNow: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Price range */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handlePriceChange(filter.min, filter.max)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                localFilters.priceMin === filter.min && localFilters.priceMax === filter.max
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Bedrooms</h3>
        <div className="grid grid-cols-3 gap-2">
          {BEDROOM_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleBedroomsChange(option.id)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                localFilters.bedrooms === option.id
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Property Type</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTypeChange(null)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              !localFilters.propertyType
                ? 'border-primary bg-primary-light text-primary'
                : 'border-gray-200 bg-white text-gray-600'
            }`}
          >
            Any
          </button>
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                localFilters.propertyType === type.id
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <div className="text-lg mb-1">{type.icon}</div>
              <div>{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={localFilters.availableNow}
            onChange={(e) => setLocalFilters((f) => ({ ...f, availableNow: e.target.checked }))}
            className="rounded border-gray-300 text-primary"
          />
          <span className="text-gray-700">Available now</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button onClick={reset} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium">
          Reset
        </button>
        <button onClick={apply} className="flex-1 btn-primary">
          Apply Filters
        </button>
      </div>
    </div>
  );
}
