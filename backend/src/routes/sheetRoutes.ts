import { Router } from 'express';
import {
  getSheets,
  getSheet,
  createSheet,
  updateSheet,
  deleteSheet,
  addUserToSheet
} from '../controllers/sheetController';

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

export default router; 