import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getTemplates, getTemplate, createSheetFromTemplate, syncLinkedSheetData } from '../controllers/sheetTemplateController';

const router = Router();

// Логирование всех запросов
router.use((req, res, next) => {
  console.log(`📋 Template route: ${req.method} ${req.path}`);
  console.log(`📋 Headers:`, req.headers.authorization ? 'Authorization present' : 'No authorization');
  console.log(`📋 Body:`, req.body);
  next();
});

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/templates - получение списка шаблонов
router.get('/', getTemplates);

// GET /api/templates/:id - получение шаблона по ID
router.get('/:id', getTemplate);

// POST /api/templates/create - создание таблицы из шаблона (ДОЛЖЕН быть ПЕРЕД /:templateId)
router.post('/create', (req, res, next) => {
  console.log('🎯 POST /create endpoint reached!');
  console.log('🎯 User from middleware:', req.user);
  console.log('🎯 Request body:', req.body);
  next();
}, createSheetFromTemplate);

// POST /api/templates/:templateId/create-sheet - создание таблицы из шаблона
router.post('/:templateId/create-sheet', createSheetFromTemplate);

// Синхронизация связанной таблицы
router.post('/sync/:reportSheetId/:sourceSheetId', async (req, res) => {
  try {
    const { reportSheetId, sourceSheetId } = req.params;
    const { targetDate } = req.body;

    await syncLinkedSheetData(
      parseInt(reportSheetId), 
      parseInt(sourceSheetId), 
      targetDate
    );

    res.json({
      message: 'Данные успешно синхронизированы',
      reportSheetId,
      sourceSheetId,
      targetDate
    });

  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    res.status(500).json({
      error: 'Ошибка сервера при синхронизации'
    });
  }
});

export default router; 