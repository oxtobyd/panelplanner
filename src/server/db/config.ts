import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Get host from environment or use Docker-specific host
const dbHost = process.env.DB_HOST || 'host.docker.internal';

export const pool = new Pool({
  user: process.env.DB_USER,
  host: dbHost,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}