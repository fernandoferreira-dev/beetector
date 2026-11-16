import { Router } from 'express';

import authRoutes from './authRoutes.js';
import ttnRoutes from './ttnRoutes.js';
import readingRoutes from './readingRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sensors', ttnRoutes);
router.use('/readings', readingRoutes);

export default router;