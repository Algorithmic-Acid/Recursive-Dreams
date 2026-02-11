import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CryptoConverterProps {
  coin: 'btc' | 'xmr';
}

const COIN_IDS = { btc: 'bitcoin', xmr: 'monero' };
const COIN_ICONS = { btc: '₿', xmr: 'ɱ' };

export const CryptoConverter = ({ coin }: CryptoConverterProps) => {
  const [price, setPrice] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const isBtc = coin === 'btc';

  const fetchPrice = async (currentUsd?: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS[coin]}&vs_currencies=usd`
      );
      const data = await res.json();
      const fetched: number | null = data[COIN_IDS[coin]]?.usd ?? null;
      setPrice(fetched);
      const usd = currentUsd ?? usdAmount;
      if (fetched && usd) {
        setCryptoAmount((parseFloat(usd) / fetched).toFixed(8));
      }
    } catch {
      // keep showing whatever state we had
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUsdAmount('');
    setCryptoAmount('');
    setPrice(null);
    fetchPrice('');
    const interval = setInterval(() => fetchPrice(usdAmount), 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin]);

  const handleUsdChange = (val: string) => {
    setUsdAmount(val);
    if (price && val !== '') {
      setCryptoAmount((parseFloat(val) / price).toFixed(8));
    } else {
      setCryptoAmount('');
    }
  };

  const handleCryptoChange = (val: string) => {
    setCryptoAmount(val);
    if (price && val !== '') {
      setUsdAmount((parseFloat(val) * price).toFixed(2));
    } else {
      setUsdAmount('');
    }
  };

  const priceColor  = isBtc ? 'text-amber-300'      : 'text-orange-300';
  const labelColor  = isBtc ? 'text-amber-300/75'   : 'text-orange-300/75';
  const iconColor   = isBtc ? 'text-amber-300/60'   : 'text-orange-300/60';
  const inputColor  = isBtc ? 'text-amber-300'      : 'text-orange-300';

  return (
    <div className="mt-4 rounded-xl p-4 bg-black/40 border border-white/10">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/60 text-xs font-mono tracking-wider">
          {coin.toUpperCase()} / USD CONVERTER
        </p>
        <button
          type="button"
          onClick={() => fetchPrice(usdAmount)}
          disabled={loading}
          title="Refresh price"
          className="text-white/40 hover:text-white/70 transition-colors disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Live price */}
      {price !== null ? (
        <p className={`text-xs font-mono mb-4 ${priceColor}`}>
          1 {coin.toUpperCase()} = ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </p>
      ) : (
        <p className="text-xs font-mono mb-4 text-white/50">
          {loading ? 'Fetching price...' : 'Price unavailable'}
        </p>
      )}

      {/* Inputs — stacked on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
        {/* USD */}
        <div className="flex-1">
          <p className="text-white/50 text-xs mb-1 font-mono">USD ($)</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={usdAmount}
              onChange={(e) => handleUsdChange(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-white/40 placeholder-white/30"
            />
          </div>
        </div>

        {/* Arrow */}
        <span className="text-white/40 text-sm text-center sm:pb-2 leading-none select-none">⇌</span>

        {/* Crypto */}
        <div className="flex-1">
          <p className={`text-xs mb-1 font-mono ${labelColor}`}>
            {coin.toUpperCase()} ({COIN_ICONS[coin]})
          </p>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none ${iconColor}`}>
              {COIN_ICONS[coin]}
            </span>
            <input
              type="number"
              min="0"
              placeholder="0.00000000"
              value={cryptoAmount}
              onChange={(e) => handleCryptoChange(e.target.value)}
              className={`w-full bg-black/40 border border-white/20 rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-white/40 placeholder-white/30 ${inputColor}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
