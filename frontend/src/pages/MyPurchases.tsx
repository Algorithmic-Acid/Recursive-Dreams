import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Package, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { downloadAPI, PurchasedDownload } from '../services/downloadApi';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

export const MyPurchases = () => {
  const { token, isAuthenticated } = useAuthStore();
  const [downloads, setDownloads] = useState<PurchasedDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!isAuthenticated() || !token) {
        setLoading(false);
        return;
      }

      try {
        const data = await downloadAPI.getMyDownloads(token);
        setDownloads(data);
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
        toast.error('Failed to load purchases');
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [token, isAuthenticated]);

  const handleDownload = (productId: string, name: string) => {
    toast.success(`Starting download: ${name}`);
    window.open(`${API_URL}/api/downloads/file/${productId}?token=${token}`, '_blank');
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
        <div className="bg-dark-card border-b border-cyan-500/20">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-mono text-sm">BACK_TO_STORE</span>
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Please Log In</h2>
          <p className="text-white/60">You need to be logged in to view your purchases.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      {/* Header */}
      <div className="bg-dark-card border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-mono text-sm">BACK_TO_STORE</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              MY PURCHASES
            </h1>
          </div>
          <p className="text-white/70 font-mono">[ YOUR_DIGITAL_DOWNLOADS ]</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white/50 font-mono">[ LOADING... ]</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && downloads.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Purchases Yet</h3>
            <p className="text-white/50 mb-6">You haven't purchased any downloadable products yet.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Downloads List */}
        {!loading && downloads.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            {downloads.map((item) => (
              <div
                key={item.productId}
                className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{item.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.name}</h3>
                      <p className="text-white/50 text-sm">
                        Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(item.productId, item.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Installation Instructions */}
        {!loading && downloads.length > 0 && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 font-mono">// INSTALLATION</h3>
              <div className="text-white/70 text-sm space-y-2">
                <p>1. Download and extract the ZIP file</p>
                <p>2. Copy the .vst3 file to: <code className="text-cyan-400 bg-black/30 px-2 py-0.5 rounded">C:\Program Files\Common Files\VST3\</code></p>
                <p>3. Restart your DAW and scan for new plugins</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-dark-card border-t border-cyan-500/20 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/40 text-xs font-mono">&lt; VOID_VENDOR :: 2026 :: ALL_RIGHTS_RESERVED /&gt;</p>
        </div>
      </footer>
    </div>
  );
};
