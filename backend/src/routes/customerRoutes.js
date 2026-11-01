import { Router } from 'express';
import {
  customerLogin,
  getCustomerProfile,
  getCustomerProjects,
  getCustomerProjectById,
  getCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
  deleteCustomerNotification,
} from '../controllers/customerController.js';
import { authenticateCustomer } from '../middleware/customerAuth.js';

const router = Router();

// Public Customer Authentication
router.post('/auth/login', customerLogin);

// Protected Customer Portal Routes
router.use(authenticateCustomer);

// Profile
router.get('/auth/me', getCustomerProfile);

// Customer Projects
router.get('/projects', getCustomerProjects);
router.get('/projects/:id', getCustomerProjectById);

// Customer In-App Notifications
router.get('/notifications', getCustomerNotifications);
router.patch('/notifications/read-all', markAllCustomerNotificationsRead);
router.patch('/notifications/:id/read', markCustomerNotificationRead);
router.delete('/notifications/:id', deleteCustomerNotification);

export default router;
