import express from 'express';
import helmet from "helmet";
import cors from 'cors';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

import routes from './routes/index.js';
app.use(routes);

export default app;
