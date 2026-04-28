import { useState, useRef, useCallback } from 'react';
import { searchPlaces } from '../services/geocoding';

export default function SearchBar({ onPlaceSelect, placeholder = 'Search Kampala...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const places = await searchPlaces(val);
      setResults(places);
      setIsSearching(false);
    }, 600);
  }, []);

  const handleSelect = (place) => {
    setQuery(place.display_name.split(',')[0]);
    setResults([]);
    onPlaceSelect?.({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      name: place.display_name,
    });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-white shadow-card text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((place, i) => (
            <button
              key={i}
              onClick={() => handleSelect(place)}
              className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-800 truncate">{place.display_name.split(',')[0]}</p>
              <p className="text-xs text-gray-400 truncate">{place.display_name}</p>
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg z-50 px-4 py-3 text-center text-sm text-gray-400">
          Searching...
        </div>
      )}
    </div>
  );
}
