import { useState } from 'react';
import { X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderAPI } from '../services/orderApi';
import { ShippingAddress } from '../types/order';
import toast from 'react-hot-toast';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Checkout = ({ isOpen, onClose }: CheckoutProps) => {
  const { items, getTotal, clearCart } = useCartStore();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated() || !token) {
      toast.error('Please login to place an order');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod: 'card',
      };

      await orderAPI.create(orderData, token);

      toast.success('Order placed successfully!');
      clearCart();
      onClose();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(
        error.response?.data?.error || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-dark-card">
            <h2 className="text-2xl font-bold text-white">Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Order Summary */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{item.product.icon}</span>
                      <div>
                        <p className="text-white font-medium">{item.product.name}</p>
                        <p className="text-white/60 text-sm">
                          ${item.product.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-white font-bold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xl font-bold text-white">Total:</span>
                <span className="text-2xl font-bold text-green-400">
                  ${getTotal().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Form */}
            <form onSubmit={handleSubmit}>
              <h3 className="text-xl font-bold text-white mb-4">Shipping Address</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="123 Main St, Apt 4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 mb-2">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Place Order - $${getTotal().toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
