import mariadb from 'mariadb';
import { env } from './env.js';

export const pool = mariadb.createPool({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
});

export async function connectDatabase(): Promise<void> {
    const connection = await pool.getConnection();
    console.log('Database connected');
    connection.release();
}
