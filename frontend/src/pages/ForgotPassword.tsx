import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import api from '../services/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.success) {
        setSubmitted(true);
        toast.success('Password reset email sent! Check your inbox.');
      } else {
        toast.error(response.data.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
          {!submitted ? (
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
                  Forgot Password?
                </h1>
                <p className="text-white/60 text-sm font-mono">
                  {'>'} RESET_PASSWORD_PROTOCOL {'<'}
                </p>
              </div>

              {/* Description */}
              <p className="text-white/70 mb-6 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-cyan-500/30 rounded text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="text-cyan-400 hover:text-cyan-300 transition text-sm font-mono"
                >
                  [ BACK_TO_LOGIN ]
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-dark-card border border-green-500/30 rounded-lg p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Check Your Email
              </h2>

              <p className="text-white/70 mb-4">
                If an account exists with <span className="text-cyan-400 font-mono">{email}</span>, you will receive a password reset link shortly.
              </p>

              <p className="text-white/50 text-sm mb-6">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>

              <Link
                to="/"
                className="inline-block px-6 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded hover:bg-cyan-500/30 transition-all font-mono text-sm"
              >
                [ RETURN_HOME ]
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
