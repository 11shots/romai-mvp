import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy initialization pour éviter les erreurs au build-time
let _db: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    if (!_db) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is required');
      }
      const client = postgres(connectionString, { prepare: false });
      _db = drizzle(client, { schema });
    }
    return (_db as any)[prop];
  }
});

export * from './schema';