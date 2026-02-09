import { useState } from 'react';
import { Copy, Check, QrCode, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface XMRPaymentProps {
  amount?: number;
  purpose?: 'donation' | 'payment';
  onPaymentSent?: () => void;
  compact?: boolean;
}

// Void Vendor XMR Wallet Address
const XMR_ADDRESS = '84SyqhuxFyg7n4VEvuRq6P1CjUVXYgSca6s9oB6RAmnL4qwNRk3YVQJNKF5WZtcQDjBHFEfv6t6NBYqHzcYuVsNEBkqUiVE';
const XMR_VIEW_KEY = 'f3f754359d62d91a6d8b087a323a63b01a75FE52234479576449f8037e96a203'; // NOTE: This is a placeholder


export const XMRPayment = ({ amount, purpose = 'donation', onPaymentSent, compact = false }: XMRPaymentProps) => {
  const [addressCopied, setAddressCopied] = useState(false);
  const [viewKeyCopied, setViewKeyCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showViewKey, setShowViewKey] = useState(false);

  const copyToClipboard = async (text: string, type: 'address' | 'viewKey') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setAddressCopied(true);
        toast.success('XMR address copied!');
        setTimeout(() => setAddressCopied(false), 3000);
      } else {
        setViewKeyCopied(true);
        toast.success('View key copied!');
        setTimeout(() => setViewKeyCopied(false), 3000);
      }
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Generate QR code URL using a public QR service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=monero:${XMR_ADDRESS}${amount ? `?tx_amount=${amount}` : ''}`;

  if (compact) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-400 font-bold text-sm">XMR</span>
          <span className="text-white/60 text-xs">Monero</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[10px] text-orange-300 bg-black/30 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
            {XMR_ADDRESS.slice(0, 20)}...{XMR_ADDRESS.slice(-8)}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(XMR_ADDRESS, 'address')}
            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded transition-colors"
          >
            {addressCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-500/30 rounded-xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
            <span className="text-xl">ɱ</span>
          </div>
          <div>
            <h3 className="text-white font-bold">
              {purpose === 'donation' ? 'Support with Monero' : 'Pay with Monero'}
            </h3>
            <p className="text-orange-400/70 text-xs font-mono">XMR - Private & Decentralized</p>
          </div>
        </div>
        {amount && (
          <div className="text-right">
            <p className="text-white/50 text-xs">Amount (USD)</p>
            <p className="text-orange-400 font-bold">${amount.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors"
        >
          <QrCode className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 text-sm">{showQR ? 'Hide' : 'Show'} QR</span>
        </button>
        <button
          type="button"
          onClick={() => setShowViewKey(!showViewKey)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors"
        >
          {showViewKey ? <EyeOff className="w-4 h-4 text-orange-400" /> : <Eye className="w-4 h-4 text-orange-400" />}
          <span className="text-orange-400 text-sm">{showViewKey ? 'Hide' : 'Show'} View Key</span>
        </button>
      </div>


      {/* QR Code */}
      {showQR && (
        <div className="flex justify-center mb-4 p-4 bg-white rounded-lg animate-fade-in">
          <img src={qrCodeUrl} alt="XMR Payment QR Code" className="w-48 h-48" />
        </div>
      )}

      {/* Address */}
      <div className="mb-4">
        <p className="text-white/50 text-xs mb-2 font-mono">WALLET ADDRESS</p>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 text-[10px] sm:text-xs text-orange-300 bg-black/40 p-3 rounded-lg break-all font-mono leading-relaxed">
            {XMR_ADDRESS}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(XMR_ADDRESS, 'address')}
            className="px-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition-colors flex items-center justify-center"
          >
            {addressCopied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-orange-400" />
            )}
          </button>
        </div>
      </div>
      
      {/* View Key */}
      {showViewKey && (
         <div className="mb-4 animate-fade-in">
            <p className="text-white/50 text-xs mb-2 font-mono">VIEW KEY (PRIVATE)</p>
            <div className="flex items-stretch gap-2">
              <code className="flex-1 text-[10px] sm:text-xs text-orange-300 bg-black/40 p-3 rounded-lg break-all font-mono leading-relaxed">
                {XMR_VIEW_KEY}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(XMR_VIEW_KEY, 'viewKey')}
                className="px-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition-colors flex items-center justify-center"
              >
                {viewKeyCopied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-orange-400" />
                )}
              </button>
            </div>
            <p className="text-orange-400/50 text-[10px] mt-2">Use this key with a block explorer to view incoming transactions to this wallet.</p>
         </div>
      )}

      {/* Instructions */}
      <div className="text-white/50 text-xs space-y-1 mb-4">
        <p>1. Copy the address or scan the QR code</p>
        <p>2. Send XMR from your wallet</p>
        <p>3. {purpose === 'donation' ? 'Thank you for your support!' : 'Click "I\'ve Sent Payment" below'}</p>
      </div>

      {/* Action Button (for payments) */}
      {purpose === 'payment' && onPaymentSent && (
        <button
          type="button"
          onClick={onPaymentSent}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-full transition-all hover:shadow-lg hover:shadow-orange-500/25"
        >
          I've Sent the Payment
        </button>
      )}

      {/* Privacy Note */}
      <p className="text-center text-orange-400/50 text-[10px] mt-3 font-mono">
        [ PRIVATE • UNTRACEABLE • DECENTRALIZED ]
      </p>
    </div>
  );
};

// Simple donation widget for footer
export const XMRDonationWidget = () => {
  const [expanded, setExpanded] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(XMR_ADDRESS);
      setAddressCopied(true);
      toast.success('XMR address copied!');
      setTimeout(() => setAddressCopied(false), 3000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-xs font-mono"
      >
        <span className="text-base">ɱ</span>
        <span>DONATE XMR</span>
      </button>

      {expanded && (
        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg animate-fade-in">
          <p className="text-white/50 text-[10px] mb-2">Monero Address:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[9px] text-orange-300 bg-black/30 p-2 rounded overflow-hidden">
              {XMR_ADDRESS.slice(0, 24)}...
            </code>
            <button
              type="button"
              onClick={copyAddress}
              className="p-1.5 bg-orange-500/20 hover:bg-orange-500/30 rounded transition-colors"
            >
              {addressCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-orange-400" />}
            </button>
          </div>
          <p className="text-white/50 text-[10px] mt-2 mb-1">View Key:</p>
           <div className="flex items-center gap-2">
            <code className="flex-1 text-[9px] text-orange-300 bg-black/30 p-2 rounded overflow-hidden">
              {XMR_VIEW_KEY.slice(0, 24)}...
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
