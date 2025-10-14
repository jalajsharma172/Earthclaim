// db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

// Supabase connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('SUPABASE_DB_URL environment variable is required');
}

// Create PostgreSQL connection pool for Supabase
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 10, // Adjust based on your Supabase plan
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Initialize Drizzle ORM with the connection pool
export const db = drizzle(pool);

// Export the pool for direct access if needed
export { pool };

// Database connection test function
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Supabase connected successfully');
    console.log('Database version:', result.rows[0].version);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}