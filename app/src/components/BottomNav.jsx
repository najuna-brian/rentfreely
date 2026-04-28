import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { APP_ROLES } from '../config/constants';

const TENANT_TABS = [
  { path: '/map', label: 'Map', icon: MapIcon },
  { path: '/dashboard', label: 'Search', icon: SearchIcon },
  { path: '/profile', label: 'Profile', icon: ProfileIcon },
];

const LANDLORD_TABS = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/add-listing', label: 'Add', icon: AddIcon },
  { path: '/map', label: 'Map', icon: MapIcon },
  { path: '/profile', label: 'Profile', icon: ProfileIcon },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole } = useAuthStore();

  const tabs = activeRole === APP_ROLES.LANDLORD || activeRole === APP_ROLES.AGENT
    ? LANDLORD_TABS
    : TENANT_TABS;

  // Hide on certain screens
  const hiddenPaths = ['/', '/onboarding', '/login', '/signup'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <nav className="bg-white border-t border-gray-200 flex items-center justify-around px-2 py-1 safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path ||
          (tab.path === '/map' && location.pathname.startsWith('/property'));
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center py-1.5 px-3 min-w-[60px] transition-colors ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <tab.icon active={isActive} />
            <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MapIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B7A4A' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
}

function SearchIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B7A4A' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B7A4A' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function DashboardIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B7A4A' : '#9E9E9E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function AddIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={active ? '#1B7A4A' : '#F05A2A'}/>
      <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
