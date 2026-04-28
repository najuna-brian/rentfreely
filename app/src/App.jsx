import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useUiStore from './stores/uiStore';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import TenantMapScreen from './screens/TenantMapScreen';
import PropertyDetailScreen from './screens/PropertyDetailScreen';
import AddListingScreen from './screens/AddListingScreen';
import LandlordDashboard from './screens/LandlordDashboard';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import Toast from './components/Toast';

export default function App({ formulusApi }) {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { isOffline, setOffline } = useUiStore();

  useEffect(() => {
    initialize();

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <HashRouter>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
        {isOffline && <OfflineBanner />}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignUpScreen />} />
            <Route
              path="/map"
              element={isAuthenticated ? <TenantMapScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/property/:id"
              element={isAuthenticated ? <PropertyDetailScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/add-listing"
              element={isAuthenticated ? <AddListingScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <LandlordDashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        {isAuthenticated && <BottomNav />}
        <Toast />
      </div>
    </HashRouter>
  );
}
