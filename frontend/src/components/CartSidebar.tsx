import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartSidebar = ({ isOpen, onClose, onCheckout }: CartSidebarProps) => {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    onCheckout();
    onClose();
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      toast.success('Cart cleared');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-dark-card shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-cyan-500/20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-dark-light flex items-center justify-between border-b border-cyan-500/20">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Shopping Cart</h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {items.length === 0 ? (
            <div className="text-center text-white/60 py-12 font-mono text-sm">
              [ CART_EMPTY ]
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 animate-slide-up border border-cyan-500/10"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 pr-2">
                      <h4 className="text-white font-semibold mb-1 text-sm sm:text-base line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-green-400 font-bold text-sm sm:text-base">
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="p-1.5 sm:p-2 bg-cyan-600 hover:bg-cyan-500 rounded-full transition-colors"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="text-white font-bold min-w-[24px] sm:min-w-[30px] text-center text-sm sm:text-base">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="p-1.5 sm:p-2 bg-cyan-600 hover:bg-cyan-500 rounded-full transition-colors"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="text-white/70 ml-auto text-xs sm:text-sm">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 bg-dark-light border-t border-cyan-500/30">
            <div className="flex items-center justify-between text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              <span>Total:</span>
              <span className="text-green-400">${getTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-full text-white text-sm sm:text-base font-bold transition-all mb-2 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            >
              Checkout
            </button>
            <button
              onClick={handleClearCart}
              className="w-full py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full text-red-400 text-sm sm:text-base font-bold transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};
