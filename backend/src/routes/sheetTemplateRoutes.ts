import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getTemplates, getTemplate, createSheetFromTemplate } from '../controllers/sheetTemplateController';

const router = express.Router();

// Логирование всех запросов
router.use((req, res, next) => {
  console.log(`📋 Template route: ${req.method} ${req.path}`);
  next();
});

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/templates - получение списка шаблонов
router.get('/', getTemplates);

// GET /api/templates/:id - получение шаблона по ID
router.get('/:id', getTemplate);

// POST /api/templates/:templateId/create-sheet - создание таблицы из шаблона
router.post('/:templateId/create-sheet', createSheetFromTemplate);

export default router; 