import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, changePassword, adminResetUserPassword } from '../controllers/authController';
import { authenticateUser, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Public auth endpoints
router.post('/register', register as any);
router.post('/login', login as any);
router.post('/forgot-password', forgotPassword as any);
router.post('/reset-password', resetPassword as any);

// Protected endpoints
router.get('/me', authenticateUser as any, getMe as any);
router.post('/change-password', authenticateUser as any, changePassword as any);
router.post('/admin/reset-user-password', authenticateUser as any, authorizeAdmin as any, adminResetUserPassword as any);

export default router;
