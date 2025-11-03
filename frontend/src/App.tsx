import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { Checkout } from './components/Checkout';
import { Footer } from './components/Footer';
import { Product, ProductCategory } from './types';
import { productAPI } from './services/api';
import toast from 'react-hot-toast';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      <Toaster position="top-right" />

      <Header
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        onCartClick={() => setIsCartOpen(true)}
      />

      <Hero />

      {/* Products Section */}
      <section id="products" className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Featured Products
        </h2>

        {loading ? (
          <div className="text-center text-white text-xl py-20">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-white/60 text-xl py-20">
            No products found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
}

export default App;
