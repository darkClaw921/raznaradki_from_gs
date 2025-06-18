import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { updateCell, getCell, getCellHistory, formatCells } from '../controllers/cellController';

const router = Router();

// Получение ячейки
router.get('/sheets/:sheetId/cells/:row/:column', authenticateToken, getCell);

// Обновление ячейки
router.put('/sheets/:sheetId/cells/:row/:column', authenticateToken, updateCell);

// Получение истории изменений ячейки
router.get('/sheets/:sheetId/cells/:row/:column/history', authenticateToken, getCellHistory);

// Применение форматирования к диапазону ячеек
router.post('/sheets/:sheetId/format', authenticateToken, formatCells);

export default router; 