import { Router } from 'express';
import {
  createUserGroup,
  getGroups,
  updateGroup,
  addUsersToGroup,
  removeUsersFromGroup,
  deleteGroup,
  setGroupSheetAccess
} from '../controllers/groupController';
import { requireRole } from '../middleware/auth';

const router = Router();

// Все операции с группами доступны только администраторам

// Получение списка групп
router.get('/', requireRole(['admin']), getGroups);

// Создание новой группы
router.post('/', requireRole(['admin']), createUserGroup);

// Обновление группы
router.put('/:id', requireRole(['admin']), updateGroup);

// Добавление пользователей в группу
router.post('/:id/users', requireRole(['admin']), addUsersToGroup);
router.post('/:id/members', requireRole(['admin']), addUsersToGroup);

// Удаление пользователей из группы
router.delete('/:id/users', requireRole(['admin']), removeUsersFromGroup);
router.delete('/:id/members', requireRole(['admin']), removeUsersFromGroup);

// Настройка группового доступа к таблице
router.post('/access', requireRole(['admin']), setGroupSheetAccess);

// Удаление группы
router.delete('/:id', requireRole(['admin']), deleteGroup);

export default router; 