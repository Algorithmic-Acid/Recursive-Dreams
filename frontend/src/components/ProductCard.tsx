import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Download, Heart, Skull } from 'lucide-react';
import { Product, PricingVariant } from '../types';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

// Helper to generate product slug from name
const getProductSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const hasVariants = product.pricing_variants && product.pricing_variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<PricingVariant | undefined>(
    hasVariants ? product.pricing_variants![0] : undefined
  );

  const handleAddToCart = () => {
    addItem(product, selectedVariant);
    const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : '';
    toast.success(`Added ${product.name}${variantLabel} to cart!`);
  };

  const isFree = product.price === 0 && !hasVariants;
  const hasDownload = !!product.download_url;

  // Check if "Steal It" variant is selected (free download option)
  const isStealItSelected = selectedVariant?.id === 'steal' && selectedVariant?.price === 0;
  const downloadFile = product.download_file || product.metadata?.download_file;

  // Get display price (from variant or base price)
  const displayPrice = selectedVariant?.price ?? product.price;

  return (
    <div className="relative bg-dark-card rounded-xl sm:rounded-2xl overflow-hidden hover:transform hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-cyan-500/20 animate-fade-in border border-cyan-500/10 hover:border-cyan-500/30">
      {/* Free Badge */}
      {isFree && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
          FREE
        </div>
      )}

      {/* Clickable Product Icon/Image */}
      <Link to={`/product/${getProductSlug(product.name)}`} className="block">
        <div className="h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-br from-cyan-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl cursor-pointer hover:from-cyan-900/70 hover:via-purple-900/70 hover:to-pink-900/70 transition-all">
          {product.icon}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="text-[10px] sm:text-xs text-cyan-400 uppercase font-bold mb-1 sm:mb-2 tracking-wider">
          {product.category.replace('_', ' ')}
        </div>
        <Link to={`/product/${getProductSlug(product.name)}`} className="block">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-1 hover:text-cyan-400 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <p className="text-white/70 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Pricing Variant Selection */}
        {hasVariants && (
          <div className="mb-3 sm:mb-4 space-y-2">
            <div className="text-[10px] sm:text-xs text-white/50 uppercase font-mono tracking-wider mb-2">
              Select Edition
            </div>
            <div className="flex flex-col gap-2">
              {product.pricing_variants!.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`relative flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all ${
                    selectedVariant?.id === variant.id
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {variant.name.toLowerCase().includes('supporter') && (
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                    )}
                    <div className="text-left">
                      <span className="text-white text-xs sm:text-sm font-medium">{variant.name}</span>
                      {variant.description && (
                        <p className="text-white/50 text-[10px] sm:text-xs">{variant.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-bold text-sm sm:text-base ${
                    selectedVariant?.id === variant.id ? 'text-green-400' : 'text-white/70'
                  }`}>
                    {variant.price === 0 ? 'FREE' : `$${variant.price.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-lg sm:text-xl md:text-2xl font-bold ${(isFree || displayPrice === 0) ? 'text-green-400' : 'text-green-400'}`}>
            {(isFree || displayPrice === 0) ? 'FREE' : `$${displayPrice.toFixed(2)}`}
          </span>
          {isStealItSelected && downloadFile ? (
            <a
              href={`/downloads/${downloadFile}`}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-full text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(255,100,0,0.5)]"
            >
              <Skull className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Steal</span>
            </a>
          ) : hasDownload ? (
            <a
              href={product.download_url}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 rounded-full text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(0,255,200,0.4)]"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Download</span>
            </a>
          ) : (
            <button
              onClick={handleAddToCart}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-full text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add</span>
            </button>
          )}
        </div>

        {/* Stock Info */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-yellow-400 font-mono">
            [ {product.stock} IN_STOCK ]
          </div>
        )}
        {product.stock === 0 && (
          <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-red-400 font-mono">[ OUT_OF_STOCK ]</div>
        )}
      </div>
    </div>
  );
};
