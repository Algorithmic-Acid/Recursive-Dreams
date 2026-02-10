-- Create separate table for admin traffic logs
-- This keeps admin activity separate from regular user/guest monitoring
CREATE TABLE IF NOT EXISTS admin_traffic_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_traffic_timestamp ON admin_traffic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_traffic_user_id ON admin_traffic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_traffic_path ON admin_traffic_logs(path);

-- Add comment
COMMENT ON TABLE admin_traffic_logs IS 'Separate traffic logs for admin users to avoid cluttering regular security monitoring';
