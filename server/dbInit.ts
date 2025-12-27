// dbinit.tsx
import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function initializeDatabase() {
  try {
    console.log('Using Drizzle for database management. Please run "npm run db:push" to update schema.');

    // Optional: Check connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection verified.');

  } catch (error) {
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

