import chalk from 'chalk';
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.serverPort, () => {
    const baseUrl = `http://localhost:${env.serverPort}`;

    console.log(
        chalk.green.bold('✔ Server running on') + ' ' + chalk.cyan.underline(baseUrl)
    );
    console.log(
        chalk.yellow.bold('i Swagger docs available on') + ' ' + chalk.cyan.underline(`${baseUrl}/api-docs`)
    );
});