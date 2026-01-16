import { useState } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        // Store token
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');

        // Call success callback if provided, otherwise reload
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-dark-card rounded-lg max-w-md w-full p-4 sm:p-6 relative border border-cyan-500/30 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-6 pr-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-1 sm:mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join the Void'}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm font-mono">
            {'>'} {mode === 'login' ? 'ACCESS_GRANTED' : 'NEW_USER_REGISTRATION'} {'<'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white text-sm sm:text-base focus:outline-none focus:border-cyan-500 transition"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white text-sm sm:text-base focus:outline-none focus:border-cyan-500 transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white text-sm sm:text-base focus:outline-none focus:border-cyan-500 transition"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm sm:text-base font-bold rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-4 sm:mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setFormData({ name: '', email: '', password: '' });
            }}
            className="text-cyan-400 hover:text-cyan-300 transition text-xs sm:text-sm font-mono"
          >
            {mode === 'login' ? '[ CREATE_NEW_ACCOUNT ]' : '[ ALREADY_HAVE_ACCOUNT ]'}
          </button>
        </div>

        {/* Demo Credentials */}
        {mode === 'login' && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-black/30 rounded border border-cyan-500/20">
            <p className="text-[10px] sm:text-xs text-gray-400 font-mono mb-1 sm:mb-2">DEMO CREDENTIALS:</p>
            <p className="text-[10px] sm:text-xs text-cyan-400 font-mono">admin@voidvendor.com / admin123</p>
            <p className="text-[10px] sm:text-xs text-cyan-400 font-mono">test@example.com / test123</p>
          </div>
        )}
      </div>
    </div>
  );
};
