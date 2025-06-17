import { Request, Response } from 'express';
import { Cell, Sheet, UserSheet } from '../models';

// Обновление ячейки
export const updateCell = async (req: Request, res: Response) => {
  try {
    const { sheetId, row, column } = req.params;
    const { value, formula, format } = req.body;
    const userId = req.user.id;

    // Проверка доступа к таблице
    const sheet = await Sheet.findByPk(sheetId);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на редактирование
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId }
    });

    const hasWriteAccess = sheet.createdBy === userId || 
                          (userSheet && ['write', 'admin'].includes(userSheet.permission));

    if (!hasWriteAccess) {
      return res.status(403).json({
        error: 'Нет прав на редактирование ячеек'
      });
    }

    const rowNum = parseInt(row);
    const colNum = parseInt(column);

    // Поиск или создание ячейки
    let cell = await Cell.findOne({
      where: { sheetId, row: rowNum, column: colNum }
    });

    if (cell) {
      await cell.update({
        value: value || '',
        formula: formula || null,
        format: format || cell.format
      });
    } else {
      cell = await Cell.create({
        sheetId: parseInt(sheetId),
        row: rowNum,
        column: colNum,
        value: value || '',
        formula: formula || null,
        format: format || null,
        isLocked: false
      });
    }

    res.json({
      message: 'Ячейка обновлена',
      cell
    });

  } catch (error) {
    console.error('Ошибка обновления ячейки:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Получение ячейки
export const getCell = async (req: Request, res: Response) => {
  try {
    const { sheetId, row, column } = req.params;
    
    const cell = await Cell.findOne({
      where: {
        sheetId,
        row: parseInt(row),
        column: parseInt(column)
      }
    });

    res.json({
      cell: cell || {
        row: parseInt(row),
        column: parseInt(column),
        value: '',
        formula: null,
        format: null
      }
    });

  } catch (error) {
    console.error('Ошибка получения ячейки:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
}; 