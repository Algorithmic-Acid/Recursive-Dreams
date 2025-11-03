import { Facebook, Twitter, Instagram, MessageCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-dark-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">About Us</h3>
            <p className="text-white/70">
              Algorithmic Acid offers the best selection of shirts, music, anime,
              games, and software.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-secondary transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-secondary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-secondary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-secondary transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-3 bg-white/10 hover:bg-primary rounded-full transition-colors"
              >
                <Facebook className="w-6 h-6 text-white" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/10 hover:bg-primary rounded-full transition-colors"
              >
                <Twitter className="w-6 h-6 text-white" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/10 hover:bg-primary rounded-full transition-colors"
              >
                <Instagram className="w-6 h-6 text-white" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/10 hover:bg-primary rounded-full transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center text-white/60">
          <p>&copy; 2025 Algorithmic Acid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
