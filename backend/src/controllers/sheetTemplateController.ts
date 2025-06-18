import { Request, Response } from 'express';
import { SheetTemplate, Sheet, UserSheet, Cell } from '../models';

// Получение списка всех активных шаблонов
export const getTemplates = async (req: Request, res: Response) => {
  try {
    console.log('🔍 getTemplates вызван');
    const templates = await SheetTemplate.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    console.log('✅ Шаблоны найдены:', templates.length);

    res.json({
      message: 'Шаблоны успешно получены',
      templates
    });
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении шаблонов'
    });
  }
};

// Получение шаблона по ID
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const template = await SheetTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        error: 'Шаблон не найден'
      });
    }

    res.json({
      message: 'Шаблон успешно получен',
      template
    });
  } catch (error) {
    console.error('Ошибка получения шаблона:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении шаблона'
    });
  }
};

// Создание таблицы из шаблона
export const createSheetFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        error: 'Название таблицы обязательно'
      });
    }

    // Получаем шаблон
    const template = await SheetTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({
        error: 'Шаблон не найден'
      });
    }

    // Создаем таблицу на основе шаблона
    const sheet = await Sheet.create({
      name,
      description: description || template.description,
      createdBy: userId,
      rowCount: template.rowCount,
      columnCount: template.columnCount,
      isPublic: false,
      settings: {
        columnWidths: template.structure.columnWidths || {},
        rowHeights: {},
        frozenRows: 0,
        frozenColumns: 0
      }
    });

    // Создаем связь создателя с таблицей
    await UserSheet.create({
      userId,
      sheetId: sheet.id,
      permission: 'admin'
    });

    // Заполняем ячейки данными из шаблона
    const cellsToCreate = [];
    
    // Заголовки
    if (template.structure.headers) {
      for (const header of template.structure.headers) {
        cellsToCreate.push({
          sheetId: sheet.id,
          row: header.row,
          column: header.column,
          value: header.value,
          format: header.format || {},
          isLocked: false
        });
      }
    }

    // Примеры данных
    if (template.structure.sampleData) {
      for (const sampleCell of template.structure.sampleData) {
        cellsToCreate.push({
          sheetId: sheet.id,
          row: sampleCell.row,
          column: sampleCell.column,
          value: sampleCell.value,
          format: sampleCell.format || {},
          isLocked: false
        });
      }
    }

    // Создаем все ячейки разом
    if (cellsToCreate.length > 0) {
      await Cell.bulkCreate(cellsToCreate);
    }

    // Получаем созданную таблицу с дополнительными данными
    const createdSheet = await Sheet.findByPk(sheet.id, {
      include: [
        {
          model: SheetTemplate,
          as: 'template',
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    res.status(201).json({
      message: 'Таблица успешно создана из шаблона',
      sheet: createdSheet
    });

  } catch (error) {
    console.error('Ошибка создания таблицы из шаблона:', error);
    res.status(500).json({
      error: 'Ошибка сервера при создании таблицы из шаблона'
    });
  }
}; 