import { Router } from 'express';

import authRoutes from './authRoutes.js';
import ttnRoutes from './ttnRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sensors', ttnRoutes);

export default router;