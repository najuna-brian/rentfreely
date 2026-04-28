import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) return;
      if (isAuthenticated) {
        navigate('/map', { replace: true });
      } else {
        const seen = localStorage.getItem('rf_onboarded');
        navigate(seen ? '/login' : '/onboarding', { replace: true });
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-primary-dark relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
        <div className="absolute top-40 right-8 w-20 h-20 border-2 border-white rounded-full" />
        <div className="absolute bottom-20 left-20 w-24 h-24 border-2 border-white rounded-full" />
        <div className="absolute bottom-40 right-16 w-16 h-16 border-2 border-white rounded-full" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <span className="text-4xl">🏠</span>
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">RentFreely</h1>
        <p className="text-white/70 text-sm mt-2">Find your perfect home</p>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-16 flex gap-1.5">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
