import { ShoppingCart, Search, Zap, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ProductCategory } from '../types';
import { useCartStore } from '../store/cartStore';

interface HeaderProps {
  onCategoryChange: (category: ProductCategory | 'all') => void;
  onSearch: (query: string) => void;
  onCartClick: () => void;
  user: { name: string; email: string } | null;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
}

export const Header = ({ onCategoryChange, onSearch, onCartClick, user, onLogin, onRegister, onLogout }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const categories: { value: ProductCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'synthesizers', label: 'Synths' },
    { value: 'midi_controllers', label: 'MIDI' },
    { value: 'effects_pedals', label: 'FX' },
    { value: 'hoodies', label: 'Hoodies' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'pants', label: 'Pants' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-md shadow-lg border-b border-cyan-500/20">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 animate-pulse" />
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
              VOID VENDOR
            </h1>
            <div className="hidden lg:block text-xs text-cyan-400/70 font-mono">[ ONLINE ]</div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-4 xl:gap-6">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onCategoryChange(cat.value)}
                className="text-white hover:text-cyan-400 transition-colors font-medium text-sm xl:text-base"
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Right Side - Auth & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm text-cyan-400 font-mono truncate max-w-[80px] sm:max-w-[120px]">{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs sm:text-sm"
                >
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={onRegister}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono text-xs sm:text-sm rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all"
                >
                  REGISTER
                </button>
              </div>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={onCartClick}
              className="relative p-1.5 sm:p-2 hover:scale-110 transition-transform"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-white hover:text-cyan-400 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pb-3 sm:pb-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-3 sm:px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm sm:text-base"
            />
            <button
              type="submit"
              className="px-3 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-full text-white font-medium transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-cyan-500/20 pt-3 animate-fade-in">
            {/* Mobile Auth */}
            <div className="flex items-center justify-center gap-3 mb-4 pb-3 border-b border-cyan-500/10">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-400 font-mono">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="px-3 py-1.5 text-gray-400 hover:text-cyan-400 transition-colors font-mono text-sm"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                    className="px-4 py-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm border border-cyan-500/30 rounded"
                  >
                    LOGIN
                  </button>
                  <button
                    type="button"
                    onClick={() => { onRegister(); setMobileMenuOpen(false); }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono text-sm rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all"
                  >
                    REGISTER
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Categories Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { onCategoryChange(cat.value); setMobileMenuOpen(false); }}
                  className="px-3 py-2.5 bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg text-white text-sm font-medium transition-all text-center"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
