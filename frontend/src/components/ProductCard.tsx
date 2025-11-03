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
    <div className="bg-dark-card rounded-2xl overflow-hidden hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 animate-fade-in">
      {/* Product Icon/Image */}
      <div className="h-64 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-8xl">
        {product.icon}
      </div>

      {/* Product Info */}
      <div className="p-6">
        <div className="text-xs text-secondary uppercase font-bold mb-2">
          {product.category}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
        <p className="text-white/70 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-400">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 bg-primary hover:bg-secondary rounded-full text-white font-medium transition-colors flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Stock Info */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="mt-3 text-xs text-yellow-400">
            Only {product.stock} left in stock!
          </div>
        )}
        {product.stock === 0 && (
          <div className="mt-3 text-xs text-red-400">Out of stock</div>
        )}
      </div>
    </div>
  );
};
