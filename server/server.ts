import express from 'express';
import { connectDatabase } from './config/database.config.js';

const app: Express = express();

app.use(express.json());

const PORT = process.env.SERVER_PORT || undefined


connectDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

