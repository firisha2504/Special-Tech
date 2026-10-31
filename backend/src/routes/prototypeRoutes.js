import { Router } from 'express';
import {
  getTemplates,
  createOrGetPrototype,
  modifyPrototype,
  getPrototypeById,
} from '../controllers/prototypeController.js';

const router = Router();

router.get('/templates', getTemplates);
router.post('/generate', createOrGetPrototype);
router.post('/modify', modifyPrototype);
router.get('/:id', getPrototypeById);

export default router;
