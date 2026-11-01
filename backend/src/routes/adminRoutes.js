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
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
  testAIProviderConnection,
  getAdminConversations,
  getAdminConversationById,
  getEmailStatus,
  getEmailLogs,
  retryEmailNotification,
  saveEmailSettingsEndpoint,
  testSMTPConnectionEndpoint,
  sendTestEmailEndpoint,
  exportDatabaseSnapshot,
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
import {
  getAllPermissions,
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
  updateAdminPermissions,
  deleteAdminUser,
} from '../controllers/rbacController.js';
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminPhoto,
  removeAdminPhoto,
  changeAdminPassword,
} from '../controllers/profileController.js';
import { authenticateToken, requireRole, requirePermission, requireSuperAdmin } from '../middleware/auth.js';
import { upload, avatarUpload } from '../middleware/upload.js';
import { Role } from '@prisma/client';

const router = Router();

// Public Team for About Page
router.get('/team', getTeamMembers);

// Protected Admin Base Check: Requires authentication and administrative privileges
router.use(authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

// Avatar upload error-handling middleware wrapper
const handleAvatarUpload = (req, res, next) => {
  avatarUpload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading profile photo',
      });
    }
    next();
  });
};

// Administrator Self-Profile Management (Accessible by any authenticated Admin / Super Admin)
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.post('/profile/photo', handleAvatarUpload, uploadAdminPhoto);
router.delete('/profile/photo', removeAdminPhoto);
router.put('/profile/change-password', changeAdminPassword);

// RBAC & Permission Management Endpoints (Super Admin & Admin Delegation)
router.get('/permissions', requirePermission('manage_admins'), getAllPermissions);
router.get('/users', requirePermission('manage_admins'), getAdminUsers);
router.get('/users/:id', requirePermission('manage_admins'), getAdminUserById);
router.post('/users', requireSuperAdmin, createAdminUser);
router.put('/users/:id', requireSuperAdmin, updateAdminUser);
router.patch('/users/:id/status', requireSuperAdmin, updateAdminUserStatus);
router.put('/users/:id/permissions', requireSuperAdmin, updateAdminPermissions);
router.delete('/users/:id', requireSuperAdmin, deleteAdminUser);

// Core Dashboard & Analytics
router.get('/stats', requirePermission('view_analytics'), getDashboardStats);
router.get('/customers', requirePermission('manage_customers'), getCustomers);
router.get('/settings', requirePermission('manage_system_settings'), getSettings);
router.post('/settings', requirePermission('manage_system_settings'), updateSetting);
router.get('/activity-logs', requirePermission('view_audit_logs'), getActivityLogs);
// Notification Management Endpoints
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.post('/notifications/read-all', markAllNotificationsRead);
router.delete('/notifications/clear-read', clearReadNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/:id', deleteNotification);

// AI Engine Management & Discovery Auditing
router.post('/ai/test', requirePermission('manage_ai_settings'), testAIProviderConnection);
router.get('/conversations', requirePermission('manage_ai_settings'), getAdminConversations);
router.get('/conversations/:id', requirePermission('manage_ai_settings'), getAdminConversationById);

// Email & SMTP Notification Management
router.get('/email/status', requirePermission('manage_system_settings'), getEmailStatus);
router.post('/email/settings', requirePermission('manage_system_settings'), saveEmailSettingsEndpoint);
router.get('/email/logs', requirePermission('manage_system_settings'), getEmailLogs);
router.post('/email/retry-notification/:id', requirePermission('manage_system_settings'), retryEmailNotification);
router.post('/email/test-connection', requirePermission('manage_system_settings'), testSMTPConnectionEndpoint);
router.post('/email/send-test', requirePermission('manage_system_settings'), sendTestEmailEndpoint);

// Generic Image Upload for Admin Forms
router.post('/upload', upload.single('image'), uploadProjectImage);

// Portfolio Projects Management Endpoints
router.get('/projects', requirePermission('manage_projects'), (req, res, next) => {
  req.query.publishedOnly = 'false';
  return getAllProjects(req, res, next);
});
router.post('/projects', requirePermission('manage_projects'), createProject);
router.get('/projects/:id', requirePermission('manage_projects'), getProjectById);
router.put('/projects/:id', requirePermission('manage_projects'), updateProject);
router.patch('/projects/:id/status', requirePermission('manage_projects'), updateProjectStatus);
router.delete('/projects/:id', requirePermission('manage_projects'), deleteProject);

// Company Products & Services Management Endpoints
router.get('/products', requirePermission('manage_services'), (req, res, next) => {
  req.query.publishedOnly = 'false';
  return getAllProducts(req, res, next);
});
router.post('/products', requirePermission('manage_services'), createProduct);
router.get('/products/:id', requirePermission('manage_services'), getProductById);
router.put('/products/:id', requirePermission('manage_services'), updateProduct);
router.patch('/products/:id/status', requirePermission('manage_services'), updateProductStatus);
router.delete('/products/:id', requirePermission('manage_services'), deleteProduct);

// Demo Requests Management Endpoints
router.get('/demo-requests', requirePermission('manage_services'), getAllDemoRequests);
router.patch('/demo-requests/:id/status', requirePermission('manage_services'), updateDemoRequestStatus);
router.delete('/demo-requests/:id', requirePermission('manage_services'), deleteDemoRequest);

// Database Backup & State Snapshot Endpoint
router.get('/backups/export', requirePermission('manage_backups'), exportDatabaseSnapshot);

export default router;
