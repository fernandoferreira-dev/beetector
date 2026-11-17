import { Router } from 'express';
import { listReadingHiveIds, listReadings, uplink } from '../../controllers/ttnController.js';

const router = Router();

router.get('/readings/hives', listReadingHiveIds);
router.get('/readings', listReadings);
router.post('/uplink', uplink);

export default router;