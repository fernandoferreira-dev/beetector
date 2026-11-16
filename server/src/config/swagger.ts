import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import { env } from './env.js';

const options: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
        },
        servers: [
            {
                url: env.clientUrl,
                description: 'Desenvolvimento',
            },
        ],
    },
    // Continua a ser relativo à raiz do projeto (onde está o package.json)
    apis: [
        './src/routes/*.ts',
        './src/routes/**/*.ts', // Caso tenhas subpastas dentro de routes
        './dist/routes/*.js',
        './dist/routes/**/*.js',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);