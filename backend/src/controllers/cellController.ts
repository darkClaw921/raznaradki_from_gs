import { Request, Response } from 'express';
import { Cell, Sheet, UserSheet, CellHistory, User, ReportSource, SheetTemplate } from '../models';
import { Op } from 'sequelize';
import { updateLinkedReports } from './sheetTemplateController';

// Обратная синхронизация изменений из отчета в журнал
const handleReverseSync = async (sheetId: number, row: number, column: number, value: string, userId: number) => {
  try {
    // Проверяем, является ли это отчетом заселения/выселения и столбцом 16
    const currentSheet = await Sheet.findByPk(sheetId);

    if (!currentSheet) return;

    // Проверяем, что это отчет заселения/выселения и изменяется столбец 16
    const isReport = currentSheet.templateId === 2; // Шаблон "Отчет заселения/выселения DMD Cottage"
    const isDayCommentsColumn = column === 16;

    if (!isReport || !isDayCommentsColumn) return;

    console.log(`🔄 Обратная синхронизация: отчет ${sheetId}, строка ${row}, столбец ${column}, значение "${value}"`);

    // Получаем данные из текущей строки отчета для идентификации соответствующей записи в журнале
    const reportRowCells = await Cell.findAll({
      where: { sheetId, row },
      order: [['column', 'ASC']]
    });

    // Извлекаем данные для поиска в журнале
    let guestName = '';
    let address = '';
    
    reportRowCells.forEach(cell => {
      if (cell.column === 0) address = cell.value || ''; // Адрес (название журнала)
      if (cell.column === 6) guestName = cell.value || ''; // ФИО заселяющегося
    });

    if (!guestName || !address) {
      console.log(`⚠️ Недостаточно данных для обратной синхронизации: guestName="${guestName}", address="${address}"`);
      return;
    }

    // Находим связанные журналы
    const reportSources = await ReportSource.findAll({
      where: { reportSheetId: sheetId },
      include: [
        {
          model: Sheet,
          as: 'sourceSheet',
          attributes: ['id', 'name']
        }
      ]
    });

    // Ищем журнал по названию (адресу)
    const matchingSource = reportSources.find(source => {
      const sourceSheet = (source as any).sourceSheet;
      return sourceSheet?.name === address;
    });

    if (!matchingSource) {
      console.log(`⚠️ Не найден журнал с названием "${address}"`);
      return;
    }

    const sourceSheetId = matchingSource.sourceSheetId;
    console.log(`🔍 Найден журнал: ${address} (ID: ${sourceSheetId})`);

    // Находим соответствующую строку в журнале по ФИО гостя
    const journalCells = await Cell.findAll({
      where: { 
        sheetId: sourceSheetId,
        column: 4, // Столбец ФИО в журнале
        value: guestName
      }
    });

    if (journalCells.length === 0) {
      console.log(`⚠️ Не найдена запись с ФИО "${guestName}" в журнале ${sourceSheetId}`);
      return;
    }

    // Обновляем столбец 12 (комментарии по оплате) в журнале для каждой найденной строки
    for (const guestCell of journalCells) {
      const journalRow = guestCell.row;
      const linkedBookingId = guestCell.bookingId || null;
      
      // Находим или создаем ячейку в столбце 12 журнала
      let dayCommentsCell = await Cell.findOne({
        where: { 
          sheetId: sourceSheetId, 
          row: journalRow, 
          column: 12 
        }
      });

      if (dayCommentsCell) {
        const updatePayload: any = { value };
        if (linkedBookingId && !dayCommentsCell.bookingId) {
          updatePayload.bookingId = linkedBookingId;
        }
        await dayCommentsCell.update(updatePayload);
        console.log(`✅ Обновлена ячейка журнала [${journalRow}, 12] в таблице ${sourceSheetId}: "${value}"`);
      } else {
        dayCommentsCell = await Cell.create({
          sheetId: sourceSheetId,
          row: journalRow,
          column: 12,
          value,
          formula: null,
          format: null,
          isLocked: false,
          bookingId: linkedBookingId || undefined
        });
        console.log(`✅ Создана ячейка журнала [${journalRow}, 12] в таблице ${sourceSheetId}: "${value}"`);
      }

      // Записываем в историю изменений журнала
      await CellHistory.create({
        cellId: dayCommentsCell.id,
        sheetId: sourceSheetId,
        row: journalRow,
        column: 12,
        oldValue: dayCommentsCell.value === value ? '' : dayCommentsCell.value,
        newValue: value,
        oldFormula: null,
        newFormula: null,
        oldFormat: null,
        newFormat: null,
        changedBy: userId,
        changeType: 'value'
      });
    }

  } catch (error) {
    console.error('Ошибка в handleReverseSync:', error);
    throw error;
  }
};

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

    let changeType: 'value' | 'formula' | 'format' | 'create' | 'delete' = 'value';
    let oldValue = '';
    let oldFormula = '';
    let oldFormat = {};

    if (cell) {
        // Сохраняем предыдущие значения для истории
        oldValue = cell.value || '';
        oldFormula = cell.formula || '';
        oldFormat = cell.format || {};

      // Определяем тип изменения
      if (value !== undefined && value !== cell.value) {
        changeType = 'value';
      } else if (formula !== undefined && formula !== cell.formula) {
        changeType = 'formula';
      } else if (format !== undefined && JSON.stringify(format) !== JSON.stringify(cell.format)) {
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

      // Обновление существующей ячейки
      const updateData: any = {};
      if (value !== undefined) updateData.value = value;
      if (formula !== undefined) updateData.formula = formula;
      if (format !== undefined) updateData.format = format;

      // Автопроставление bookingId для отчета при изменении колонки 16
      try {
        const currentSheet = await Sheet.findByPk(sheetId);
        const isReportSheet = currentSheet?.templateId === 2; // Шаблон "Отчет заселения/выселения DMD Cottage"
        const isDayCommentsCol = colNum === 16;
        
        console.log(`🔍 Автопроставление bookingId: sheet="${currentSheet?.name}", isReport=${isReportSheet}, col=${colNum}, isDayComments=${isDayCommentsCol}, currentBookingId=${cell.bookingId}`);
        
        if (isReportSheet && isDayCommentsCol && !cell.bookingId) {
          console.log(`🔍 Ищем bookingId в строке ${rowNum} таблицы ${sheetId}`);
          
          const rowCellWithBooking = await Cell.findOne({
            where: {
              sheetId,
              row: rowNum,
              bookingId: { [Op.not]: null }
            }
          });
          
          if (rowCellWithBooking?.bookingId) {
            console.log(`✅ Найден bookingId в строке: ${rowCellWithBooking.bookingId}`);
            updateData.bookingId = rowCellWithBooking.bookingId;
          } else {
            console.log(`🔍 BookingId не найден в строке, ищем через связанный журнал`);
            
            // Фолбэк: получаем bookingId из связанного журнала по адресу и ФИО
            const reportRowCells = await Cell.findAll({
              where: { sheetId, row: rowNum },
              order: [['column', 'ASC']]
            });
            
            let guestName = '';
            let address = '';
            reportRowCells.forEach(rc => {
              if (rc.column === 0) address = rc.value || '';
              if (rc.column === 6) guestName = rc.value || '';
            });
            
            console.log(`🔍 Данные из отчета: address="${address}", guestName="${guestName}"`);
            
            if (guestName && address) {
              const reportSources = await ReportSource.findAll({
                where: { reportSheetId: parseInt(sheetId) },
                include: [
                  {
                    model: Sheet,
                    as: 'sourceSheet',
                    attributes: ['id', 'name']
                  }
                ]
              });
              
              console.log(`🔍 Найдено связей с журналами: ${reportSources.length}`);
              
              const matchingSource = reportSources.find(source => {
                const sourceSheet = (source as any).sourceSheet;
                return sourceSheet?.name === address;
              });
              
              const sourceSheetId = matchingSource?.sourceSheetId;
              console.log(`🔍 Найден журнал "${address}": ${sourceSheetId ? `ID ${sourceSheetId}` : 'не найден'}`);
              
              if (sourceSheetId) {
                const guestCellInJournal = await Cell.findOne({
                  where: { sheetId: sourceSheetId, column: 4, value: guestName }
                });
                
                if (guestCellInJournal?.bookingId) {
                  console.log(`✅ Найден bookingId в журнале: ${guestCellInJournal.bookingId}`);
                  updateData.bookingId = guestCellInJournal.bookingId;
                } else {
                  console.log(`❌ BookingId не найден в журнале для гостя "${guestName}"`);
                }
              }
            } else {
              console.log(`❌ Недостаточно данных для поиска: address="${address}", guestName="${guestName}"`);
            }
          }
        }
      } catch (e) {
        console.error('Ошибка автопроставления bookingId (updateCell):', e);
      }

      if (Object.keys(updateData).length > 0) {
        await cell.update(updateData);
      }
    } else {
      // Автопроставление bookingId для отчета при создании ячейки колонки 16
      let bookingIdToSet: number | undefined = undefined;
      try {
        const currentSheet = await Sheet.findByPk(sheetId);
        const isReportSheet = currentSheet?.templateId === 2; // Шаблон "Отчет заселения/выселения DMD Cottage"
        const isDayCommentsCol = colNum === 16;
        
        console.log(`🔍 Создание ячейки с bookingId: sheet="${currentSheet?.name}", isReport=${isReportSheet}, col=${colNum}, isDayComments=${isDayCommentsCol}`);
        
        if (isReportSheet && isDayCommentsCol) {
          console.log(`🔍 Ищем bookingId для новой ячейки в строке ${rowNum} таблицы ${sheetId}`);
          
          const rowCellWithBooking = await Cell.findOne({
            where: {
              sheetId,
              row: rowNum,
              bookingId: { [Op.not]: null }
            }
          });
          
          if (rowCellWithBooking?.bookingId) {
            console.log(`✅ Найден bookingId в строке для новой ячейки: ${rowCellWithBooking.bookingId}`);
            bookingIdToSet = rowCellWithBooking.bookingId as number;
          } else {
            console.log(`🔍 BookingId не найден в строке для новой ячейки, ищем через связанный журнал`);
            
            // Фолбэк: получаем bookingId из связанного журнала по адресу и ФИО
            const reportRowCells = await Cell.findAll({
              where: { sheetId, row: rowNum },
              order: [['column', 'ASC']]
            });
            
            let guestName = '';
            let address = '';
            reportRowCells.forEach(rc => {
              if (rc.column === 0) address = rc.value || '';
              if (rc.column === 6) guestName = rc.value || '';
            });
            
            console.log(`🔍 Данные из отчета для новой ячейки: address="${address}", guestName="${guestName}"`);
            
            if (guestName && address) {
              const reportSources = await ReportSource.findAll({
                where: { reportSheetId: parseInt(sheetId) },
                include: [
                  {
                    model: Sheet,
                    as: 'sourceSheet',
                    attributes: ['id', 'name']
                  }
                ]
              });
              
              console.log(`🔍 Найдено связей с журналами для новой ячейки: ${reportSources.length}`);
              
              const matchingSource = reportSources.find(source => {
                const sourceSheet = (source as any).sourceSheet;
                return sourceSheet?.name === address;
              });
              
              const sourceSheetId = matchingSource?.sourceSheetId;
              console.log(`🔍 Найден журнал для новой ячейки "${address}": ${sourceSheetId ? `ID ${sourceSheetId}` : 'не найден'}`);
              
              if (sourceSheetId) {
                const guestCellInJournal = await Cell.findOne({
                  where: { sheetId: sourceSheetId, column: 4, value: guestName }
                });
                
                if (guestCellInJournal?.bookingId) {
                  console.log(`✅ Найден bookingId в журнале для новой ячейки: ${guestCellInJournal.bookingId}`);
                  bookingIdToSet = guestCellInJournal.bookingId as number;
                } else {
                  console.log(`❌ BookingId не найден в журнале для новой ячейки для гостя "${guestName}"`);
                }
              }
            } else {
              console.log(`❌ Недостаточно данных для поиска новой ячейки: address="${address}", guestName="${guestName}"`);
            }
          }
        }
      } catch (e) {
        console.error('Ошибка автопроставления bookingId при создании (updateCell):', e);
      }

      cell = await Cell.create({
        sheetId: parseInt(sheetId),
        row: rowNum,
        column: colNum,
        value: value || '',
        formula: formula || null,
        format: format || null,
        isLocked: false,
        bookingId: bookingIdToSet
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

    // Записываем в историю
    await CellHistory.create({
      cellId: cell.id,
      sheetId: parseInt(sheetId),
      row: parseInt(row),
      column: parseInt(column),
      changedBy: userId,
      changeType,
      oldValue,
      newValue: cell.value || '',
      oldFormula,
      newFormula: cell.formula || '',
      oldFormat: oldFormat,
      newFormat: cell.format || {}
    });

    // Обратная синхронизация для столбца 16 отчетов заселения
    try {
      await handleReverseSync(parseInt(sheetId), rowNum, colNum, value || '', userId);
    } catch (error) {
      console.error('Ошибка обратной синхронизации:', error);
      // Не прерываем выполнение если ошибка в синхронизации
    }

    // Обновляем связанные отчеты при изменении данных в журнале
    try {
      const updatedReports = await updateLinkedReports(parseInt(sheetId));
      if (updatedReports > 0) {
        console.log(`✅ Обновлено ${updatedReports} связанных отчетов`);
      }
    } catch (error) {
      console.error('Ошибка обновления связанных отчетов:', error);
      // Не прерываем выполнение если ошибка в синхронизации
    }

    res.json({
      message: 'Ячейка обновлена',
      cell,
      changeType
    });

  } catch (error) {
    console.error('Ошибка обновления ячейки:', error);
    res.status(500).json({
      error: 'Ошибка сервера при обновлении ячейки'
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

// Массовое обновление ячеек (для операций вставки)
export const updateCellsBatch = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;
    const { cells: cellsData } = req.body;
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

    const updatedCells = [];
    const createdCells = [];

    console.log(`Массовое обновление ${cellsData.length} ячеек в таблице ${sheetId}`);

    // Обрабатываем все ячейки в одной транзакции
    for (const cellData of cellsData) {
      const { row, column, value, formula } = cellData;
      const rowNum = parseInt(row);
      const colNum = parseInt(column);

      // Ищем существующую ячейку
      let cell = await Cell.findOne({
        where: { sheetId, row: rowNum, column: colNum }
      });

      if (cell) {
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
          newFormat: cell.format,
          changedBy: userId,
          changeType: value !== cell.value ? 'value' : 'formula'
        });

        // Обновляем ячейку
        const updateData: any = {};
        if (value !== undefined) updateData.value = value;
        if (formula !== undefined) updateData.formula = formula;

        // Автопроставление bookingId для отчетов при изменении колонки 16
        try {
          const currentSheet = await Sheet.findByPk(sheetId);
          const isReportSheet = currentSheet?.name?.includes('Отчет');
          const isDayCommentsCol = colNum === 16;
          if (isReportSheet && isDayCommentsCol && !cell.bookingId) {
            const rowCellWithBooking = await Cell.findOne({
              where: {
                sheetId,
                row: rowNum,
                bookingId: { [Op.not]: null }
              }
            });
            if (rowCellWithBooking?.bookingId) {
              updateData.bookingId = rowCellWithBooking.bookingId;
            } else {
              // Фолбэк: получаем bookingId из связанного журнала по адресу и ФИО
              const reportRowCells = await Cell.findAll({
                where: { sheetId, row: rowNum },
                order: [['column', 'ASC']]
              });
              let guestName = '';
              let address = '';
              reportRowCells.forEach(rc => {
                if (rc.column === 0) address = rc.value || '';
                if (rc.column === 6) guestName = rc.value || '';
              });
              if (guestName && address) {
                const reportSources = await ReportSource.findAll({
                  where: { reportSheetId: parseInt(sheetId) },
                  include: [
                    {
                      model: Sheet,
                      as: 'sourceSheet',
                      attributes: ['id', 'name']
                    }
                  ]
                });
                const matchingSource = reportSources.find(source => {
                  const sourceSheet = (source as any).sourceSheet;
                  return sourceSheet?.name === address;
                });
                const sourceSheetId = matchingSource?.sourceSheetId;
                if (sourceSheetId) {
                  const guestCellInJournal = await Cell.findOne({
                    where: { sheetId: sourceSheetId, column: 4, value: guestName }
                  });
                  if (guestCellInJournal?.bookingId) {
                    updateData.bookingId = guestCellInJournal.bookingId;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Ошибка автопроставления bookingId (updateCellsBatch):', e);
        }

        if (Object.keys(updateData).length > 0) {
          await cell.update(updateData);
          updatedCells.push(cell);
        }
      } else {
        // Создаем новую ячейку
        let bookingIdToSet: number | undefined = undefined;
        try {
          const currentSheet = await Sheet.findByPk(sheetId);
          const isReportSheet = currentSheet?.name?.includes('Отчет');
          const isDayCommentsCol = colNum === 16;
          if (isReportSheet && isDayCommentsCol) {
            const rowCellWithBooking = await Cell.findOne({
              where: {
                sheetId,
                row: rowNum,
                bookingId: { [Op.not]: null }
              }
            });
            if (rowCellWithBooking?.bookingId) {
              bookingIdToSet = rowCellWithBooking.bookingId as number;
            } else {
              // Фолбэк: получаем bookingId из связанного журнала по адресу и ФИО
              const reportRowCells = await Cell.findAll({
                where: { sheetId, row: rowNum },
                order: [['column', 'ASC']]
              });
              let guestName = '';
              let address = '';
              reportRowCells.forEach(rc => {
                if (rc.column === 0) address = rc.value || '';
                if (rc.column === 6) guestName = rc.value || '';
              });
              if (guestName && address) {
                const reportSources = await ReportSource.findAll({
                  where: { reportSheetId: parseInt(sheetId) },
                  include: [
                    {
                      model: Sheet,
                      as: 'sourceSheet',
                      attributes: ['id', 'name']
                    }
                  ]
                });
                const matchingSource = reportSources.find(source => {
                  const sourceSheet = (source as any).sourceSheet;
                  return sourceSheet?.name === address;
                });
                const sourceSheetId = matchingSource?.sourceSheetId;
                if (sourceSheetId) {
                  const guestCellInJournal = await Cell.findOne({
                    where: { sheetId: sourceSheetId, column: 4, value: guestName }
                  });
                  if (guestCellInJournal?.bookingId) {
                    bookingIdToSet = guestCellInJournal.bookingId as number;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Ошибка автопроставления bookingId при создании (updateCellsBatch):', e);
        }

        cell = await Cell.create({
          sheetId: parseInt(sheetId),
          row: rowNum,
          column: colNum,
          value: value || '',
          formula: formula || null,
          format: null,
          isLocked: false,
          bookingId: bookingIdToSet
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
          newFormat: null,
          changedBy: userId,
          changeType: 'create'
        });

        createdCells.push(cell);
      }
    }

    // Обновляем связанные отчеты только один раз после всех изменений
    try {
      const updatedReports = await updateLinkedReports(parseInt(sheetId));
      if (updatedReports > 0) {
        console.log(`✅ Обновлено ${updatedReports} связанных отчетов после массового обновления`);
      }
    } catch (error) {
      console.error('Ошибка обновления связанных отчетов:', error);
    }

    res.json({
      message: 'Ячейки обновлены массово',
      updatedCells: updatedCells.length,
      createdCells: createdCells.length,
      totalProcessed: cellsData.length
    });

  } catch (error) {
    console.error('Ошибка массового обновления ячеек:', error);
    res.status(500).json({
      error: 'Ошибка сервера при массовом обновлении ячеек'
    });
  }
}; 