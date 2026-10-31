import { Router } from 'express';
import {
  startConversation,
  sendMessage,
  getConversation,
  generateSpecification,
  updateSpecification,
} from '../controllers/aiController.js';

const router = Router();

router.post('/conversations', startConversation);
router.post('/messages', sendMessage);
router.get('/conversations/:id', getConversation);
router.post('/requirements/generate', generateSpecification);
router.put('/requirements/:id', updateSpecification);

export default router;
