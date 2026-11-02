import { Pool } from "pg";
declare global { var __wmePool: Pool | undefined; }
if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL environment variable");
export const pool = global.__wmePool ?? new Pool({
 connectionString: process.env.DATABASE_URL, max: 10,
 idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000
});
if (process.env.NODE_ENV !== "production") global.__wmePool = pool;
