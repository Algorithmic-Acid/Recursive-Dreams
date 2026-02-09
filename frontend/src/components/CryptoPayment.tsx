import { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

// Wallet Addresses
const XMR_ADDRESS = '84SyqhuxFyg7n4VEvuRq6P1CjUVXYgSca6s9oB6RAmnL4qwNRk3YVQJNKF5WZtcQDjBHFEfv6t6NBYqHzcYuVsNEBkqUiVE';
const BTC_ADDRESS = 'bc1qce33yheyq24l7x90zer5q866nx6tyx2j5atp2y';

type CryptoType = 'xmr' | 'btc';

interface CryptoPaymentProps {
  amount?: number;
  purpose?: 'donation' | 'payment';
  onPaymentSent?: () => void;
  defaultCrypto?: CryptoType;
}

const cryptoConfig = {
  xmr: {
    name: 'Monero',
    symbol: 'XMR',
    icon: 'ɱ',
    address: XMR_ADDRESS,
    color: 'orange',
    qrPrefix: 'monero:',
    tagline: 'PRIVATE • UNTRACEABLE • DECENTRALIZED',
  },
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    address: BTC_ADDRESS,
    color: 'amber',
    qrPrefix: 'bitcoin:',
    tagline: 'SECURE • GLOBAL • BORDERLESS',
  },
};

export const CryptoPayment = ({ amount, purpose = 'donation', onPaymentSent, defaultCrypto = 'xmr' }: CryptoPaymentProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>(defaultCrypto);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const config = cryptoConfig[selectedCrypto];
  const colorClass = selectedCrypto === 'xmr' ? 'orange' : 'amber';

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(config.address);
      setAddressCopied(true);
      toast.success(`${config.symbol} address copied!`);
      setTimeout(() => setAddressCopied(false), 3000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${config.qrPrefix}${config.address}`;

  return (
    <div className={`bg-gradient-to-br from-${colorClass}-900/30 to-${colorClass}-800/20 border border-${colorClass}-500/30 rounded-xl p-4 sm:p-6`}
         style={{ background: `linear-gradient(to bottom right, rgba(${selectedCrypto === 'xmr' ? '234,88,12' : '245,158,11'},0.15), rgba(${selectedCrypto === 'xmr' ? '194,65,12' : '217,119,6'},0.1))` }}>

      {/* Crypto Selector */}
      <div className="flex gap-2 mb-4">
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
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${selectedCrypto === 'xmr' ? 'bg-orange-500/20' : 'bg-amber-500/20'} rounded-full flex items-center justify-center`}>
            <span className="text-xl">{config.icon}</span>
          </div>
          <div>
            <h3 className="text-white font-bold">
              {purpose === 'donation' ? `Support with ${config.name}` : `Pay with ${config.name}`}
            </h3>
            <p className={`${selectedCrypto === 'xmr' ? 'text-orange-400/70' : 'text-amber-400/70'} text-xs font-mono`}>
              {config.symbol} - {config.name}
            </p>
          </div>
        </div>
        {amount !== undefined && amount > 0 && (
          <div className="text-right">
            <p className="text-white/50 text-xs">Amount (USD)</p>
            <p className={`${selectedCrypto === 'xmr' ? 'text-orange-400' : 'text-amber-400'} font-bold`}>
              ${amount.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* QR Toggle */}
      <button
        type="button"
        onClick={() => setShowQR(!showQR)}
        className={`w-full mb-4 flex items-center justify-center gap-2 py-2 ${
          selectedCrypto === 'xmr'
            ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400'
            : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
        } border rounded-lg transition-colors`}
      >
        <QrCode className="w-4 h-4" />
        <span className="text-sm">{showQR ? 'Hide' : 'Show'} QR Code</span>
      </button>

      {/* QR Code */}
      {showQR && (
        <div className="flex justify-center mb-4 p-4 bg-white rounded-lg animate-fade-in">
          <img src={qrCodeUrl} alt={`${config.symbol} Payment QR Code`} className="w-48 h-48" />
        </div>
      )}

      {/* Address */}
      <div className="mb-4">
        <p className="text-white/50 text-xs mb-2 font-mono">{config.symbol} ADDRESS</p>
        <div className="flex items-stretch gap-2">
          <code className={`flex-1 text-[10px] sm:text-xs ${selectedCrypto === 'xmr' ? 'text-orange-300' : 'text-amber-300'} bg-black/40 p-3 rounded-lg break-all font-mono leading-relaxed`}>
            {config.address}
          </code>
          <button
            type="button"
            onClick={copyAddress}
            className={`px-3 ${
              selectedCrypto === 'xmr'
                ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30'
            } border rounded-lg transition-colors flex items-center justify-center`}
          >
            {addressCopied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className={`w-5 h-5 ${selectedCrypto === 'xmr' ? 'text-orange-400' : 'text-amber-400'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-white/50 text-xs space-y-1 mb-4">
        <p>1. Copy the address or scan the QR code</p>
        <p>2. Send {config.symbol} from your wallet</p>
        <p>3. {purpose === 'donation' ? 'Thank you for your support!' : 'Click "I\'ve Sent Payment" below'}</p>
      </div>

      {/* Action Button */}
      {purpose === 'payment' && onPaymentSent && (
        <button
          type="button"
          onClick={onPaymentSent}
          className={`w-full py-3 ${
            selectedCrypto === 'xmr'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-500/25'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/25'
          } text-white font-bold rounded-full transition-all hover:shadow-lg`}
        >
          I've Sent the Payment
        </button>
      )}

      {/* Tagline */}
      <p className={`text-center ${selectedCrypto === 'xmr' ? 'text-orange-400/50' : 'text-amber-400/50'} text-[10px] mt-3 font-mono`}>
        [ {config.tagline} ]
      </p>
    </div>
  );
};

// Donation widget for footer - shows both crypto options
export const CryptoDonationWidget = () => {
  const [expanded, setExpanded] = useState(false);
  const [xmrCopied, setXmrCopied] = useState(false);
  const [btcCopied, setBtcCopied] = useState(false);

  const copyAddress = async (type: 'xmr' | 'btc') => {
    const address = type === 'xmr' ? XMR_ADDRESS : BTC_ADDRESS;
    try {
      await navigator.clipboard.writeText(address);
      if (type === 'xmr') {
        setXmrCopied(true);
        setTimeout(() => setXmrCopied(false), 3000);
      } else {
        setBtcCopied(true);
        setTimeout(() => setBtcCopied(false), 3000);
      }
      toast.success(`${type.toUpperCase()} address copied!`);
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
        <span className="text-base">₿ɱ</span>
        <span>DONATE CRYPTO</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {/* XMR */}
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-orange-400 text-[10px] font-mono">ɱ XMR (Monero)</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[9px] text-orange-300 bg-black/30 p-1.5 rounded overflow-hidden whitespace-nowrap text-ellipsis">
                {XMR_ADDRESS.slice(0, 20)}...
              </code>
              <button
                type="button"
                onClick={() => copyAddress('xmr')}
                className="p-1 bg-orange-500/20 hover:bg-orange-500/30 rounded transition-colors"
              >
                {xmrCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-orange-400" />}
              </button>
            </div>
          </div>

          {/* BTC */}
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-amber-400 text-[10px] font-mono">₿ BTC (Bitcoin)</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[9px] text-amber-300 bg-black/30 p-1.5 rounded overflow-hidden whitespace-nowrap text-ellipsis">
                {BTC_ADDRESS}
              </code>
              <button
                type="button"
                onClick={() => copyAddress('btc')}
                className="p-1 bg-amber-500/20 hover:bg-amber-500/30 rounded transition-colors"
              >
                {btcCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
