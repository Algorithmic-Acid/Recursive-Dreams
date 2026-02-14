import { ShoppingCart, Search, Zap, User, LogOut, Menu, X, Shield, Download, Package, Heart, MessageSquare, Bug } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ProductCategory } from '../types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';

const BugReportModal = lazy(() => import('./BugReportModal').then(m => ({ default: m.BugReportModal })));

interface HeaderProps {
  onCategoryChange: (category: ProductCategory | 'all') => void;
  onSearch: (query: string) => void;
  onCartClick: () => void;
  user: { name: string; email: string } | null;
  isAdmin: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
}

export const Header = ({ onCategoryChange, onSearch, onCartClick, user, isAdmin, onLogin, onRegister, onLogout }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const authUser = useAuthStore((state) => state.user);

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
    <>
    <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-md shadow-lg border-b border-cyan-500/20">
      <div className="container mx-auto px-3 sm:px-4">

        {/* Single main row */}
        <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-pulse" />
            <div className="flex flex-col leading-none">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wider whitespace-nowrap">
                VOID VENDOR<sup className="text-[7px] align-super ml-0.5">™</sup>
              </h1>
              <span className="hidden sm:block text-[8px] text-cyan-400/50 tracking-[0.2em] font-light">虚空販売 ・ ボイドベンダー</span>
            </div>
          </Link>

          {/* Desktop Navigation — center */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onCategoryChange(cat.value)}
                className="px-2.5 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium whitespace-nowrap"
              >
                {cat.label}
              </button>
            ))}

            {/* Divider */}
            <span className="w-px h-4 bg-white/15 mx-2 shrink-0" />

            <Link to="/forum" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all text-sm font-medium">
              <MessageSquare className="w-3.5 h-3.5" />Forum
            </Link>
            <Link to="/downloads" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all text-sm font-medium">
              <Download className="w-3.5 h-3.5" />Free
            </Link>
            <Link to="/donate" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 transition-all text-sm font-medium">
              <Heart className="w-3.5 h-3.5" />Donate
            </Link>
            <button type="button" onClick={() => setBugModalOpen(true)} title="Report a bug"
              className="p-1.5 rounded-md text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all">
              <Bug className="w-4 h-4" />
            </button>
          </nav>

          {/* Right side — Search + Auth + Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">

            {/* Inline search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:border-cyan-500/40 focus-within:border-cyan-500/60 focus-within:bg-white/8 transition-all">
                <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
                  placeholder="Search..."
                  className="bg-transparent text-white text-sm w-28 focus:w-40 focus:outline-none placeholder-white/30 transition-all duration-300"
                />
              </div>
            </form>

            {/* Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1.5">
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400 hover:bg-purple-500/30 transition-all text-xs font-mono">
                    <Shield className="w-3 h-3" />ADMIN
                  </Link>
                )}
                <Link to="/my-purchases" className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 hover:bg-green-500/30 transition-all text-xs font-mono">
                  <Package className="w-3 h-3" />ORDERS
                </Link>
                <Link to="/profile" className="hidden md:flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:border-cyan-400 transition-all">
                  <Avatar src={authUser?.avatarUrl} name={user.name} size="sm" />
                  <span className="text-xs text-cyan-400 font-mono truncate max-w-[90px]">{user.name}</span>
                </Link>
                <button type="button" onClick={onLogout} className="p-1.5 text-white/40 hover:text-cyan-400 transition-colors" aria-label="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <button type="button" onClick={onLogin} className="px-3 py-1.5 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-colors">
                  LOGIN
                </button>
                <button type="button" onClick={onRegister} className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono text-xs rounded-full hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all">
                  REGISTER
                </button>
              </div>
            )}

            {/* Cart */}
            <button type="button" onClick={onCartClick} className="relative p-1.5 hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5 text-white" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-white hover:text-cyan-400 transition-colors" aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-cyan-500/20 pt-3 animate-fade-in">
            {/* Mobile Auth */}
            <div className="flex flex-col items-center gap-3 mb-4 pb-3 border-b border-cyan-500/10">
              {user ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:border-cyan-400 transition-all"
                    >
                      <Avatar src={authUser?.avatarUrl} name={user.name} size="sm" />
                      <span className="text-sm text-cyan-400 font-mono">{user.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                      className="px-3 py-1.5 text-gray-400 hover:text-cyan-400 transition-colors font-mono text-sm"
                    >
                      LOGOUT
                    </button>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-400 hover:bg-cyan-500/30 transition-all font-mono text-sm"
                  >
                    <User className="w-4 h-4" />
                    MY PROFILE
                  </Link>
                  <Link
                    to="/my-purchases"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded text-green-400 hover:bg-green-500/30 transition-all font-mono text-sm"
                  >
                    <Package className="w-4 h-4" />
                    MY PURCHASES
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded text-purple-400 hover:bg-purple-500/30 transition-all font-mono text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      ADMIN PANEL
                    </Link>
                  )}
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
              <Link
                to="/forum"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 hover:border-purple-500/60 rounded-lg text-purple-400 text-sm font-medium transition-all text-center flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                Forum
              </Link>
              <Link
                to="/downloads"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-500/60 rounded-lg text-cyan-400 text-sm font-medium transition-all text-center flex items-center justify-center gap-1"
              >
                <Download className="w-4 h-4" />
                Free
              </Link>
              <Link
                to="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 hover:border-pink-500/60 rounded-lg text-pink-400 text-sm font-medium transition-all text-center flex items-center justify-center gap-1"
              >
                <Heart className="w-4 h-4" />
                Donate
              </Link>
              <button
                type="button"
                onClick={() => { setBugModalOpen(true); setMobileMenuOpen(false); }}
                className="px-3 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 hover:border-orange-500/60 rounded-lg text-orange-400 text-sm font-medium transition-all text-center flex items-center justify-center gap-1"
              >
                <Bug className="w-4 h-4" />
                Report Bug
              </button>
            </div>
          </div>
        )}
      </div>
    </header>

    {bugModalOpen && <Suspense fallback={null}><BugReportModal onClose={() => setBugModalOpen(false)} /></Suspense>}
  </>
  );
};
