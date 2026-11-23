import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);

export default app;
