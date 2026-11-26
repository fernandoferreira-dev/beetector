import { Router } from 'express';
import {
    createHive,
    deleteHive,
    getAllHives,
    getHiveData,
    updateHive,
} from '../../controllers/HiveController.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAllHives);
router.get('/:hiveId', getHiveData);
router.post('/', createHive);
router.put('/:hiveId', updateHive);
router.delete('/:hiveId', deleteHive);

export default router;
