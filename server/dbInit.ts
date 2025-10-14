// dbinit.tsx
import { db } from './db';
import { sql } from 'drizzle-orm';

export async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create UUID extension if it doesn't exist
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create loginpage table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS Login (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        useremail TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create userpath table (fixed primary key issue)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS UserPath (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        UserName TEXT UNIQUE REFERENCES Login(username),
        Path JSONB[] DEFAULT '{}'
      )
    `);

    // Create userpath table (fixed primary key issue)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS UserPolygon (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        UserName TEXT UNIQUE REFERENCES Login(username),
        Polygon JSONB[] DEFAULT '{}'
      )
    `);

 

    
    
    console.log('Database tables initialized successfully!');
    
 
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

