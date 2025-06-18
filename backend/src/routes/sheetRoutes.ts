import { Router } from 'express';
import {
  getSheets,
  getSheet,
  createSheet,
  updateSheet,
  deleteSheet,
  addUserToSheet,
  setCellLevelAccess,
  getCellLevelAccess,
  copySheetAccess,
  checkCellAccess,
  addColumn,
  addRow,
  getSheetMembers,
  inviteMember,
  resizeColumn,
  resizeRow
} from '../controllers/sheetController';
import { requireRole } from '../middleware/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Получение списка таблиц
router.get('/', getSheets);

// Создание новой таблицы
router.post('/', createSheet);

// Получение конкретной таблицы
router.get('/:id', getSheet);

// Обновление таблицы
router.put('/:id', updateSheet);

// Удаление таблицы
router.delete('/:id', deleteSheet);

// Добавление пользователя к таблице
router.post('/:id/users', addUserToSheet);

// Детальное управление доступом (только для админов и создателей таблиц)
router.post('/:id/access/cell', requireRole(['admin']), setCellLevelAccess);
router.get('/:id/access', getCellLevelAccess);
router.post('/:id/access/copy', requireRole(['admin']), copySheetAccess);
router.post('/access/check', checkCellAccess);

// Добавление столбца
router.post('/:id/columns', authenticateToken, addColumn);

// Добавление строки
router.post('/:id/rows', authenticateToken, addRow);

// Получение участников таблицы
router.get('/:id/members', authenticateToken, getSheetMembers);

// Приглашение участника
router.post('/:id/invite', authenticateToken, inviteMember);

// Изменение размера столбца
router.patch('/:id/columns/resize', authenticateToken, resizeColumn);

// Изменение размера строки
router.patch('/:id/rows/resize', authenticateToken, resizeRow);

export default router; 