import express from 'express';

const app = express();

app.use(express.json());


import helmet from "helmet";
app.use(helmet());

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import routes from './routes/index.js';
app.use(routes);

export default app;
