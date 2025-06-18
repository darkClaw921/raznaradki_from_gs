import { Router } from 'express';
import { getRoles, createRole, updateRole, getPermissions } from '../controllers/roleController';
import { requireRole } from '../middleware/auth';

const router = Router();

// Получение списка ролей
router.get('/', requireRole(['admin']), getRoles);

// Создание новой роли (только админ)
router.post('/', requireRole(['admin']), createRole);

// Обновление роли (только админ)
router.put('/:id', requireRole(['admin']), updateRole);

// Получение списка разрешений
router.get('/permissions', requireRole(['admin']), getPermissions);

export default router; 