import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';
import { PROPERTY_TYPES } from '../config/constants';

export default function PropertyCard({ property, compact = false }) {
  const navigate = useNavigate();
  const data = property.data || {};
  const typeInfo = PROPERTY_TYPES.find((t) => t.id === data.property_type);

  const handleClick = () => {
    navigate(`/property/${property.observation_id}`);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-card w-full text-left"
      >
        <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center text-2xl flex-shrink-0">
          {typeInfo?.icon || '🏠'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate">{data.title || 'Untitled'}</p>
          <p className="text-primary font-bold text-sm">{formatPrice(data.price, data.price_period)}</p>
          <p className="text-gray-400 text-xs truncate">{data.address_text || data.parish || ''}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="bg-white rounded-xl shadow-card overflow-hidden w-full text-left flex-shrink-0"
      style={{ minWidth: '260px', maxWidth: '300px' }}
    >
      <div className="h-36 bg-primary-light flex items-center justify-center text-5xl">
        {typeInfo?.icon || '🏠'}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-primary text-base">
            {formatPrice(data.price, data.price_period)}
          </p>
          {data.bedrooms && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {data.bedrooms} bed
            </span>
          )}
        </div>
        <p className="font-semibold text-sm text-gray-800 mt-1 truncate">{data.title || 'Untitled'}</p>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{data.address_text || data.parish || ''}</p>
      </div>
    </button>
  );
}
