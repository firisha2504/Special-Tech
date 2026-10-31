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
  testAIProviderConnection,
  getAdminConversations,
  getAdminConversationById,
  getEmailStatus,
  testSMTPConnectionEndpoint,
  sendTestEmailEndpoint,
} from '../controllers/adminController.js';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  uploadProjectImage,
} from '../controllers/projectController.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  uploadProductImage,
  getAllDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest,
} from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Role } from '@prisma/client';

const router = Router();

// Public Team for About Page
router.get('/team', getTeamMembers);

// Protected Admin Endpoints
router.use(authenticateToken, requireRole([Role.ADMIN]));

// Core Dashboard
router.get('/stats', getDashboardStats);
router.get('/customers', getCustomers);
router.get('/settings', getSettings);
router.post('/settings', updateSetting);
router.get('/activity-logs', getActivityLogs);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// AI Engine Management & Discovery Auditing
router.post('/ai/test', testAIProviderConnection);
router.get('/conversations', getAdminConversations);
router.get('/conversations/:id', getAdminConversationById);

// Email & SMTP Notification Management
router.get('/email/status', getEmailStatus);
router.post('/email/test-connection', testSMTPConnectionEndpoint);
router.post('/email/send-test', sendTestEmailEndpoint);

// Generic Image Upload for Admin Forms
router.post('/upload', upload.single('image'), uploadProjectImage);

// Portfolio Projects Management Endpoints
router.get('/projects', (req, res, next) => {
  req.query.publishedOnly = 'false';
  return getAllProjects(req, res, next);
});
router.post('/projects', createProject);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id', updateProject);
router.patch('/projects/:id/status', updateProjectStatus);
router.delete('/projects/:id', deleteProject);

// Company Products Management Endpoints
router.get('/products', (req, res, next) => {
  req.query.publishedOnly = 'false';
  return getAllProducts(req, res, next);
});
router.post('/products', createProduct);
router.get('/products/:id', getProductById);
router.put('/products/:id', updateProduct);
router.patch('/products/:id/status', updateProductStatus);
router.delete('/products/:id', deleteProduct);

// Demo Requests Management Endpoints
router.get('/demo-requests', getAllDemoRequests);
router.patch('/demo-requests/:id/status', updateDemoRequestStatus);
router.delete('/demo-requests/:id', deleteDemoRequest);

export default router;
