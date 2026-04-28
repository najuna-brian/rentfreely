import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useUiStore from '../stores/uiStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const { showToast } = useUiStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // In browser mode, we'll mock login
      if (!window.getFormulus) {
        showToast('Demo mode: any login works', 'info');
        await initialize();
        navigate('/map');
        return;
      }

      // TODO: Implement actual login via Synkronus API
      showToast('Login not yet implemented', 'info');
    } catch (err) {
      showToast('Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h1>
        <p className="text-gray-400 text-sm">Sign in to continue to RentFreely</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+256</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="77X XXX XXX"
              className="input-field pl-12"
              inputMode="numeric"
              pattern="[0-9]{9}"
              maxLength={9}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input-field pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="rounded" />
            Remember me
          </label>
          <button type="button" className="text-primary font-medium">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full mt-8">
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-400 text-sm">
          Don&apos;t have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-primary font-medium">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
