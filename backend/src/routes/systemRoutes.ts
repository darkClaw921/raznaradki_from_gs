import { Router } from 'express';
import { 
  getSystemSettings, 
  updateSystemSetting, 
  generateWebhookUrl, 
  toggleWebhook 
} from '../controllers/systemController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Получить все системные настройки (только для админов)
router.get('/settings', authenticateToken, requireRole(['admin']), getSystemSettings);

// Обновить системную настройку (только для админов)
router.put('/settings', authenticateToken, requireRole(['admin']), updateSystemSetting);

// Сгенерировать новый webhook URL (только для админов)
router.post('/webhook/generate', authenticateToken, requireRole(['admin']), generateWebhookUrl);

// Включить/отключить webhook (только для админов)
router.put('/webhook/toggle', authenticateToken, requireRole(['admin']), toggleWebhook);

export default router; 