import { Pool, PoolClient, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

class PostgresDatabase {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    const config = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'algorithmic_acid',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      this.isConnected = false;
    });

    this.pool.on('connect', () => {
      console.log('New PostgreSQL client connected');
    });
  }

  async connect(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL connected successfully');
      console.log(`   Database: ${process.env.POSTGRES_DB || 'algorithmic_acid'}`);
      console.log(`   Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
      console.log(`   Port: ${process.env.POSTGRES_PORT || '5432'}`);

      this.isConnected = true;
      client.release();
    } catch (error) {
      console.error('❌ PostgreSQL connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('PostgreSQL disconnected');
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const result = await this.pool.query<T>(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async runMigration(migrationPath: string): Promise<void> {
    console.log(`Running migration: ${migrationPath}`);

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    try {
      await this.query(sql);
      console.log(`✅ Migration completed: ${migrationPath}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migrationPath}`, error);
      throw error;
    }
  }

  async initializeSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, '../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    try {
      await this.runMigration(schemaPath);
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const db = new PostgresDatabase();

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.disconnect();
  process.exit(0);
});

export default db;
