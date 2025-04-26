import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema-mysql";

// Create a MySQL connection pool
const connectionPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pipenest',
  // Optional settings
  connectionLimit: 10,
  queueLimit: 0
});

// Create a Drizzle client
export const db = drizzle(connectionPool, { 
  schema,
  mode: 'default' // Specify the mode as required by Drizzle
});
export { connectionPool as pool };