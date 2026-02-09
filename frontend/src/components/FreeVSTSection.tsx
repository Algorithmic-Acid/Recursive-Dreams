import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Music, Zap } from 'lucide-react';

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

export const FreeVSTSection = () => {
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

  const trackDownload = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/products/free-downloads/${id}/download`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }
  };

  if (loading) {
    return (
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-10 md:py-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-10">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Free VST Plugins
          </span>
        </h2>
        <div className="text-center text-white/50 font-mono">[ LOADING... ]</div>
      </section>
    );
  }

  if (downloads.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-10 md:py-12">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-10">
        <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Free VST Plugins
        </span>
      </h2>

      <div className="max-w-4xl mx-auto grid gap-4 sm:gap-6">
        {downloads.map((plugin) => (
          <div key={plugin.id} className="bg-dark-card border border-cyan-500/30 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all group">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30 group-hover:border-cyan-500/50 transition-colors">
                  <Music className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">FREE</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-mono rounded">VST3</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{plugin.name}</h3>
                <p className="text-white/70 text-sm mb-3">{plugin.description}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-white/50 mb-3">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    v{plugin.version}
                  </span>
                  <span>{plugin.platform?.join(', ') || 'Windows'} VST3</span>
                  <span>{plugin.fileSize}</span>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex-shrink-0">
                <a
                  href={`/downloads/${plugin.filename}`}
                  onClick={() => trackDownload(plugin.id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          to="/downloads"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-cyan-500/30 text-cyan-400 font-bold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-sm sm:text-base"
        >
          VIEW ALL FREE DOWNLOADS
        </Link>
      </div>
    </section>
  );
};
