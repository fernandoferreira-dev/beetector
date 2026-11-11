import mariadb from 'mariadb';
import chalk from 'chalk';

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

async function connectDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log(chalk.green.bold("Database connected successfully!"));
        await connection.release();
    } catch (error) {
        console.log(chalk.red("Database connection failed with error: " + chalk.bold(error.message)));
        process.exit(1);
    }
}

export const getConnection = () => pool.getConnection();
export const query = (sql, params) => pool.query(sql, params);

export default connectDatabase;