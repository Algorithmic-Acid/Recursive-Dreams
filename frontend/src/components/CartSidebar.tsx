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
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-dark-card shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 bg-dark-light flex items-center justify-between border-b border-white/10">
          <h3 className="text-2xl font-bold text-white">Shopping Cart</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-white/60 py-12">
              Your cart is empty
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white/5 rounded-xl p-4 animate-slide-up"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">
                        {item.product.name}
                      </h4>
                      <p className="text-green-400 font-bold">
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="p-2 bg-primary hover:bg-primary-dark rounded-full transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold min-w-[30px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="p-2 bg-primary hover:bg-primary-dark rounded-full transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-white/70 ml-auto">
                      Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-dark-light border-t border-primary">
            <div className="flex items-center justify-between text-2xl font-bold text-white mb-4">
              <span>Total:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-full text-white font-bold transition-colors mb-2"
            >
              Checkout
            </button>
            <button
              onClick={handleClearCart}
              className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-full text-white font-bold transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};
