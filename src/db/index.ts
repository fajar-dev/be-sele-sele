import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'be_sele_sele_db',
  port: Number(process.env.DB_PORT) || 3306,
});

export const db = drizzle(poolConnection, { mode: 'default', schema });
