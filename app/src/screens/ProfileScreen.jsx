import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, LogOut, Settings, Shield, Home } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useUiStore from '../stores/uiStore';
import { APP_ROLES } from '../config/constants';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, profile, activeRole, setActiveRole, updateProfile, logout } = useAuthStore();
  const { showToast } = useUiStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    email: profile?.email || '',
    license_number: profile?.license_number || '',
    agency_name: profile?.agency_name || '',
  });

  const handleSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    showToast(`Switched to ${role} view`, 'info');
    navigate('/map');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <p className="text-gray-400">Not logged in</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* User info */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">
                {profile?.full_name || user.username}
              </h2>
              <p className="text-gray-400 text-sm">{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-primary-light text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  {activeRole}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-full bg-gray-100"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Role switcher */}
        <div className="bg-white p-4 border-b">
          <h3 className="font-semibold text-gray-800 mb-3">Switch Role</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: APP_ROLES.TENANT, label: 'Tenant', icon: '👤' },
              { id: APP_ROLES.LANDLORD, label: 'Landlord', icon: '🏠' },
              { id: APP_ROLES.AGENT, label: 'Agent', icon: '🤝' },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSwitch(role.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  activeRole === role.id
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{role.icon}</div>
                <div className="text-xs font-medium">{role.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Edit profile form */}
        {isEditing && (
          <div className="bg-white p-4 border-b space-y-4">
            <h3 className="font-semibold text-gray-800">Edit Profile</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={editForm.full_name}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
              className="input-field"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={editForm.phone_number}
              onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
              className="input-field"
            />
            <input
              type="email"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field"
            />
            {(activeRole === APP_ROLES.LANDLORD || activeRole === APP_ROLES.AGENT) && (
              <>
                <input
                  type="text"
                  placeholder="License Number"
                  value={editForm.license_number}
                  onChange={(e) => setEditForm((f) => ({ ...f, license_number: e.target.value }))}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Agency Name (if applicable)"
                  value={editForm.agency_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, agency_name: e.target.value }))}
                  className="input-field"
                />
              </>
            )}
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary flex-1">
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Contact info */}
        <div className="bg-white p-4 border-b">
          <h3 className="font-semibold text-gray-800 mb-3">Contact Information</h3>
          <div className="space-y-3">
            {profile?.phone_number && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={18} className="text-gray-400" />
                <span className="text-gray-600">{profile.phone_number}</span>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={18} className="text-gray-400" />
                <span className="text-gray-600">{profile.email}</span>
              </div>
            )}
            {profile?.license_number && (
              <div className="flex items-center gap-3 text-sm">
                <Shield size={18} className="text-gray-400" />
                <span className="text-gray-600">License: {profile.license_number}</span>
              </div>
            )}
            {profile?.agency_name && (
              <div className="flex items-center gap-3 text-sm">
                <Home size={18} className="text-gray-400" />
                <span className="text-gray-600">{profile.agency_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-500 text-red-500 font-medium"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
