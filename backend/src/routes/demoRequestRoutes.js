import { Router } from 'express';
import {
  createDemoRequest,
  getAllDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest,
} from '../controllers/productController.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Public: Submit Demo Request
router.post('/', createDemoRequest);

// Protected Admin: Manage Demo Requests
router.use(authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_services'));
router.get('/', getAllDemoRequests);
router.patch('/:id/status', updateDemoRequestStatus);
router.delete('/:id', deleteDemoRequest);

export default router;
