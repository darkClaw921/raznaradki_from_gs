import { Router } from 'express';
import { 
  getUsers, 
  getUser, 
  updateUser, 
  deactivateUser,
  createUser,
  inviteUser,
  bulkUpdateUsers,
  setUserSheetAccess,
  removeUserSheetAccess,
  getUserAccess
} from '../controllers/userController';
import { requireRole } from '../middleware/auth';

const router = Router();

// Получение списка пользователей (только админ и редактор)
router.get('/', requireRole(['admin', 'editor']), getUsers);

// Получение пользователя по ID
router.get('/:id', getUser);

// Получение доступов пользователя к таблицам
router.get('/:id/access', getUserAccess);

// Создание нового пользователя (только админ)
router.post('/', requireRole(['admin']), createUser);

// Отправка приглашения пользователю (только админ)
router.post('/invite', requireRole(['admin']), inviteUser);

// Массовое обновление пользователей (только админ)
router.patch('/bulk', requireRole(['admin']), bulkUpdateUsers);

// Обновление пользователя
router.put('/:id', updateUser);

// Деактивация пользователя (только админ)
router.patch('/:id/deactivate', requireRole(['admin']), deactivateUser);

// Управление доступом к таблицам
router.post('/access', requireRole(['admin']), setUserSheetAccess);
router.delete('/access', requireRole(['admin']), removeUserSheetAccess);

export default router; 