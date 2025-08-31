import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy initialization pour éviter les erreurs au build-time
let _db: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    if (!_db) {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL, POSTGRES_URL, or SUPABASE_URL is required');
      }
      
      // Configuration SSL pour Supabase
      const isSupabase = connectionString.includes('supabase.com');
      const client = postgres(connectionString, { 
        prepare: false,
        ssl: isSupabase ? { rejectUnauthorized: false } : undefined
      });
      _db = drizzle(client, { schema });
    }
    return (_db as any)[prop];
  }
});

export * from './schema';