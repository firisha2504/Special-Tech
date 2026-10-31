import { Router } from 'express';
import {
  getAllProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getAllProjects);
router.get('/:slug', getProjectBySlug);

// Protected Admin Routes
router.post('/', authenticateToken, requireRole([Role.ADMIN]), createProject);
router.put('/:id', authenticateToken, requireRole([Role.ADMIN]), updateProject);
router.delete('/:id', authenticateToken, requireRole([Role.ADMIN]), deleteProject);

export default router;
