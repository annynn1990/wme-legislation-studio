import "dotenv/config";
import { readFile } from "node:fs/promises";
import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("資料庫結構已更新。");
} finally {
  await pool.end();
}
