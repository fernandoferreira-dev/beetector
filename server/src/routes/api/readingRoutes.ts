import { Router } from 'express';
import { getAllReadings, getReading } from '../../controllers/readingsController.js';

const router = Router();

router.get('/allReadings', getAllReadings);

router
    .route("reading/:id")
    .get(getReading)


export default router;
