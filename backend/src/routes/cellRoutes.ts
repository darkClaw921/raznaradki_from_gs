import { Router } from 'express';
import { updateCell, getCell } from '../controllers/cellController';

const router = Router();

// Получение ячейки
router.get('/:sheetId/:row/:column', getCell);

// Обновление ячейки
router.put('/:sheetId/:row/:column', updateCell);

export default router; 