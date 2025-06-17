import { Router } from 'express';
import { getUsers, getUser, updateUser, deactivateUser } from '../controllers/userController';
import { requireRole } from '../middleware/auth';

const router = Router();

// Получение списка пользователей (только админ и редактор)
router.get('/', requireRole(['Администратор', 'Редактор']), getUsers);

// Получение пользователя по ID
router.get('/:id', getUser);

// Обновление пользователя
router.put('/:id', updateUser);

// Деактивация пользователя (только админ)
router.patch('/:id/deactivate', requireRole(['Администратор']), deactivateUser);

export default router; 