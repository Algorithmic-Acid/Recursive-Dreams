-- Add traffic_logs table for network monitoring
CREATE TABLE IF NOT EXISTS traffic_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_path ON traffic_logs(path);
CREATE INDEX IF NOT EXISTS idx_traffic_status ON traffic_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_traffic_user ON traffic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_method ON traffic_logs(method);
