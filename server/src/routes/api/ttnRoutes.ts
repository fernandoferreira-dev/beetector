import { Router } from 'express';
import { uplink } from '../../controllers/ttnController.js';

const router = Router();

router.post('/uplink', uplink);

export default router;
