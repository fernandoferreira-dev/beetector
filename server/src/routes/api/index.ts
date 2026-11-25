import { Router } from 'express';

import authRoutes from './authRoutes.js';
import ttnRoutes from './ttnRoutes.js';
import readingRoutes from './readingRoutes.js';
import hiveRoutes from './hiveRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sensors', ttnRoutes);
router.use('/readings', readingRoutes);
router.use('/hives', hiveRoutes);

export default router;