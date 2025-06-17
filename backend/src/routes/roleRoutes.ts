import { Router } from 'express';
import { getRoles, createRole, updateRole, getPermissions } from '../controllers/roleController';
import { requireRole } from '../middleware/auth';

const router = Router();

// Получение списка ролей
router.get('/', requireRole(['Администратор', 'Редактор']), getRoles);

// Создание новой роли (только админ)
router.post('/', requireRole(['Администратор']), createRole);

// Обновление роли (только админ)
router.put('/:id', requireRole(['Администратор']), updateRole);

// Получение списка разрешений
router.get('/permissions', requireRole(['Администратор']), getPermissions);

export default router; 