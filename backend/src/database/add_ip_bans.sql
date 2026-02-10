-- Persistent IP bans table
-- Survives server restarts; voidTrap loads these on startup
CREATE TABLE IF NOT EXISTS ip_bans (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(50) NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON ip_bans(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_bans_expires ON ip_bans(expires_at);

COMMENT ON TABLE ip_bans IS 'Persistent IP ban list loaded by voidTrap middleware on startup';
