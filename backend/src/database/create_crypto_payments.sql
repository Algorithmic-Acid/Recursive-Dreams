-- Crypto Payments tracking table
CREATE TABLE IF NOT EXISTS crypto_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  crypto_type VARCHAR(10) NOT NULL CHECK (crypto_type IN ('xmr', 'btc')),
  amount_usd DECIMAL(10, 2) NOT NULL,
  wallet_address TEXT NOT NULL,
  tx_hash VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'expired', 'failed')),
  confirmations INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crypto_payments_order ON crypto_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user ON crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_tx_hash ON crypto_payments(tx_hash);
