import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, MessageCircle, Zap, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-dark-card mt-12 sm:mt-16 md:mt-20 border-t border-cyan-500/20">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">VOID VENDOR<sup className="text-[8px] sm:text-[10px]">™</sup></h3>
            </div>
            <p className="text-white/70 text-xs sm:text-sm">
              Premium audio gear, cutting-edge hardware, and exclusive cyberpunk apparel for the digital underground.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-cyan-400 mb-2 sm:mb-4 font-mono">[ LINKS ]</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/about" className="text-white/70 hover:text-cyan-400 transition-colors text-xs sm:text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/downloads" className="text-white/70 hover:text-cyan-400 transition-colors text-xs sm:text-sm">
                  Downloads
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-cyan-400 transition-colors text-xs sm:text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/70 hover:text-cyan-400 transition-colors text-xs sm:text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-cyan-400 transition-colors text-xs sm:text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/70 hover:text-cyan-400 transition-colors text-xs sm:text-sm">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Support */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-cyan-400 mb-2 sm:mb-4 font-mono">[ CONNECT ]</h3>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <a
                href="https://www.facebook.com/profile.php?id=61587271689585"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="p-2 sm:p-3 bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 rounded-full transition-all"
              >
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
              <a
                href="#"
                title="Twitter"
                className="p-2 sm:p-3 bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 rounded-full transition-all"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
              <a
                href="#"
                title="Instagram"
                className="p-2 sm:p-3 bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 rounded-full transition-all"
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
              <a
                href="#"
                title="Discord"
                className="p-2 sm:p-3 bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 rounded-full transition-all"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
            </div>
            {/* Donate Link */}
            <Link
              to="/donate"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 rounded-lg text-pink-400 hover:text-pink-300 transition-all text-sm font-medium"
            >
              <Heart className="w-4 h-4" />
              <span>Support with Crypto</span>
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-cyan-500/10 pt-6 sm:pt-8 text-center">
          <p className="text-white/40 text-[10px] sm:text-xs font-mono">&lt; VOID_VENDOR™ :: 2026 :: ALL_RIGHTS_RESERVED /&gt;</p>
        </div>
      </div>
    </footer>
  );
};
