import { Router } from 'express';
import {
  startConversation,
  sendMessage,
  getConversation,
  generateSpecification,
  updateSpecification,
  getAIStatus,
} from '../controllers/aiController.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/status', getAIStatus);
router.post('/conversations', aiLimiter, startConversation);
router.post('/messages', aiLimiter, sendMessage);
router.get('/conversations/:id', getConversation);
router.post('/requirements/generate', aiLimiter, generateSpecification);
router.put('/requirements/:id', updateSpecification);

export default router;
