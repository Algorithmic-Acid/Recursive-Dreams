import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Download, Heart, Zap } from 'lucide-react';
import { Product, PricingVariant } from '../types';
import { productAPI } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { Footer } from '../components/Footer';
import toast from 'react-hot-toast';

export const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PricingVariant | undefined>(undefined);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);
        // Fetch all products and find by slug
        const products = await productAPI.getAll();
        const found = products.find((p: Product) =>
          p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug ||
          p.id === slug
        );

        if (found) {
          setProduct(found);
          if (found.pricing_variants && found.pricing_variants.length > 0) {
            setSelectedVariant(found.pricing_variants[0]);
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedVariant);
    const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : '';
    toast.success(`Added ${product.name}${variantLabel} to cart!`);
  };

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const isFree = product?.price === 0 && (!product.pricing_variants || product.pricing_variants.length === 0);
  const hasDownload = !!product?.download_url;

  // Products that have a "steal it" free download option
  const stealItProducts: Record<string, string> = {
    'void-mod': 'VoidMod.zip',
  };
  const canStealIt = slug && stealItProducts[slug];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-cyan-400 text-lg font-mono">[ LOADING_PRODUCT... ]</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
        <div className="container mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
            <ArrowLeft className="w-5 h-5" />
            Back to Store
          </Link>
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
            <p className="text-white/60 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-md shadow-lg border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
                VOID VENDOR<sup className="text-xs align-super ml-0.5">™</sup>
              </h1>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Product Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image/Icon */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-cyan-900/50 via-purple-900/50 to-pink-900/50 rounded-2xl flex items-center justify-center border border-cyan-500/20">
              <span className="text-[120px] sm:text-[180px] md:text-[200px]">{product.icon}</span>
            </div>
            {isFree && (
              <div className="absolute top-4 right-4 px-4 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg">
                FREE
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category */}
            <div className="text-cyan-400 uppercase font-bold text-sm tracking-wider mb-2">
              {product.category.replace('_', ' ')}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-white/70 text-lg leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Pricing Variants */}
            {product.pricing_variants && product.pricing_variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white/50 uppercase font-mono text-sm tracking-wider mb-3">
                  Select Edition
                </h3>
                <div className="space-y-3">
                  {product.pricing_variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,255,255,0.2)]'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {variant.name.toLowerCase().includes('supporter') && (
                          <Heart className="w-5 h-5 text-pink-400" />
                        )}
                        <div className="text-left">
                          <span className="text-white font-medium text-lg">{variant.name}</span>
                          {variant.description && (
                            <p className="text-white/50 text-sm">{variant.description}</p>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold text-xl ${
                        selectedVariant?.id === variant.id ? 'text-green-400' : 'text-white/70'
                      }`}>
                        {variant.price === 0 ? 'FREE' : `$${variant.price.toFixed(2)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-green-400">
                {isFree || displayPrice === 0 ? 'FREE' : `$${displayPrice.toFixed(2)}`}
              </span>
            </div>

            {/* Action Button */}
            {hasDownload ? (
              <a
                href={product.download_url}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 rounded-full text-white text-lg font-bold transition-all flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,255,200,0.4)]"
              >
                <Download className="w-6 h-6" />
                Download Now
              </a>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-full text-white text-lg font-bold transition-all flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
              >
                <ShoppingCart className="w-6 h-6" />
                Add to Cart
              </button>
            )}

            {/* Steal It Option */}
            {canStealIt && (
              <a
                href={`/downloads/${stealItProducts[slug!]}`}
                className="w-full mt-3 py-3 bg-gradient-to-r from-red-600/80 to-pink-600/80 hover:from-red-500 hover:to-pink-500 rounded-full text-white text-base font-bold transition-all flex items-center justify-center gap-2 border border-red-500/50 hover:shadow-[0_0_15px_rgba(255,0,100,0.3)]"
              >
                <span className="text-lg">🏴‍☠️</span>
                Steal It (Free Download)
              </a>
            )}

            {/* Stock Info */}
            {product.stock < 10 && product.stock > 0 && (
              <div className="mt-4 text-yellow-400 font-mono text-sm">
                [ {product.stock} IN_STOCK ]
              </div>
            )}
            {product.stock === 0 && (
              <div className="mt-4 text-red-400 font-mono text-sm">
                [ OUT_OF_STOCK ]
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/50">Category</span>
                  <p className="text-white font-medium capitalize">{product.category.replace('_', ' ')}</p>
                </div>
                {product.file_size_mb && (
                  <div>
                    <span className="text-white/50">File Size</span>
                    <p className="text-white font-medium">{product.file_size_mb} MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
