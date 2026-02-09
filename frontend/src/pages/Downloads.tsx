import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Music, Monitor, Cpu, Zap } from 'lucide-react';

interface FreeDownload {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  fileSize: string;
  filename: string;
  platform: string[];
  downloadCount: number;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const Downloads = () => {
  const [downloads, setDownloads] = useState<FreeDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/free-downloads/list`);
        const data = await res.json();
        if (data.success) {
          setDownloads(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch free downloads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  const handleDownload = async (item: FreeDownload) => {
    // Track download
    try {
      await fetch(`${API_URL}/api/products/free-downloads/${item.id}/download`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }

    // Trigger download
    window.location.href = `/downloads/${item.filename}`;
  };

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
            <Download className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              FREE DOWNLOADS
            </h1>
          </div>
          <p className="text-white/70 font-mono">[ AUDIO_SOFTWARE :: FREE_TOOLS ]</p>
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
            <p className="text-white/50 font-mono">[ NO_DOWNLOADS_AVAILABLE ]</p>
          </div>
        )}

        {/* Downloads Grid */}
        {!loading && downloads.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {downloads.map((item) => (
              <div
                key={item.id}
                className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                      <Music className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
                    <p className="text-white/70 mb-4">{item.description}</p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-white/60">Version:</span>
                        <span className="text-cyan-400 font-mono">{item.version}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span className="text-white/60">Size:</span>
                        <span className="text-purple-400 font-mono">{item.fileSize}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Monitor className="w-4 h-4 text-pink-400" />
                        <span className="text-white/60">Platform:</span>
                        <span className="text-pink-400 font-mono">{item.platform?.join(', ') || 'Windows'}</span>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      DOWNLOAD FREE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// INSTALLATION</h3>
            <div className="space-y-4 text-white/70">
              <div>
                <h4 className="text-white font-semibold mb-2">Windows VST3 Installation:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Download and extract the ZIP file</li>
                  <li>Copy the .vst3 file to: <code className="text-cyan-400 bg-black/30 px-2 py-0.5 rounded">C:\Program Files\Common Files\VST3\</code></li>
                  <li>Restart your DAW and scan for new plugins</li>
                  <li>The plugin should appear in your VST3 plugin list</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* More Coming Soon */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <p className="text-white/50 font-mono text-sm">[ MORE_FREE_TOOLS_COMING_SOON ]</p>
        </div>
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
