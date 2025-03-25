import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from "@shared/schema";

export async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create a PostgreSQL pool and Drizzle instance
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  // This will run all migrations in the "migrations" directory
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  
  console.log('Migrations completed successfully');
  await pool.end();
}

// Run migrations when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Error during migration:', err);
    process.exit(1);
  });
}