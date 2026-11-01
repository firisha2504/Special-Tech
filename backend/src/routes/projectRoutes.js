import { Router } from 'express';
import {
  getAllProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  uploadProjectImage,
  getProjectStatusHistory,
} from '../controllers/projectController.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Role } from '@prisma/client';

const router = Router();

// Public Routes
router.get('/', getAllProjects);
router.get('/featured', getFeaturedProjects);
router.get('/:id/history', getProjectStatusHistory);
router.get('/:slug', getProjectBySlug);

// Protected Admin Routes
router.use(authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_projects'));
router.get('/admin/detail/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.patch('/:id/status', updateProjectStatus);
router.delete('/:id', deleteProject);
router.post('/upload', upload.single('image'), uploadProjectImage);

export default router;
