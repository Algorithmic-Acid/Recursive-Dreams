import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Loader2, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

// Stripe promise (load once)
let stripePromise: Promise<any> | null = null;
const getStripe = async () => {
  if (!stripePromise) {
    try {
      const res = await fetch(`${API_URL}/api/payments/config`);
      const data = await res.json();
      if (data.success && data.data.publishableKey) {
        stripePromise = loadStripe(data.data.publishableKey);
      }
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
    }
  }
  return stripePromise;
};

interface DonationFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const DonationForm = ({ amount, onSuccess, onCancel }: DonationFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm donation on backend
        await fetch(`${API_URL}/api/payments/donate/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        toast.success('Thank you for your donation!');
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="text-center py-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
        <p className="text-white/60 text-xs font-mono mb-1">DONATION AMOUNT</p>
        <p className="text-3xl font-bold text-cyan-400">${amount.toFixed(2)}</p>
      </div>

      {/* Payment Element */}
      <div className="bg-white/95 p-4 rounded-xl">
        <PaymentElement />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-3 bg-dark-card border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 font-mono"
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>PROCESSING...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>DONATE ${amount.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const StripeDonation = () => {
  const [amount, setAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const presetAmounts = ['5', '10', '25', '50', '100'];

  const handleAmountSelect = (value: string) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount('');
  };

  const getFinalAmount = (): number => {
    const amt = customAmount || amount;
    return parseFloat(amt) || 0;
  };

  const handleCreatePayment = async () => {
    const finalAmount = getFinalAmount();

    if (finalAmount < 1) {
      toast.error('Please enter an amount of at least $1');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/payments/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: donorName || 'Anonymous',
          donorEmail: donorEmail || '',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setClientSecret(data.data.clientSecret);
      } else {
        toast.error(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Create payment error:', error);
      toast.error('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setClientSecret(null);
    setAmount('');
    setCustomAmount('');
    setDonorName('');
    setDonorEmail('');

    // Reset success message after 5 seconds
    setTimeout(() => setPaymentSuccess(false), 5000);
  };

  const handleCancel = () => {
    setClientSecret(null);
  };

  // Success State
  if (paymentSuccess) {
    return (
      <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 rounded-2xl p-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Thank You!</h3>
        <p className="text-green-400/80 mb-4">
          Your donation has been received successfully.
        </p>
        <p className="text-white/60 text-sm">
          Your support helps us create more free VST plugins and keep the void alive.
        </p>
      </div>
    );
  }

  // Payment Form (Stripe Elements)
  if (clientSecret) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-purple-800/20 border border-cyan-500/30 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Card Payment</h2>
            <p className="text-cyan-400/70 text-sm font-mono">Complete your donation</p>
          </div>
        </div>

        <Elements
          stripe={getStripe()}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#06b6d4',
                colorBackground: '#1a1625',
                colorText: '#ffffff',
                colorDanger: '#ef4444',
                borderRadius: '12px',
              },
            },
          }}
        >
          <DonationForm
            amount={getFinalAmount()}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
        </Elements>
      </div>
    );
  }

  // Amount Selection Form
  return (
    <div className="bg-gradient-to-br from-cyan-900/30 to-purple-800/20 border border-cyan-500/30 rounded-2xl p-6 md:p-8 hover:border-cyan-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Card Payment</h2>
          <p className="text-cyan-400/70 text-sm font-mono">Visa, Mastercard, Amex</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-cyan-400/60 text-xs font-mono mb-6 tracking-wider">
        [ INSTANT • SECURE • CONVENIENT ]
      </p>

      {/* Preset Amounts */}
      <div className="mb-6">
        <p className="text-white/50 text-xs mb-3 font-mono">SELECT AMOUNT</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {presetAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleAmountSelect(amt)}
              className={`py-3 px-4 rounded-xl font-bold transition-all ${
                amount === amt
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="mb-6">
        <p className="text-white/50 text-xs mb-2 font-mono">CUSTOM AMOUNT</p>
        <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-3">
          <span className="text-cyan-400 text-xl font-bold">$</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Optional Donor Info */}
      <div className="mb-6 space-y-3">
        <p className="text-white/50 text-xs font-mono">OPTIONAL INFO</p>
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 placeholder:text-white/30"
        />
        <input
          type="email"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          placeholder="Your email (optional)"
          className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 placeholder:text-white/30"
        />
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex gap-3">
        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-cyan-400/80 text-sm">
          Your payment is processed securely by Stripe. We never see your card details.
        </p>
      </div>

      {/* Continue Button */}
      <button
        type="button"
        onClick={handleCreatePayment}
        disabled={getFinalAmount() < 1 || loading}
        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>PROCESSING...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>CONTINUE TO PAYMENT</span>
          </>
        )}
      </button>
    </div>
  );
};
