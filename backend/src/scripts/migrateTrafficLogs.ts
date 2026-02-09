import { db } from '../config/postgres';

async function migrateTrafficLogs() {
  console.log('🚀 Starting traffic_logs table migration...');

  try {
    await db.connect();

    // Create traffic_logs table
    console.log('Creating traffic_logs table...');
    await db.query(`
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
      )
    `);
    console.log('✅ traffic_logs table created');

    // Create indexes
    console.log('Creating indexes...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_logs(timestamp DESC)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_traffic_path ON traffic_logs(path)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_traffic_status ON traffic_logs(status_code)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_traffic_user ON traffic_logs(user_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_traffic_method ON traffic_logs(method)
    `);
    console.log('✅ All indexes created');

    // Verify table exists
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'traffic_logs'
      )
    `);

    if (result.rows[0].exists) {
      console.log('✅ Migration completed successfully!');
      console.log('   traffic_logs table is ready to use');
    } else {
      console.error('❌ Migration verification failed');
    }

    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.disconnect();
    process.exit(1);
  }
}

migrateTrafficLogs();
