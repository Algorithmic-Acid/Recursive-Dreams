import { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Lock, Download, CheckCircle, AlertCircle, Copy, Tag } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderAPI } from '../services/orderApi';
import { paymentAPI } from '../services/paymentApi';
import { promoAPI, PromoValidateResult } from '../services/api';
import { ShippingAddress } from '../types/order';
import toast from 'react-hot-toast';
import { CryptoConverter } from './CryptoConverter';

const BTC_ADDRESS = 'bc1qce33yheyq24l7x90zer5q866nx6tyx2j5atp2y';
const XMR_ADDRESS = '84SyqhuxFyg7n4VEvuRq6P1CjUVXYgSca6s9oB6RAmnL4qwNRk3YVQJNKF5WZtcQDjBHFEfv6t6NBYqHzcYuVsNEBkqUiVE';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

// Stripe promise - loaded once
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    const config = await paymentAPI.getConfig();
    stripePromise = loadStripe(config.publishableKey);
  }
  return stripePromise;
};

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      '::placeholder': {
        color: '#6b7280',
      },
      iconColor: '#06b6d4',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

interface PurchasedItem {
  productId: string;
  name: string;
  icon: string;
  isDownloadable: boolean;
}

// Inner checkout form that uses Stripe hooks
const CheckoutForm = ({ onClose }: { onClose: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getTotal, clearCart } = useCartStore();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoValidateResult | null>(null);

  // Crypto payment state
  const [cryptoPaymentId, setCryptoPaymentId] = useState<string | null>(null);
  const [cryptoStatus, setCryptoStatus] = useState<'idle' | 'awaiting_tx' | 'confirming' | 'confirmed'>('idle');
  const [txHash, setTxHash] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<'xmr' | 'btc'>('btc');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Create crypto payment order (keeps payment_status = 'pending' until verified)
  const handleCryptoCreate = async () => {
    if (!isAuthenticated() || !token) {
      toast.error('Please login to complete your order');
      return;
    }

    const allDigital = items.every(item => item.product.category === 'software');
    if (!allDigital) {
      toast.error('Crypto payments are currently only available for digital products');
      return;
    }

    setLoading(true);
    try {
      const paymentItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const result = await paymentAPI.createCryptoPayment(
        paymentItems,
        selectedCrypto,
        shippingAddress,
        token,
        appliedPromo?.valid ? appliedPromo.code : undefined
      );

      setCryptoPaymentId(result.paymentId);
      setCryptoStatus('awaiting_tx');
      toast.success(`Order created! Send ${selectedCrypto.toUpperCase()} to the address shown.`);
    } catch (error: any) {
      console.error('Crypto payment create error:', error);
      toast.error(error.response?.data?.error || 'Failed to create crypto payment');
    } finally {
      setLoading(false);
    }
  };

  // Submit TX hash and start polling for confirmation
  const handleSubmitTxHash = async () => {
    if (!cryptoPaymentId || !txHash.trim() || !token) return;

    setLoading(true);
    try {
      const result = await paymentAPI.submitCryptoTx(cryptoPaymentId, txHash.trim(), token);

      if (result.data?.status === 'confirmed') {
        // Already confirmed (fast BTC confirmation)
        handleCryptoConfirmed();
      } else {
        setCryptoStatus('confirming');
        toast.success('TX hash submitted! Verifying payment...');
        startPolling();
      }
    } catch (error: any) {
      console.error('Submit TX error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit TX hash');
    } finally {
      setLoading(false);
    }
  };

  // Poll for payment confirmation
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      if (!cryptoPaymentId || !token) return;

      try {
        const status = await paymentAPI.checkCryptoStatus(cryptoPaymentId, token);

        if (status.status === 'confirmed' || status.orderPaid) {
          handleCryptoConfirmed();
        } else if (status.status === 'expired' || status.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setCryptoStatus('idle');
          toast.error('Payment expired or failed. Please try again.');
        }
      } catch (err) {
        // Silently retry
      }
    }, 15000); // Poll every 15 seconds
  };

  // Handle confirmed crypto payment
  const handleCryptoConfirmed = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    const boughtItems: PurchasedItem[] = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      icon: item.product.icon,
      isDownloadable: true,
    }));

    setCryptoStatus('confirmed');
    clearCart();
    setPurchasedItems(boughtItems);
    setPurchaseComplete(true);
    toast.success('Payment confirmed! Your downloads are ready.');
  };

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const result = await promoAPI.validate(promoInput.trim(), getTotal());
      if (result.valid) {
        setAppliedPromo(result);
        toast.success(`Promo applied: -$${result.discountAmount?.toFixed(2)}`);
      } else {
        setAppliedPromo(null);
        toast.error(result.error || 'Invalid promo code');
      }
    } catch {
      toast.error('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isAuthenticated() || !token) {
      toast.error('Please login to complete your order');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    setCardError(null);

    try {
      // Create payment intent
      const paymentItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        variantPrice: item.selectedVariant?.price,
        variantName: item.selectedVariant?.name,
      }));

      const { clientSecret } = await paymentAPI.createPaymentIntent(
        paymentItems,
        token,
        appliedPromo?.valid ? appliedPromo.code : undefined
      );

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingAddress.fullName,
              address: {
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.zipCode,
                country: 'US',
              },
            },
          },
        }
      );

      if (error) {
        setCardError(error.message || 'Payment failed');
        toast.error(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Save items before clearing cart
        const boughtItems: PurchasedItem[] = items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          icon: item.product.icon,
          isDownloadable: item.product.category === 'software',
        }));

        // Create order after successful payment
        const orderData = {
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          shippingAddress,
          paymentMethod: 'card',
          paymentIntentId: paymentIntent.id,
        };

        await orderAPI.create(orderData, token);

        toast.success('Payment successful!');
        clearCart();
        setPurchasedItems(boughtItems);
        setPurchaseComplete(true);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage =
        error.response?.data?.error || error.message || 'Checkout failed';
      setCardError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleDownload = (productId: string) => {
    // Open download in new tab with auth
    window.open(`${API_URL}/api/downloads/file/${productId}?token=${token}`, '_blank');
  };

  // Success Screen
  if (purchaseComplete) {
    const downloadableItems = purchasedItems.filter((item) => item.isDownloadable);

    return (
      <div className="p-6 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Purchase Complete!</h3>
          <p className="text-white/60">Thank you for your order.</p>
        </div>

        {downloadableItems.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-bold text-white mb-4">Your Downloads</h4>
            <div className="space-y-3">
              {downloadableItems.map((item) => (
                <button
                  key={item.productId}
                  type="button"
                  onClick={() => handleDownload(item.productId)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg hover:border-cyan-400 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <Download className="w-5 h-5 text-cyan-400" />
                </button>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-3">
              Downloads also available in My Purchases
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-full hover:shadow-lg transition-all"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Order Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-3">Order Summary</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {items.map((item) => {
            const price = item.selectedVariant?.price ?? item.product.price;
            return (
              <div
                key={`${item.product.id}-${item.selectedVariant?.id || 'base'}`}
                className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.product.icon}</span>
                  <div>
                    <p className="text-white text-sm">{item.product.name}</p>
                    {item.selectedVariant && (
                      <p className="text-cyan-400 text-xs">
                        {item.selectedVariant.name}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-white text-sm">
                  ${(price * item.quantity).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Discount line */}
        {appliedPromo?.valid && appliedPromo.discountAmount && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-green-400 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {appliedPromo.code}
            </span>
            <span className="text-green-400">-${appliedPromo.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
          <span className="text-white font-bold">Total:</span>
          <div className="text-right">
            {appliedPromo?.valid && appliedPromo.discountAmount ? (
              <>
                <span className="text-white/40 line-through text-sm mr-2">${getTotal().toFixed(2)}</span>
                <span className="text-green-400 font-bold text-xl">${(appliedPromo.finalTotal ?? getTotal()).toFixed(2)}</span>
              </>
            ) : (
              <span className="text-green-400 font-bold text-xl">${getTotal().toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Promo Code Input */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={e => setPromoInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
            placeholder="PROMO CODE"
            className="flex-1 px-3 py-2 bg-white/10 text-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono placeholder-white/30"
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={promoLoading || !promoInput.trim()}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 text-sm font-mono rounded-lg transition-all disabled:opacity-50"
          >
            {promoLoading ? '...' : 'Apply'}
          </button>
        </div>
        {appliedPromo?.valid && (
          <button
            type="button"
            onClick={() => { setAppliedPromo(null); setPromoInput(''); }}
            className="mt-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Remove promo
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Shipping Address */}
        <h3 className="text-lg font-bold text-white mb-3">Shipping Address</h3>
        <div className="space-y-3 mb-6">
          <div>
            <input
              type="text"
              name="fullName"
              value={shippingAddress.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              placeholder="Full Name"
            />
          </div>
          <div>
            <input
              type="text"
              name="address"
              value={shippingAddress.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              placeholder="Street Address"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="city"
              value={shippingAddress.city}
              onChange={handleChange}
              required
              placeholder="City"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
            <input
              type="text"
              name="state"
              value={shippingAddress.state}
              onChange={handleChange}
              required
              placeholder="State"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="zipCode"
              value={shippingAddress.zipCode}
              onChange={handleChange}
              required
              placeholder="Zip Code"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
            <input
              type="text"
              name="country"
              value={shippingAddress.country}
              onChange={handleChange}
              required
              placeholder="Country"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>
        </div>

        {/* Payment Method Selection */}
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-cyan-400" />
          Payment Method
        </h3>

        {/* Payment Method Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              paymentMethod === 'card'
                ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                : 'bg-white/5 border border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            💳 Card
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('crypto')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              paymentMethod === 'crypto'
                ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400'
                : 'bg-white/5 border border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            ₿ɱ Crypto
          </button>
        </div>

        {/* Card Payment */}
        {paymentMethod === 'card' && (
          <>
            <div className="mb-4">
              <div className="p-4 bg-white/10 rounded-lg border border-white/20 focus-within:border-cyan-500 transition-colors">
                <CardElement options={cardElementOptions} />
              </div>
              {cardError && (
                <p className="text-red-400 text-sm mt-2">{cardError}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
              <Lock className="w-3 h-3" />
              <span>Payments are secured by Stripe</span>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-4 text-xs">
              <p className="text-cyan-400 font-bold mb-1">Test Mode</p>
              <p className="text-white/60">Use card: 4242 4242 4242 4242</p>
              <p className="text-white/60">Any future date, any CVC</p>
            </div>

            <button
              type="submit"
              disabled={loading || !stripe}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay ${getTotal().toFixed(2)}</>
              )}
            </button>
          </>
        )}

        {/* Crypto Payment */}
        {paymentMethod === 'crypto' && (
          <div className="space-y-4">
            {cryptoStatus === 'idle' && (() => {
              const address = selectedCrypto === 'btc' ? BTC_ADDRESS : XMR_ADDRESS;
              const qrPrefix = selectedCrypto === 'btc' ? 'bitcoin:' : 'monero:';
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrPrefix}${address}`;

              return (
                <>
                  {/* Crypto Type Selector */}
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCrypto('btc')}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        selectedCrypto === 'btc'
                          ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400'
                          : 'bg-white/5 border border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      <span>₿</span> BTC
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCrypto('xmr')}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        selectedCrypto === 'xmr'
                          ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400'
                          : 'bg-white/5 border border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      <span>ɱ</span> XMR
                    </button>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl} alt={`${selectedCrypto.toUpperCase()} Payment QR`} className="w-40 h-40" />
                  </div>

                  {/* Wallet Address */}
                  <div>
                    <p className="text-white/50 text-xs mb-2 font-mono">{selectedCrypto.toUpperCase()} ADDRESS</p>
                    <div className="flex items-stretch gap-2">
                      <code className="flex-1 text-[10px] sm:text-xs bg-black/40 p-3 rounded-lg break-all font-mono leading-relaxed"
                            style={{ color: selectedCrypto === 'btc' ? '#fcd34d' : '#fdba74' }}>
                        {address}
                      </code>
                      <button
                        type="button"
                        title={`Copy ${selectedCrypto.toUpperCase()} address`}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(address);
                            toast.success(`${selectedCrypto.toUpperCase()} address copied!`);
                          } catch {
                            toast.error('Failed to copy');
                          }
                        }}
                        className="px-3 border rounded-lg transition-colors flex items-center justify-center"
                        style={{
                          background: `rgba(${selectedCrypto === 'btc' ? '245,158,11' : '234,88,12'},0.2)`,
                          borderColor: `rgba(${selectedCrypto === 'btc' ? '245,158,11' : '234,88,12'},0.3)`,
                        }}
                      >
                        <Copy className="w-5 h-5" style={{ color: selectedCrypto === 'btc' ? '#fbbf24' : '#fb923c' }} />
                      </button>
                    </div>
                  </div>

                  <CryptoConverter coin={selectedCrypto} />

                  <button
                    type="button"
                    onClick={handleCryptoCreate}
                    disabled={loading}
                    className={`w-full py-3 ${
                      selectedCrypto === 'btc'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-amber-500/25'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-500/25'
                    } text-white font-bold rounded-full transition-all hover:shadow-lg disabled:opacity-50`}
                  >
                    {loading ? 'Creating Order...' : `Pay $${getTotal().toFixed(2)} with ${selectedCrypto.toUpperCase()}`}
                  </button>
                  <p className="text-white/40 text-xs text-center">
                    Digital products only • Payment verified before download
                  </p>
                </>
              );
            })()}

            {cryptoStatus === 'awaiting_tx' && (() => {
              const address = selectedCrypto === 'btc' ? BTC_ADDRESS : XMR_ADDRESS;
              const cryptoLabel = selectedCrypto === 'btc' ? 'Bitcoin' : 'Monero';
              const cryptoIcon = selectedCrypto === 'btc' ? '₿' : 'ɱ';
              const colorAccent = selectedCrypto === 'btc' ? 'amber' : 'orange';
              const qrPrefix = selectedCrypto === 'btc' ? 'bitcoin:' : 'monero:';
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrPrefix}${address}`;

              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className={`bg-${colorAccent}-500/10 border border-${colorAccent}-500/30 rounded-lg p-4 text-center`}
                       style={{ background: `rgba(${selectedCrypto === 'btc' ? '245,158,11' : '234,88,12'},0.1)`, borderColor: `rgba(${selectedCrypto === 'btc' ? '245,158,11' : '234,88,12'},0.3)` }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">{cryptoIcon}</span>
                      <h4 className="text-white font-bold">Send {cryptoLabel}</h4>
                    </div>
                    <p className="text-white/60 text-sm">
                      Send <span className={`text-${colorAccent}-400 font-bold`} style={{ color: selectedCrypto === 'btc' ? '#fbbf24' : '#fb923c' }}>${getTotal().toFixed(2)}</span> worth of {selectedCrypto.toUpperCase()} to the address below
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl} alt={`${selectedCrypto.toUpperCase()} Payment QR`} className="w-48 h-48" />
                  </div>

                  {/* Wallet Address */}
                  <div>
                    <p className="text-white/50 text-xs mb-2 font-mono">{selectedCrypto.toUpperCase()} ADDRESS</p>
                    <div className="flex items-stretch gap-2">
                      <code className={`flex-1 text-[10px] sm:text-xs bg-black/40 p-3 rounded-lg break-all font-mono leading-relaxed`}
                            style={{ color: selectedCrypto === 'btc' ? '#fcd34d' : '#fdba74' }}>
                        {address}
                      </code>
                      <button
                        type="button"
                        title={`Copy ${selectedCrypto.toUpperCase()} address`}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(address);
                            toast.success(`${selectedCrypto.toUpperCase()} address copied!`);
                          } catch {
                            toast.error('Failed to copy');
                          }
                        }}
                        className="px-3 border rounded-lg transition-colors flex items-center justify-center"
                        style={{
                          background: `rgba(${selectedCrypto === 'btc' ? '245,158,11' : '234,88,12'},0.2)`,
                          borderColor: `rgba(${selectedCrypto === 'btc' ? '245,158,11' : '234,88,12'},0.3)`,
                        }}
                      >
                        <Copy className="w-5 h-5" style={{ color: selectedCrypto === 'btc' ? '#fbbf24' : '#fb923c' }} />
                      </button>
                    </div>
                  </div>

                  {/* TX Hash Input */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2 font-mono">TRANSACTION HASH</label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="Paste your TX hash here after sending..."
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded text-white text-sm focus:outline-none focus:border-cyan-500 transition font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitTxHash}
                    disabled={loading || !txHash.trim()}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Submit TX Hash for Verification'
                    )}
                  </button>

                  <p className="text-white/40 text-xs text-center">
                    Your download will unlock after the transaction is verified on-chain
                  </p>
                </div>
              );
            })()}

            {cryptoStatus === 'confirming' && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto"></div>
                <h4 className="text-cyan-400 font-bold text-lg">Verifying Payment</h4>
                <p className="text-white/60 text-sm">
                  Waiting for blockchain confirmations...
                </p>
                <p className="text-white/40 text-xs">
                  TX: <span className="font-mono">{txHash.slice(0, 16)}...{txHash.slice(-8)}</span>
                </p>
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>BTC auto-verifies. XMR may require admin confirmation.</span>
                </div>
                <p className="text-white/30 text-xs">
                  Checking every 15 seconds. You can close this and check My Purchases later.
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

// Main Checkout component with Stripe Elements wrapper
export const Checkout = ({ isOpen, onClose }: CheckoutProps) => {
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    if (isOpen && !stripeInstance) {
      getStripe().then((stripe) => {
        setStripeInstance(stripe);
        setStripeReady(true);
      });
    }
  }, [isOpen, stripeInstance]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-dark-card rounded-t-2xl z-10">
            <h2 className="text-xl font-bold text-white">Checkout</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          {stripeReady && stripeInstance ? (
            <Elements stripe={stripeInstance}>
              <CheckoutForm onClose={onClose} />
            </Elements>
          ) : (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Loading payment form...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
