import { Router } from 'express';
import { ttnController } from '../../controllers/ttnController.js';

const router = Router();

router.post('/uplink', ttnController.handleUplink);

export default router;
