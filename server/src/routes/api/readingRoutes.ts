import { Router } from 'express';
import { getAllReadings, getReading } from '../../controllers/readingController.js';

const router = Router();

router.get('/', getAllReadings);
router.get('/:id', getReading);


export default router;
