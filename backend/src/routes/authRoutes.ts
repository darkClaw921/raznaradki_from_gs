import { Router } from 'express';
import { register, login, me, inviteUser, activateUser } from '../controllers/authController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Публичные маршруты
router.post('/register', optionalAuth, register);
router.post('/login', login);
router.post('/activate', activateUser);

// Защищенные маршруты
router.get('/me', authenticateToken, me);
router.post('/invite', authenticateToken, inviteUser);

export default router; 