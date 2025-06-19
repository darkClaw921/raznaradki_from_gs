import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getTemplates, getTemplate, createSheetFromTemplate, syncLinkedSheetData } from '../controllers/sheetTemplateController';
import { Sheet, UserSheet } from '../models';

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

// Обновление даты отчета
router.put('/update-report-date/:sheetId', authenticateToken, async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { reportDate } = req.body;
    const userId = req.user.id;

    if (!reportDate) {
      return res.status(400).json({
        error: 'Дата отчета обязательна'
      });
    }

    // Получаем информацию о таблице
    const sheet = await Sheet.findByPk(sheetId);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверяем права доступа
    const hasAccess = sheet.createdBy === userId || sheet.isPublic;
    if (!hasAccess) {
      const userSheet = await UserSheet.findOne({
        where: { userId, sheetId }
      });
      if (!userSheet || !['write', 'admin'].includes(userSheet.permission)) {
        return res.status(403).json({
          error: 'Нет прав на редактирование таблицы'
        });
      }
    }

    // Обновляем дату отчета
    await sheet.update({ reportDate });

    // Если это связанная таблица, автоматически синхронизируем данные
    if (sheet.sourceSheetId) {
      await syncLinkedSheetData(sheet.id, sheet.sourceSheetId, reportDate);
    }

    res.json({
      message: 'Дата отчета обновлена',
      sheetId,
      reportDate,
      synchronized: !!sheet.sourceSheetId
    });

  } catch (error) {
    console.error('Ошибка обновления даты отчета:', error);
    res.status(500).json({
      error: 'Ошибка сервера при обновлении даты отчета'
    });
  }
});

export default router; 