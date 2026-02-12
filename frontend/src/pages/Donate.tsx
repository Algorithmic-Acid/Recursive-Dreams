import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, QrCode, Zap, Heart } from 'lucide-react';
import { Footer } from '../components/Footer';
import { StripeDonation } from '../components/StripeDonation';
import { CryptoConverter } from '../components/CryptoConverter';
import toast from 'react-hot-toast';

// Wallet Addresses
const XMR_ADDRESS = '84SyqhuxFyg7n4VEvuRq6P1CjUVXYgSca6s9oB6RAmnL4qwNRk3YVQJNKF5WZtcQDjBHFEfv6t6NBYqHzcYuVsNEBkqUiVE';
const BTC_ADDRESS = 'bc1qce33yheyq24l7x90zer5q866nx6tyx2j5atp2y';

export const Donate = () => {
  const [xmrCopied, setXmrCopied] = useState(false);
  const [btcCopied, setBtcCopied] = useState(false);
  const [showXmrQR, setShowXmrQR] = useState(false);
  const [showBtcQR, setShowBtcQR] = useState(false);

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

  const xmrQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=monero:${XMR_ADDRESS}`;
  const btcQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:${BTC_ADDRESS}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-md shadow-lg border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
                VOID VENDOR<sup className="text-xs align-super ml-0.5">™</sup>
              </h1>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-pink-500 animate-pulse shrink-0" />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
              Support <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Void Vendor</span>
            </h1>
          </div>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto">
            Your donations help us create more free VST plugins and keep the void alive.
            We accept card payments, Bitcoin, and Monero.
          </p>
        </div>

        {/* Donation Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">

          {/* Stripe Card Payment */}
          <StripeDonation />

          {/* Bitcoin Section */}
          <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-500/30 rounded-2xl p-6 md:p-8 hover:border-amber-500/50 transition-all">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">₿</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Bitcoin</h2>
                <p className="text-amber-400/70 text-sm font-mono">BTC</p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-amber-400/60 text-xs font-mono mb-6 tracking-wider">
              [ SECURE • GLOBAL • BORDERLESS ]
            </p>

            {/* QR Toggle */}
            <button
              type="button"
              onClick={() => setShowBtcQR(!showBtcQR)}
              className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span>{showBtcQR ? 'Hide' : 'Show'} QR Code</span>
            </button>

            {/* QR Code */}
            {showBtcQR && (
              <div className="flex justify-center mb-6 p-4 bg-white rounded-xl animate-fade-in">
                <img src={btcQrUrl} alt="Bitcoin QR Code" className="w-48 h-48" />
              </div>
            )}

            {/* Address */}
            <div className="mb-6">
              <p className="text-white/50 text-xs mb-2 font-mono">BTC ADDRESS</p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 text-[10px] sm:text-xs text-amber-300 bg-black/40 p-4 rounded-xl break-all font-mono leading-relaxed">
                  {BTC_ADDRESS}
                </code>
                <button
                  type="button"
                  onClick={() => copyAddress('btc')}
                  className="px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl transition-colors flex items-center justify-center"
                >
                  {btcCopied ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <Copy className="w-6 h-6 text-amber-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => copyAddress('btc')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/25"
            >
              Copy BTC Address
            </button>

            <CryptoConverter coin="btc" />
          </div>

          {/* Monero Section */}
          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-500/30 rounded-2xl p-6 md:p-8 hover:border-orange-500/50 transition-all">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">ɱ</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Monero</h2>
                <p className="text-orange-400/70 text-sm font-mono">XMR</p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-orange-400/60 text-xs font-mono mb-6 tracking-wider">
              [ PRIVATE • UNTRACEABLE • DECENTRALIZED ]
            </p>

            {/* QR Toggle */}
            <button
              type="button"
              onClick={() => setShowXmrQR(!showXmrQR)}
              className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span>{showXmrQR ? 'Hide' : 'Show'} QR Code</span>
            </button>

            {/* QR Code */}
            {showXmrQR && (
              <div className="flex justify-center mb-6 p-4 bg-white rounded-xl animate-fade-in">
                <img src={xmrQrUrl} alt="Monero QR Code" className="w-48 h-48" />
              </div>
            )}

            {/* Address */}
            <div className="mb-6">
              <p className="text-white/50 text-xs mb-2 font-mono">XMR ADDRESS</p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 text-[10px] sm:text-xs text-orange-300 bg-black/40 p-4 rounded-xl break-all font-mono leading-relaxed">
                  {XMR_ADDRESS}
                </code>
                <button
                  type="button"
                  onClick={() => copyAddress('xmr')}
                  className="px-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl transition-colors flex items-center justify-center"
                >
                  {xmrCopied ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <Copy className="w-6 h-6 text-orange-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => copyAddress('xmr')}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              Copy XMR Address
            </button>

            <CryptoConverter coin="xmr" />
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-12 md:mt-16">
          <div className="block w-full max-w-2xl mx-auto p-6 md:p-8 bg-dark-card border border-cyan-500/20 rounded-2xl">
            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Thank You for Your Support!</h3>
            <p className="text-white/60">
              Every donation helps us continue developing free audio tools and maintaining our services.
              We truly appreciate your generosity.
            </p>
            <div className="mt-6 pt-6 border-t border-cyan-500/10">
              <p className="text-cyan-400/70 text-[10px] sm:text-sm font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                [ ALL_DONATIONS_GO_DIRECTLY_TO_DEVELOPMENT ]
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donate;
