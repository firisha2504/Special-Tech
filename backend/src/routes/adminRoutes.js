import { Router } from 'express';
import {
  getDashboardStats,
  getCustomers,
  getTeamMembers,
  getSettings,
  updateSetting,
  getActivityLogs,
  getNotifications,
  markNotificationRead,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Public Team for About Page
router.get('/team', getTeamMembers);

// Protected Admin Endpoints
router.use(authenticateToken);
router.get('/stats', getDashboardStats);
router.get('/customers', getCustomers);
router.get('/settings', getSettings);
router.post('/settings', requireRole([Role.ADMIN]), updateSetting);
router.get('/activity-logs', getActivityLogs);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
