import { Router } from 'express';
import { 
  getWebhookMapping, 
  updateWebhookMapping, 
  processWebhook 
} from '../controllers/webhookController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Получить настройки webhook для таблицы
router.get('/mapping/:sheetId', authenticateToken, getWebhookMapping);

// Обновить настройки webhook для таблицы
router.put('/mapping/:sheetId', authenticateToken, updateWebhookMapping);

// Обработка входящего webhook (без аутентификации)
router.post('/:webhookId', processWebhook);

export default router; 