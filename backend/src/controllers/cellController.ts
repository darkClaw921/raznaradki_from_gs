import { Request, Response } from 'express';
import { Cell, Sheet, UserSheet, CellHistory, User } from '../models';

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

    // Поиск существующей ячейки для истории
    const existingCell = await Cell.findOne({
      where: { sheetId, row: rowNum, column: colNum }
    });

    // Поиск или создание ячейки
    let cell = existingCell;

    if (cell) {
      // Определяем тип изменения на основе того, что действительно изменилось
      let changeType: 'value' | 'formula' | 'format' = 'value';
      
      if (cell.formula !== formula && formula !== undefined) {
        changeType = 'formula';
      } else if (cell.value !== value && value !== undefined) {
        changeType = 'value';  
      } else if (format && JSON.stringify(cell.format) !== JSON.stringify(format)) {
        changeType = 'format';
      }

      // Создаем запись в истории перед обновлением
      await CellHistory.create({
        cellId: cell.id,
        sheetId: parseInt(sheetId),
        row: rowNum,
        column: colNum,
        oldValue: cell.value,
        newValue: value,
        oldFormula: cell.formula,
        newFormula: formula,
        oldFormat: cell.format,
        newFormat: format,
        changedBy: userId,
        changeType
      });

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

      // Создаем запись в истории для новой ячейки
      await CellHistory.create({
        cellId: cell.id,
        sheetId: parseInt(sheetId),
        row: rowNum,
        column: colNum,
        oldValue: null,
        newValue: value,
        oldFormula: null,
        newFormula: formula,
        oldFormat: null,
        newFormat: format,
        changedBy: userId,
        changeType: 'create'
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

// Получение истории изменений ячейки
export const getCellHistory = async (req: Request, res: Response) => {
  try {
    const { sheetId, row, column } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const history = await CellHistory.findAll({
      where: {
        sheetId,
        row: parseInt(row),
        column: parseInt(column)
      },
      include: [
        {
          model: User,
          as: 'changedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      history,
      total: await CellHistory.count({
        where: {
          sheetId,
          row: parseInt(row),
          column: parseInt(column)
        }
      })
    });

  } catch (error) {
    console.error('Ошибка получения истории ячейки:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Применение форматирования к диапазону ячеек
export const formatCells = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;
    const { startRow, endRow, startColumn, endColumn, format } = req.body;
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
        error: 'Нет прав на редактирование форматирования'
      });
    }

    const updatedCells = [];

    // Применяем форматирование к диапазону ячеек
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startColumn; col <= endColumn; col++) {
        let cell = await Cell.findOne({
          where: { sheetId, row, column: col }
        });

        if (cell) {
          const oldFormat = cell.format;
          const newFormat = { ...oldFormat, ...format };
          
          // Создаем запись в истории
          await CellHistory.create({
            cellId: cell.id,
            sheetId: parseInt(sheetId),
            row,
            column: col,
            oldValue: cell.value,
            newValue: cell.value,
            oldFormula: cell.formula,
            newFormula: cell.formula,
            oldFormat,
            newFormat,
            changedBy: userId,
            changeType: 'format'
          });

          await cell.update({ format: newFormat });
          updatedCells.push(cell);
        } else {
          // Создаем новую ячейку с форматированием
          cell = await Cell.create({
            sheetId: parseInt(sheetId),
            row,
            column: col,
            value: '',
            formula: null,
            format,
            isLocked: false
          });

          await CellHistory.create({
            cellId: cell.id,
            sheetId: parseInt(sheetId),
            row,
            column: col,
            oldValue: null,
            newValue: '',
            oldFormula: null,
            newFormula: null,
            oldFormat: null,
            newFormat: format,
            changedBy: userId,
            changeType: 'create'
          });

          updatedCells.push(cell);
        }
      }
    }

    res.json({
      message: 'Форматирование применено',
      updatedCells: updatedCells.length
    });

  } catch (error) {
    console.error('Ошибка применения форматирования:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
}; 