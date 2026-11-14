import mariadb from 'mariadb';
import { env } from './env.js';

export const pool = mariadb.createPool({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
});

export default async function connectDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Database connected successfully!");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("Database connection failed with error: " + errorMessage);
        process.exit(1);
    } finally {
        if (connection) await connection.release();
    }
}

export const getConnection = () => pool.getConnection();

export const query = (sql: string, params: unknown[] = []) => {
    return pool.query(sql, params);
};
