import chalk from 'chalk';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function startServer(): Promise<void> {
    await connectDatabase();

    app.listen(env.serverPort, () => {
        const baseUrl = `http://localhost:${env.serverPort}`;

        console.log(chalk.green.bold('Server running:'), chalk.cyan.underline(baseUrl));
        console.log(chalk.yellow.bold('Swagger:'), chalk.cyan.underline(`${baseUrl}/api-docs`));
    });
}

startServer().catch((error) => {
    console.error('Could not start server:', error);
    process.exit(1);
});