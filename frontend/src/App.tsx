import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { Checkout } from './components/Checkout';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { FreeVSTSection } from './components/FreeVSTSection';
import { About, Admin, Contact, Donate, Downloads, FAQ, ForgotPassword, Forum, MyPurchases, Privacy, ProductDetail, ResetPassword, Terms, UserProfile } from './pages';
import { Product, ProductCategory } from './types';
import { productAPI } from './services/api';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Use Zustand as single source of truth for auth
  const authUser = useAuthStore((state) => state.user);
  const authToken = useAuthStore((state) => state.token);
  const authLogin = useAuthStore((state) => state.login);
  const authLogout = useAuthStore((state) => state.logout);

  // Derive user/admin from Zustand store
  const user = authUser ? { name: authUser.name, email: authUser.email } : null;
  const isAdmin = authUser?.role === 'admin';

  // On mount, sync localStorage -> Zustand (for first load / hydration)
  useEffect(() => {
    if (!authToken) {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          // Check token expiry
          if (tokenData.exp * 1000 > Date.now()) {
            authLogin({ ...parsedUser, role: tokenData.role || (parsedUser.isAdmin ? 'admin' : 'user') }, token);
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          authLogout();
        }
      }
    }
  }, [authToken, authLogin, authLogout]);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast.error('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategoryChange = async (category: ProductCategory | 'all') => {
    try {
      setLoading(true);
      if (category === 'all') {
        const data = await productAPI.getAll();
        setFilteredProducts(data);
      } else {
        const data = await productAPI.getByCategory(category);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error('Failed to filter products:', error);
      toast.error('Failed to filter products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    try {
      setLoading(true);
      const data = await productAPI.search(query);
      setFilteredProducts(data);
      if (data.length === 0) {
        toast('No products found', { icon: '🔍' });
      }
    } catch (error) {
      console.error('Failed to search products:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authLogout();
    toast.success('Logged out successfully');
  };

  const handleAuthSuccess = () => {
    // Zustand store is already updated by AuthModal's authLogin call
    // Just close the modal - user/isAdmin derive from Zustand automatically
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      <Header
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      {/* Early Access Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/80 via-black to-cyan-900/80 border-y border-cyan-500/30">
        {/* Animated scan line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(cyan_1px,transparent_1px),linear-gradient(90deg,cyan_1px,transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative container mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
            {/* Glitch logo/icon */}
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl animate-pulse">⚡</span>
              <div className="relative">
                <span className="text-xs sm:text-sm font-mono text-cyan-400 tracking-widest uppercase">
                  [ SYSTEM_STATUS ]
                </span>
              </div>
            </div>

            {/* Main message */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="relative group">
                <span className="text-white/90 text-sm sm:text-base font-medium">
                  <span className="text-pink-400 font-bold">ALPHA BUILD</span>
                  <span className="text-white/60 mx-2">—</span>
                  <span className="text-white/80">Initializing the void...</span>
                </span>
              </div>

              {/* CTA */}
              <Link
                to="/downloads"
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 hover:border-cyan-400 rounded-full text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-mono transition-all hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] group"
              >
                <span className="relative">
                  <span className="group-hover:animate-pulse">↓</span>
                </span>
                <span>DOWNLOAD_FREE_PLUGINS</span>
                <span className="text-cyan-500/60">.exe</span>
              </Link>
            </div>

            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-white/40">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span>ONLINE</span>
            </div>
          </div>
        </div>

        {/* Bottom glitch line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      </div>

      <Hero />

      {/* Free VST Section */}
      <FreeVSTSection />

      {/* Products Section */}
      <section id="products" className="container mx-auto px-3 sm:px-4 py-8 sm:py-10 md:py-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Featured Products
          </span>
        </h2>

        {loading ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-block w-8 h-8 sm:w-10 sm:h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-cyan-400 text-base sm:text-lg font-mono">
              [ LOADING_PRODUCTS... ]
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-white/60 text-base sm:text-lg md:text-xl py-16 sm:py-20 font-mono">
            [ NO_PRODUCTS_FOUND ]
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      <Checkout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/my-purchases" element={<MyPurchases />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
