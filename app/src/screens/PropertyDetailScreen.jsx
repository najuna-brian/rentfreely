import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MessageCircle, Camera } from 'lucide-react';
import usePropertyStore from '../stores/propertyStore';
import useAuthStore from '../stores/authStore';
import useUiStore from '../stores/uiStore';
import { formatPrice } from '../utils/formatPrice';
import { buildWhatsAppLink, buildInquiryMessage } from '../utils/whatsapp';
import { PROPERTY_TYPES, AMENITIES, LISTING_STATUS } from '../config/constants';

export default function PropertyDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProperty, filteredListings, selectProperty } = usePropertyStore();
  const { user, profile } = useAuthStore();
  const { showToast } = useUiStore();
  const [isSaved, setIsSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');

  const property = selectedProperty || filteredListings.find((p) => p.observation_id === id);

  useEffect(() => {
    if (!property && id) {
      // Load property by ID if not already loaded
      // TODO: Implement single property fetch
    }
  }, [property, id]);

  if (!property) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <p className="text-gray-400">Property not found</p>
      </div>
    );
  }

  const data = property.data || {};
  const typeInfo = PROPERTY_TYPES.find((t) => t.id === data.property_type);
  const amenities = AMENITIES.filter((a) => data.amenities?.includes(a.id));

  const handleContact = () => {
    const ownerPhone = data.owner_phone || data.landlord_phone;
    if (!ownerPhone) {
      showToast('Contact information not available', 'error');
      return;
    }

    const message = buildInquiryMessage(data.title, profile?.full_name);
    const link = buildWhatsAppLink(ownerPhone, message);
    window.open(link, '_blank');
  };

  const handleSave = async () => {
    // TODO: Implement save/unsave via observations
    setIsSaved(!isSaved);
    showToast(isSaved ? 'Removed from saved' : 'Added to saved', 'success');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data.title,
        text: `Check out this property on RentFreely: ${formatPrice(data.price, data.price_period)}`,
        url: window.location.href,
      });
    } else {
      setShowShare(true);
    }
  };

  const handleInquiry = async () => {
    if (!inquiryMessage.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }
    // TODO: Submit inquiry via observations
    showToast('Inquiry sent successfully', 'success');
    setShowInquiry(false);
    setInquiryMessage('');
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button onClick={handleSave} className="p-2">
            <Heart size={24} className={isSaved ? 'fill-primary text-primary' : ''} />
          </button>
          <button onClick={handleShare} className="p-2">
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Photos */}
        <div className="h-64 bg-primary-light flex items-center justify-center text-6xl">
          {typeInfo?.icon || '🏠'}
          <button className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full">
            <Camera size={20} />
          </button>
        </div>

        {/* Details */}
        <div className="p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{data.title || 'Untitled'}</h1>
            <p className="text-primary text-xl font-bold mt-1">
              {formatPrice(data.price, data.price_period)}
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            {data.bedrooms && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {data.bedrooms} bed
              </span>
            )}
            {data.bathrooms && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {data.bathrooms} bath
              </span>
            )}
            <span className="bg-primary-light text-primary px-3 py-1 rounded-full">
              {typeInfo?.label || 'Property'}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {data.description || 'No description available.'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Location</h3>
            <p className="text-gray-600 text-sm">
              {data.address_text || `${data.parish || ''}, ${data.district || 'Kampala'}`}
            </p>
            {/* TODO: Add map preview */}
          </div>

          {amenities.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Amenities</h3>
              <div className="grid grid-cols-3 gap-2">
                {amenities.map((amenity) => (
                  <div key={amenity.id} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">{amenity.icon}</div>
                    <span className="text-xs text-gray-600">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact section */}
          <div className="border-t pt-4">
            <button
              onClick={handleContact}
              className="btn-accent w-full flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              Contact via WhatsApp
            </button>
            <button
              onClick={() => setShowInquiry(true)}
              className="btn-outline w-full mt-2"
            >
              Send Inquiry
            </button>
          </div>
        </div>
      </div>

      {/* Inquiry modal */}
      {showInquiry && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl p-4 w-full max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Send Inquiry</h3>
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="I'm interested in this property. Is it still available?"
              className="input-field min-h-[120px]"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowInquiry(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600"
              >
                Cancel
              </button>
              <button onClick={handleInquiry} className="flex-1 btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-3">Share Property</h3>
            <p className="text-gray-600 text-sm mb-4">
              Share this property with friends or on social media
            </p>
            <button
              onClick={() => setShowShare(false)}
              className="btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
