import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { Checkout } from './components/Checkout';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Product, ProductCategory } from './types';
import { productAPI } from './services/api';
import toast from 'react-hot-toast';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

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
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleAuthSuccess = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      <Toaster position="top-right" />

      <Header
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      <Hero />

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

export default App;
