import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import api from '../services/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        toast.error(response.data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header
        onCategoryChange={() => {}}
        onSearch={() => {}}
        onCartClick={() => {}}
        user={null}
        isAdmin={false}
        onLogin={() => {}}
        onRegister={() => {}}
        onLogout={() => {}}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {!success ? (
            <div className="bg-dark-card border border-cyan-500/30 rounded-lg p-6 sm:p-8">
              {/* Back Link */}
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                  Reset Password
                </h1>
                <p className="text-white/60 text-sm font-mono">
                  {'>'} NEW_PASSWORD_PROTOCOL {'<'}
                </p>
              </div>

              {/* Description */}
              <p className="text-white/70 mb-6 text-sm">
                Enter your new password below.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-sm">Passwords do not match</p>
                )}

                <button
                  type="submit"
                  disabled={loading || password !== confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-dark-card border border-green-500/30 rounded-lg p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Password Reset!
              </h2>

              <p className="text-white/70 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>

              <p className="text-white/50 text-sm">
                Redirecting to home page...
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
