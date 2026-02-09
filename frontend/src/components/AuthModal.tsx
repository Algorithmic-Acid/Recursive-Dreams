import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const authLogin = useAuthStore((state) => state.login);

  // Sync mode when initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormData({ name: '', email: '', password: '' });
      setShowForgotPassword(false);
      setForgotSent(false);
      setForgotEmail('');
    }
  }, [isOpen, initialMode]);

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
        const { token, user } = response.data.data;

        // Store token in localStorage (for backward compatibility)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update Zustand auth store - map isAdmin boolean to role string
        authLogin({ ...user, role: user.isAdmin ? 'admin' : 'user', avatarUrl: user.avatarUrl || '' }, token);

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

        {showForgotPassword ? (
          /* Forgot Password View */
          <>
            <div className="mb-4 sm:mb-6 pr-8">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                Reset Password
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm font-mono">
                {'>'} RESET_PASSWORD_PROTOCOL {'<'}
              </p>
            </div>

            {!forgotSent ? (
              <>
                <p className="text-white/70 mb-4 text-xs sm:text-sm">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: forgotEmail }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setForgotSent(true);
                      } else {
                        toast.error(data.error || 'Failed to send reset email');
                      }
                    } catch {
                      toast.error('Failed to send reset email');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white text-sm sm:text-base focus:outline-none focus:border-cyan-500 transition"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm sm:text-base font-bold rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-green-400 font-bold text-lg mb-2">Check Your Email</h3>
                <p className="text-white/70 text-sm mb-2">
                  If an account exists with <span className="text-cyan-400 font-mono text-xs">{forgotEmail}</span>, you'll receive a reset link shortly.
                </p>
                <p className="text-white/50 text-xs">The link expires in 1 hour.</p>
              </div>
            )}

            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSent(false);
                  setForgotEmail('');
                }}
                className="text-cyan-400 hover:text-cyan-300 transition text-xs sm:text-sm font-mono inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" />
                [ BACK_TO_LOGIN ]
              </button>
            </div>
          </>
        ) : (
          /* Login / Register View */
          <>
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

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-cyan-400 hover:text-cyan-300 transition text-xs sm:text-sm"
                >
                  Forgot password?
                </button>
              </div>
            )}

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
          </>
        )}

      </div>
    </div>
  );
};
