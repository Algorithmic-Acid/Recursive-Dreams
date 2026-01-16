import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`Added ${product.name} to cart!`);
  };

  return (
    <div className="bg-dark-card rounded-xl sm:rounded-2xl overflow-hidden hover:transform hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-cyan-500/20 animate-fade-in border border-cyan-500/10 hover:border-cyan-500/30">
      {/* Product Icon/Image */}
      <div className="h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-br from-cyan-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
        {product.icon}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="text-[10px] sm:text-xs text-cyan-400 uppercase font-bold mb-1 sm:mb-2 tracking-wider">
          {product.category.replace('_', ' ')}
        </div>
        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-white/70 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-full text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Add</span>
          </button>
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
