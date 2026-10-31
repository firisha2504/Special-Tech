import { Router } from 'express';
import { getAllServices, getServiceBySlug } from '../controllers/serviceController.js';

const router = Router();

router.get('/', getAllServices);
router.get('/:slug', getServiceBySlug);

export default router;
