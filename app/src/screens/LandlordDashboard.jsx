import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Home, MessageCircle, Eye, TrendingUp } from 'lucide-react';
import usePropertyStore from '../stores/propertyStore';
import useAuthStore from '../stores/authStore';
import { formatPrice } from '../utils/formatPrice';
import { LISTING_STATUS } from '../config/constants';

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { allListings, loadListings } = usePropertyStore();
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    views: 0,
    inquiries: 0,
  });

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    if (user && allListings.length > 0) {
      const myListings = allListings.filter(
        (l) => l.data?.owner_username === user.username || l.data?.agent_username === user.username
      );
      setStats({
        total: myListings.length,
        available: myListings.filter((l) => l.data?.status === LISTING_STATUS.AVAILABLE).length,
        rented: myListings.filter((l) => l.data?.status === LISTING_STATUS.RENTED).length,
        views: myListings.reduce((sum, l) => sum + (l.data?.view_count || 0), 0),
        inquiries: 0, // TODO: Count inquiries
      });
    }
  }, [user, allListings]);

  const myListings = allListings.filter(
    (l) => l.data?.owner_username === user?.username || l.data?.agent_username === user?.username
  );

  const handleStatusChange = async (listingId, newStatus) => {
    // TODO: Update listing status via observations
  };

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-400 text-sm">Manage your properties</p>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-light rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Home size={24} className="text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Listings</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                <p className="text-xs text-gray-600">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.views}</p>
                <p className="text-xs text-gray-600">Total Views</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <MessageCircle size={24} className="text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.inquiries}</p>
                <p className="text-xs text-gray-600">Inquiries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Listings</h2>
          <button
            onClick={() => navigate('/add-listing')}
            className="bg-primary text-white p-2 rounded-full"
          >
            <Plus size={20} />
          </button>
        </div>

        {myListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No listings yet</h3>
            <p className="text-gray-400 text-sm mb-6">Add your first property to get started</p>
            <button
              onClick={() => navigate('/add-listing')}
              className="btn-primary"
            >
              Add Listing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map((listing) => {
              const data = listing.data || {};
              return (
                <div key={listing.observation_id} className="bg-white rounded-xl p-4 shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{data.title || 'Untitled'}</h3>
                      <p className="text-primary font-bold mt-1">
                        {formatPrice(data.price, data.price_period)}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">{data.address_text || data.parish}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {data.bedrooms && <span>{data.bedrooms} bed</span>}
                        {data.bathrooms && <span>{data.bathrooms} bath</span>}
                        <span>{data.view_count || 0} views</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <select
                        value={data.status || LISTING_STATUS.AVAILABLE}
                        onChange={(e) => handleStatusChange(listing.observation_id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1"
                      >
                        <option value={LISTING_STATUS.AVAILABLE}>Available</option>
                        <option value={LISTING_STATUS.RENTED}>Rented</option>
                        <option value={LISTING_STATUS.INACTIVE}>Inactive</option>
                      </select>
                      <button
                        onClick={() => navigate(`/property/${listing.observation_id}`)}
                        className="text-xs text-primary"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
