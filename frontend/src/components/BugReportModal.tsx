import { useState } from 'react';
import { X, Bug, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://www.voidvendor.com';

interface Props {
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  medium: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  high: 'text-red-400 border-red-500/40 bg-red-500/10',
};

export const BugReportModal = ({ onClose }: Props) => {
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState(window.location.pathname);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/bugs`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ title, description, pageUrl, severity }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error || 'Failed to submit. Try again.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-card border border-orange-500/40 rounded-xl w-full max-w-md shadow-[0_0_40px_rgba(249,115,22,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-500/20">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-400" />
            <h2 className="text-white font-mono text-sm font-bold">[ REPORT A BUG ]</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-white font-mono text-sm">Bug report submitted!</p>
            <p className="text-white/50 text-xs">Thanks for helping improve Void Vendor.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-green-500/20 border border-green-500/40 text-green-400 font-mono text-sm rounded-lg hover:bg-green-500/30 transition-all"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {user && (
              <p className="text-white/40 text-xs font-mono">Submitting as <span className="text-cyan-400">{user.email}</span></p>
            )}

            {/* Title */}
            <div>
              <label className="text-white/50 text-xs font-mono block mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short description of the issue"
                className="w-full px-3 py-2 bg-white/10 text-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-white/20"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="text-white/50 text-xs font-mono block mb-2">Severity</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-all capitalize ${
                      severity === s
                        ? SEVERITY_COLORS[s]
                        : 'border-white/10 text-white/30 hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-white/50 text-xs font-mono block mb-1">Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened? What did you expect? Steps to reproduce..."
                rows={4}
                className="w-full px-3 py-2 bg-white/10 text-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-white/20 resize-none"
              />
            </div>

            {/* Page */}
            <div>
              <label className="text-white/50 text-xs font-mono block mb-1">Page (optional)</label>
              <input
                type="text"
                value={pageUrl}
                onChange={e => setPageUrl(e.target.value)}
                placeholder="/checkout"
                className="w-full px-3 py-2 bg-white/10 text-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-white/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-mono text-sm rounded-lg transition-all"
              >
                {loading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-mono text-sm rounded-lg transition-all"
              >
                CANCEL
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
