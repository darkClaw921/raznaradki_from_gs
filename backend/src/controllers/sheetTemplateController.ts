import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { SheetTemplate, Sheet, UserSheet, Cell, ReportSource } from '../models';

// Получение списка всех шаблонов
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await SheetTemplate.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const groupedTemplates = templates.reduce((acc: any, template: any) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {});

    res.json({
      templates: groupedTemplates,
      total: templates.length
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
  console.log('📋 ENTER createSheetFromTemplate:', { params: req.params, body: req.body });
  try {
    // templateId может быть в параметрах URL или в теле запроса
    const templateId = req.params.templateId || req.body.templateId;
    const { name, description, sourceSheetId, sourceSheetIds } = req.body;
    const userId = req.user.id;

    console.log('🔧 Creating sheet from template:', { templateId, name, sourceSheetId });

    if (!templateId || !name) {
      return res.status(400).json({
        error: 'ID шаблона и название таблицы обязательны'
      });
    }

    // Получаем шаблон
    const template = await SheetTemplate.findByPk(parseInt(templateId));
    if (!template) {
      return res.status(404).json({
        error: 'Шаблон не найден'
      });
    }

    // Проверяем существование исходной таблицы если указана
    if (sourceSheetId) {
      const sourceSheet = await Sheet.findByPk(sourceSheetId);
      if (!sourceSheet) {
        return res.status(404).json({
          error: 'Исходная таблица не найдена'
        });
      }

      // Проверяем доступ к исходной таблице
      const hasAccessToSource = sourceSheet.createdBy === userId || sourceSheet.isPublic;
      if (!hasAccessToSource) {
        const userSheet = await UserSheet.findOne({
          where: { userId, sheetId: sourceSheetId }
        });
        if (!userSheet) {
          return res.status(403).json({
            error: 'Нет доступа к исходной таблице'
          });
        }
      }
    }

    // Создаем новую таблицу
    const sheet = await Sheet.create({
      name,
      description: description || template.description,
      createdBy: userId,
      rowCount: template.rowCount,
      columnCount: template.columnCount,
      templateId: template.id,
      sourceSheetId: sourceSheetId || null,
      isPublic: false
    });

    // Создаем связь создателя с таблицей
    await UserSheet.create({
      userId,
      sheetId: sheet.id,
      permission: 'admin'
    });

    // Создаем ячейки из структуры шаблона
    const structure = template.structure;
    const cellsToCreate = [];

    // Создаем заголовки
    if (structure.headers && Array.isArray(structure.headers)) {
      for (const header of structure.headers) {
        cellsToCreate.push({
          sheetId: sheet.id,
          row: header.row,
          column: header.column,
          value: header.value,
          format: header.format || null
        });
      }
    }

    // Добавляем стандартные границы для шаблона "Отчет заселения/выселения"
    if (template.name?.includes('Отчет заселения/выселения')) {
      console.log('🎨 Добавление стандартных границ для отчета заселения/выселения');
      
      // Жирная левая граница для столбца C (2) - начало секции "Выселение"
      // Жирная левая граница для столбца G (6) - начало секции "Заселение"
      const standardBorder = {
        style: 'solid',
        width: 1,
        color: '#e0e0e0'
      };
      
      const thickLeftBorder = {
        style: 'solid',
        width: 2,
        color: '#000000'
      };

      // Применяем границы ко всем строкам столбцов C и G
      const maxRows = template.rowCount || 30;
      for (let row = 0; row < maxRows; row++) {
        // Проверяем существуют ли уже ячейки в столбцах C (2) и G (6)
        const existingCellC = cellsToCreate.find(cell => cell.row === row && cell.column === 2);
        const existingCellG = cellsToCreate.find(cell => cell.row === row && cell.column === 6);
        
        // Столбец C (2) - левая граница для секции "Выселение"
        if (existingCellC) {
          // Объединяем форматирование с существующей ячейкой
          existingCellC.format = {
            ...existingCellC.format,
            borders: {
              top: standardBorder,
              right: standardBorder,
              bottom: standardBorder,
              left: thickLeftBorder, // Жирная левая граница
              ...existingCellC.format?.borders
            }
          };
        } else {
          // Создаем новую ячейку с границами
          cellsToCreate.push({
            sheetId: sheet.id,
            row: row,
            column: 2,
            value: '',
            format: { 
              borders: {
                top: standardBorder,
                right: standardBorder,
                bottom: standardBorder,
                left: thickLeftBorder // Жирная левая граница
              }
            }
          });
        }
        
        // Столбец G (6) - левая граница для секции "Заселение"
        if (existingCellG) {
          // Объединяем форматирование с существующей ячейкой
          existingCellG.format = {
            ...existingCellG.format,
            borders: {
              top: standardBorder,
              right: standardBorder,
              bottom: standardBorder,
              left: thickLeftBorder, // Жирная левая граница
              ...existingCellG.format?.borders
            }
          };
        } else {
          // Создаем новую ячейку с границами
          cellsToCreate.push({
            sheetId: sheet.id,
            row: row,
            column: 6,
            value: '',
            format: { 
              borders: {
                top: standardBorder,
                right: standardBorder,
                bottom: standardBorder,
                left: thickLeftBorder // Жирная левая граница
              }
            }
          });
        }
      }
    }

    // Добавляем примеры данных только если не связанная таблица
    if (!sourceSheetId && structure.sampleData && Array.isArray(structure.sampleData)) {
      for (const sample of structure.sampleData) {
        cellsToCreate.push({
          sheetId: sheet.id,
          row: sample.row,
          column: sample.column,
          value: sample.value,
          format: sample.format || null
        });
      }
    }

    // Создаем все ячейки одним запросом
    if (cellsToCreate.length > 0) {
      await Cell.bulkCreate(cellsToCreate);
    }

    // Создаем связи с журналами
    const sourcesToLink = sourceSheetIds && Array.isArray(sourceSheetIds) ? sourceSheetIds : (sourceSheetId ? [sourceSheetId] : []);
    
    if (sourcesToLink.length > 0) {
      // Создаем записи в таблице report_sources
      const reportSources = sourcesToLink.map(sourceId => ({
        reportSheetId: sheet.id,
        sourceSheetId: sourceId
      }));
      
      await ReportSource.bulkCreate(reportSources);
      
      // Синхронизируем данные со всеми связанными журналами
      await syncLinkedSheetDataFromMultipleSources(sheet.id);
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

// Синхронизация данных связанной таблицы с несколькими источниками
export const syncLinkedSheetDataFromMultipleSources = async (reportSheetId: number, targetDate?: string) => {
  try {
    // Получаем все связанные журналы для данного отчета
    const reportSources = await ReportSource.findAll({
      where: { reportSheetId },
      include: [
        {
          model: Sheet,
          as: 'sourceSheet',
          attributes: ['id', 'name']
        }
      ]
    });

    if (reportSources.length === 0) {
      console.log('📅 Нет связанных журналов для отчета', reportSheetId);
      return true;
    }

    // Получаем информацию о таблице отчета
    const reportSheet = await Sheet.findByPk(reportSheetId);
    if (!reportSheet) {
      throw new Error('Таблица отчета не найдена');
    }

    // Используем дату из параметра или из настроек таблицы отчета
    const reportDate = targetDate || reportSheet.reportDate;
    
    if (!reportDate) {
      console.log('📅 Дата отчета не указана, синхронизация отменена');
      return true;
    }

    // Собираем данные из всех связанных журналов
    let allFilteredData: any[] = [];
    
    for (const reportSource of reportSources) {
      const sourceSheet = (reportSource as any).sourceSheet;
      console.log(`📊 Синхронизация с журналом ${sourceSheet?.name || 'Неизвестно'} (ID: ${reportSource.sourceSheetId})`);
      
      // Получаем данные из конкретного журнала
      const sourceCells = await Cell.findAll({
        where: { sheetId: reportSource.sourceSheetId },
        order: [['row', 'ASC'], ['column', 'ASC']]
      });

      // Фильтруем данные журнала по дате отчета с сохранением информации о источнике
      const filteredData = filterJournalDataByReportDate(sourceCells, reportDate);
      
      // Добавляем информацию об источнике к каждой ячейке
      const dataWithSource = filteredData.map(cell => ({
        ...cell,
        sourceSheetId: reportSource.sourceSheetId,
        sourceSheetName: sourceSheet?.name
      }));
      
      allFilteredData = allFilteredData.concat(dataWithSource);
    }

    // Преобразуем все данные в формат отчета
    const reportCells = await transformJournalToReport(allFilteredData, reportSheetId, reportDate);

    // Сохраняем форматирование столбцов перед очисткой данных
    const columnFormats: any = {};
    
    // Получаем все ячейки с форматированием столбцов (только где есть format и нет конкретного значения или значение пустое)
    const existingFormattedCells = await Cell.findAll({
      where: {
        sheetId: reportSheetId,
        format: { [Op.ne]: null }
      }
    });

    // Сохраняем форматирование столбцов (ячейки без значения или с заголовками)
    existingFormattedCells.forEach(cell => {
      if (cell.row <= 1 || !cell.value || cell.value === '') {
        const key = `${cell.row}-${cell.column}`;
        columnFormats[key] = {
          row: cell.row,
          column: cell.column,
          format: cell.format,
          value: cell.value || '',
          isLocked: cell.isLocked
        };
      }
    });

    // Очищаем старые данные отчета (кроме заголовков - строки 0 и 1)
    await Cell.destroy({
      where: {
        sheetId: reportSheetId,
        row: { [Op.gt]: 1 } // Удаляем все кроме строк заголовков
      }
    });

    // Восстанавливаем форматирование столбцов
    const cellsToRestore = [];
    Object.values(columnFormats).forEach((cellData: any) => {
      if (cellData.row > 1) { // Только для ячеек форматирования столбцов
        cellsToRestore.push({
          sheetId: reportSheetId,
          row: cellData.row,
          column: cellData.column,
          value: cellData.value,
          format: cellData.format,
          isLocked: cellData.isLocked || false
        });
      }
    });

    if (cellsToRestore.length > 0) {
      await Cell.bulkCreate(cellsToRestore);
      console.log(`🎨 Восстановлено ${cellsToRestore.length} ячеек с форматированием столбцов`);
    }

    // Обновляем дату отчета в ячейке A1 (row=0, column=0)
    const reportDateCell = await Cell.findOne({
      where: { sheetId: reportSheetId, row: 0, column: 0 }
    });

    if (reportDateCell) {
      await reportDateCell.update({ value: reportDate });
    } else {
      await Cell.create({
        sheetId: reportSheetId,
        row: 0,
        column: 0,
        value: reportDate,
        format: { fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }
      });
    }

    // Создаем новые ячейки отчета
    if (reportCells.length > 0) {
      // Преобразуем массив ячеек для upsert
      const cellsForUpsert = reportCells.map(cell => ({
        ...cell,
        uniqueKey: `${cell.sheetId}-${cell.row}-${cell.column}`
      }));

      // Используем bulkCreate с опцией updateOnDuplicate
      await Cell.bulkCreate(cellsForUpsert, {
        updateOnDuplicate: ['value', 'formula', 'format', 'isLocked', 'updatedAt'],
        fields: ['sheetId', 'row', 'column', 'value', 'formula', 'format', 'isLocked'],
      });
    }

    // Обновляем поле reportDate в модели Sheet
    await reportSheet.update({ reportDate });

    console.log(`✅ Синхронизация отчета ${reportSheetId} с ${reportSources.length} журналами на дату ${reportDate} завершена`);
    return true;
  } catch (error) {
    console.error('Ошибка синхронизации связанной таблицы с несколькими источниками:', error);
    throw error;
  }
};

// Синхронизация данных связанной таблицы (старая функция для совместимости)
export const syncLinkedSheetData = async (reportSheetId: number, sourceSheetId: number, targetDate?: string) => {
  try {
    // Получаем информацию о таблице отчета
    const reportSheet = await Sheet.findByPk(reportSheetId);
    if (!reportSheet) {
      throw new Error('Таблица отчета не найдена');
    }

    // Используем дату из параметра или из настроек таблицы отчета
    const reportDate = targetDate || reportSheet.reportDate;
    
    if (!reportDate) {
      console.log('📅 Дата отчета не указана, синхронизация отменена');
      return true;
    }

    // Получаем данные из журнала заселения
    const sourceCells = await Cell.findAll({
      where: { sheetId: sourceSheetId },
      order: [['row', 'ASC'], ['column', 'ASC']]
    });

    // Фильтруем данные журнала по дате отчета
    const filteredData = filterJournalDataByReportDate(sourceCells, reportDate);

    // Преобразуем данные в формат отчета
    const reportCells = await transformJournalToReport(filteredData, reportSheetId, reportDate);

    // Сохраняем форматирование столбцов перед очисткой данных
    const columnFormats: any = {};
    
    // Получаем все ячейки с форматированием столбцов (только где есть format и нет конкретного значения или значение пустое)
    const existingFormattedCells = await Cell.findAll({
      where: {
        sheetId: reportSheetId,
        format: { [Op.ne]: null }
      }
    });

    // Сохраняем форматирование столбцов (ячейки без значения или с заголовками)
    existingFormattedCells.forEach(cell => {
      if (cell.row <= 1 || !cell.value || cell.value === '') {
        const key = `${cell.row}-${cell.column}`;
        columnFormats[key] = {
          row: cell.row,
          column: cell.column,
          format: cell.format,
          value: cell.value || '',
          isLocked: cell.isLocked
        };
      }
    });

    // Очищаем старые данные отчета (кроме заголовков - строки 0 и 1)
    await Cell.destroy({
      where: {
        sheetId: reportSheetId,
        row: { [Op.gt]: 1 } // Удаляем все кроме строк заголовков
      }
    });

    // Восстанавливаем форматирование столбцов
    const cellsToRestore = [];
    Object.values(columnFormats).forEach((cellData: any) => {
      if (cellData.row > 1) { // Только для ячеек форматирования столбцов
        cellsToRestore.push({
          sheetId: reportSheetId,
          row: cellData.row,
          column: cellData.column,
          value: cellData.value,
          format: cellData.format,
          isLocked: cellData.isLocked || false
        });
      }
    });

    if (cellsToRestore.length > 0) {
      await Cell.bulkCreate(cellsToRestore);
      console.log(`🎨 Восстановлено ${cellsToRestore.length} ячеек с форматированием столбцов`);
    }

    // Обновляем дату отчета в ячейке A1 (row=0, column=0)
    const reportDateCell = await Cell.findOne({
      where: { sheetId: reportSheetId, row: 0, column: 0 }
    });

    if (reportDateCell) {
      await reportDateCell.update({ value: reportDate });
    } else {
      await Cell.create({
        sheetId: reportSheetId,
        row: 0,
        column: 0,
        value: reportDate,
        format: { fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }
      });
    }

    // Создаем новые ячейки отчета
    if (reportCells.length > 0) {
      // Преобразуем массив ячеек для upsert
      const cellsForUpsert = reportCells.map(cell => ({
        ...cell,
        uniqueKey: `${cell.sheetId}-${cell.row}-${cell.column}`
      }));

      // Используем bulkCreate с опцией updateOnDuplicate
      await Cell.bulkCreate(cellsForUpsert, {
        updateOnDuplicate: ['value', 'formula', 'format', 'isLocked', 'updatedAt'],
        fields: ['sheetId', 'row', 'column', 'value', 'formula', 'format', 'isLocked'],
      });
    }

    // Обновляем поле reportDate в модели Sheet
    await reportSheet.update({ reportDate });

    console.log(`✅ Синхронизация отчета ${reportSheetId} с журналом ${sourceSheetId} на дату ${reportDate} завершена`);
    return true;
  } catch (error) {
    console.error('Ошибка синхронизации связанной таблицы:', error);
    throw error;
  }
};

// Фильтрация данных журнала по дате отчета
const filterJournalDataByReportDate = (cells: any[], reportDate: string) => {
  // Группируем ячейки по строкам
  const rowsData: any = {};
  cells.forEach(cell => {
    if (cell.row === 0) return; // Пропускаем заголовки
    
    if (!rowsData[cell.row]) {
      rowsData[cell.row] = {};
    }
    rowsData[cell.row][cell.column] = cell;
  });

  const filteredRows: any[] = [];
  
  // Определяем тип операции для данной даты отчета
  const convertToISO = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    
    const cleanDate = dateStr.trim();
    const match = cleanDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    
    if (match) {
      const [, day, month, year] = match;
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    return '';
  };
  
  // Проверяем каждую строку на соответствие дате отчета
  Object.keys(rowsData).forEach(rowIndex => {
    const row = rowsData[rowIndex];
    const checkinDate = row[1]?.value; // Колонка 1: "Дата заселения"
    const checkoutDate = row[3]?.value; // Колонка 3: "Дата выселения"

    const isoCheckin = convertToISO(checkinDate);
    const isoCheckout = convertToISO(checkoutDate);
    const isoReportDate = reportDate; // reportDate уже в формате YYYY-MM-DD

    console.log(`🔍 Проверка записи: заселение="${checkinDate}" -> "${isoCheckin}", выселение="${checkoutDate}" -> "${isoCheckout}", дата отчета="${isoReportDate}"`);

    // Включаем строку если дата заселения или выселения совпадает с датой отчета
    if (isoCheckin === isoReportDate || isoCheckout === isoReportDate) {
      console.log(`✅ Найдена подходящая запись для даты ${isoReportDate}`);
      // Сохраняем все ячейки строки с правильными индексами
      Object.keys(row).forEach(colIndex => {
        const cell = row[colIndex];
        if (cell) {
          console.log(`🔧 Копирование ячейки [${rowIndex},${colIndex}]: исходное value="${cell.value}"`);
          const copiedCell = {
            ...cell,
            row: parseInt(rowIndex),
            column: parseInt(colIndex),
            value: cell.value // Явно сохраняем значение
          };
          console.log(`🔧 Скопированная ячейка: value="${copiedCell.value}"`);
          filteredRows.push(copiedCell);
        }
      });
    }
  });

  return filteredRows;
};

// Преобразование данных журнала в формат отчета
const transformJournalToReport = async (journalCells: any[], reportSheetId: number, reportDate: string) => {
  const reportCells: any[] = [];
  
  console.log(`🔧 transformJournalToReport: получено ${journalCells.length} ячеек для обработки`);
  
  // Группируем ячейки по строкам с учетом источника (чтобы избежать перезаписи данных из разных журналов)
  const rowsData: any = {};
  journalCells.forEach(cell => {
    // Создаем уникальный ключ: sourceSheetId:row для избежания конфликтов
    const uniqueRowKey = `${cell.sourceSheetId}:${cell.row}`;
    if (!rowsData[uniqueRowKey]) {
      rowsData[uniqueRowKey] = {};
    }
    rowsData[uniqueRowKey][cell.column] = cell;
  });
  
  console.log(`🔧 transformJournalToReport: сгруппировано в ${Object.keys(rowsData).length} строк`);

  // Функция преобразования даты
  const convertToISO = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    
    const cleanDate = dateStr.trim();
    const match = cleanDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    
    if (match) {
      const [, day, month, year] = match;
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    return '';
  };

  // Получаем все связанные журналы для определения адресов
  const getJournalNamesForAddresses = async () => {
    try {
      const addressMap: { [key: string]: string } = {};
      
      // Получаем все связанные журналы для данного отчета
      const reportSources = await ReportSource.findAll({
        where: { reportSheetId },
        include: [
          {
            model: Sheet,
            as: 'sourceSheet',
            attributes: ['id', 'name']
          }
        ]
      });

      for (const reportSource of reportSources) {
                  const sourceSheet = (reportSource as any).sourceSheet;
          if (sourceSheet?.name) {
            // Используем полное название журнала как адрес таблицы-источника
            addressMap[reportSource.sourceSheetId] = sourceSheet.name;
          }
      }

      return addressMap;
    } catch (error) {
      console.error('Ошибка получения названий журналов:', error);
      return {};
    }
  };

  // Получаем карту соответствия ID журнала -> адрес
  const journalAddressMap = await getJournalNamesForAddresses();

  // Группируем данные по уникальной комбинации: название журнала + ФИО гостя
  // Это позволит отображать отдельные строки для записей из разных журналов
  const addressGroups: any = {};

  // Собираем все релевантные записи
  Object.keys(rowsData).forEach(uniqueRowKey => {
    const row = rowsData[uniqueRowKey];
    
    console.log(`🔧 Анализ строки ${uniqueRowKey}:`);
    console.log(`🔧   - Количество ячеек в строке: ${Object.keys(row).length}`);
    Object.keys(row).slice(0, 2).forEach(colIndex => {
      const cell = row[colIndex];
      console.log(`🔧   - Ячейка [${uniqueRowKey},${colIndex}]: value="${cell?.value}", sourceSheetId=${cell?.sourceSheetId}, sourceSheetName="${cell?.sourceSheetName}"`);
    });
    
    // Определяем ID журнала для этой строки из сохраненной информации об источнике
    const sourceSheetId = row[0]?.sourceSheetId || row[1]?.sourceSheetId; // Берем sourceSheetId из любой ячейки строки
    const sourceSheetName = row[0]?.sourceSheetName || row[1]?.sourceSheetName; // Берем название из сохраненной информации
    const tableName = sourceSheetName || journalAddressMap[sourceSheetId] || 'Не указан';
    
    console.log(`🔧 Результат: sourceSheetId=${sourceSheetId}, sourceSheetName="${sourceSheetName}", tableName="${tableName}"`);
    
    // Извлекаем данные из журнала согласно его структуре
    const month = row[0]?.value || ''; // Месяц
    const checkinDate = row[1]?.value || ''; // Дата заселения
    const dayCount = row[2]?.value || ''; // Кол-во дней
    const checkoutDate = row[3]?.value || ''; // Дата выселения
    const guestName = row[4]?.value || ''; // ФИО
    const phone = row[5]?.value || ''; // Телефон
    const totalAmount = row[6]?.value || ''; // Общая сумма проживания
    const prepayment = row[7]?.value || ''; // Предоплата (сумма аванса)
    const additionalPayment = row[8]?.value || ''; // Доплата за проживание в день заселения
    const houseStatus = row[9]?.value || ''; // Статус дома
    const source = row[10]?.value || ''; // Источник
    const comment = row[11]?.value || ''; // Комментарий по оплате и проживанию
    const dayComments = row[12]?.value || ''; // Комментарии по оплате и проживанию в день заселения

    const isCheckout = convertToISO(checkoutDate) === reportDate;
    const isCheckin = convertToISO(checkinDate) === reportDate;

    if (isCheckout || isCheckin) {
      // Создаем уникальный ключ для группировки: ID источника + название таблицы + дата отчета
      // Это позволит объединить выселение и заселение из одного журнала на одну дату в одну строку
      const uniqueKey = `${sourceSheetId}:${tableName}:${reportDate}`;
      
      console.log(`🔍 Обработка записи: источник="${tableName}" (ID: ${sourceSheetId}), гость="${guestName}", заселение="${isCheckin}", выселение="${isCheckout}"`);
      
      if (!addressGroups[uniqueKey]) {
        addressGroups[uniqueKey] = {
          address: tableName, // Теперь адрес = название таблицы
          houseStatus: '',
          checkout: null,
          checkin: null
        };
      }

      if (isCheckout) {
        // Если уже есть данные о выселении, объединяем информацию (может быть несколько выселений)
        if (addressGroups[uniqueKey].checkout) {
          // Объединяем данные о нескольких выселениях
          addressGroups[uniqueKey].checkout.guestName += `, ${guestName}`;
          addressGroups[uniqueKey].checkout.phone += `, ${phone}`;
          addressGroups[uniqueKey].checkout.comment += `; ${comment}`;
        } else {
          addressGroups[uniqueKey].checkout = {
            guestName,
            phone,
            comment
          };
        }
      }

      if (isCheckin) {
        // Если уже есть данные о заселении, объединяем информацию (может быть несколько заселений)
        if (addressGroups[uniqueKey].checkin) {
          // Объединяем данные о нескольких заселениях
          addressGroups[uniqueKey].checkin.guestName += `, ${guestName}`;
          addressGroups[uniqueKey].checkin.phone += `, ${phone}`;
          addressGroups[uniqueKey].checkin.comment += `; ${comment}`;
          if (dayComments) {
            addressGroups[uniqueKey].checkin.dayComments += `; ${dayComments}`;
          }
          // Для числовых полей берем первое значение или суммируем
          if (totalAmount && !isNaN(parseFloat(totalAmount.toString().replace(/\s/g, '')))) {
            const currentTotal = parseFloat(addressGroups[uniqueKey].checkin.totalAmount?.toString().replace(/\s/g, '') || '0');
            const newTotal = parseFloat(totalAmount.toString().replace(/\s/g, ''));
            addressGroups[uniqueKey].checkin.totalAmount = (currentTotal + newTotal).toLocaleString();
          }
        } else {
          addressGroups[uniqueKey].checkin = {
            guestName,
            phone,
            checkoutDate,
            dayCount,
            totalAmount,
            prepayment,
            additionalPayment,
            comment,
            dayComments
          };
        }
      }

      // Определяем статус дома на основе наличия операций
      if (addressGroups[uniqueKey].checkout && addressGroups[uniqueKey].checkin) {
        addressGroups[uniqueKey].houseStatus = 'Выс/Зас'; // И выселение и заселение
      } else if (addressGroups[uniqueKey].checkout) {
        addressGroups[uniqueKey].houseStatus = 'Выселение';
      } else if (addressGroups[uniqueKey].checkin) {
        addressGroups[uniqueKey].houseStatus = 'Заселение';
      }
    }
  });

  // Создаем ячейки отчета - по одной строке на адрес
  let currentReportRow = 2; // Начинаем с 2 строки (0 - дата отчета, 1 - заголовки)
  
  Object.values(addressGroups).forEach((group: any) => {
    // Колонка 0: Адрес
    reportCells.push({
      sheetId: reportSheetId,
      row: currentReportRow,
      column: 0,
      value: group.address
    });

    // Колонка 1: Статус дома
    reportCells.push({
      sheetId: reportSheetId,
      row: currentReportRow,
      column: 1,
      value: group.houseStatus
    });

    // Секция ВЫСЕЛЕНИЕ (колонки 2-5)
    if (group.checkout) {
      reportCells.push(
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 2, // ФИО выселяющегося
          value: group.checkout.guestName
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 3, // Телефон выселяющегося  
          value: group.checkout.phone
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 4, // Комментарий из журнала заселения
          value: group.checkout.comment
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 5, // Время выселения (заполняется вручную)
          value: ''
        }
      );
    } else {
      // Пустые ячейки для выселения
      for (let col = 2; col <= 5; col++) {
        reportCells.push({
          sheetId: reportSheetId,
          row: currentReportRow,
          column: col,
          value: ''
        });
      }
    }

    // Секция ЗАСЕЛЕНИЕ (колонки 6-15)
    if (group.checkin) {
      reportCells.push(
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 6, // ФИО заселяющегося
          value: group.checkin.guestName
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 7, // Телефон заселяющегося
          value: group.checkin.phone
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 8, // Время заселения (заполняется вручную)
          value: ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 9, // Дата выселения
          value: group.checkin.checkoutDate
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 10, // Кол-во дней
          value: group.checkin.dayCount
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 11, // Общая сумма проживания
          value: group.checkin.totalAmount
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 12, // Предоплата (сумма аванса)
          value: group.checkin.prepayment
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 13, // Доплата за проживание в день заселения
          value: group.checkin.additionalPayment
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 14, // Комментарий из журнала заселения
          value: group.checkin.comment
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 15, // Примечания
          value: ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 16, // Комментарии по оплате и проживанию в день заселения
          value: group.checkin.dayComments || ''
        }
      );
    } else {
      // Пустые ячейки для заселения
      for (let col = 6; col <= 16; col++) {
        reportCells.push({
          sheetId: reportSheetId,
          row: currentReportRow,
          column: col,
          value: ''
        });
      }
    }

    currentReportRow++;
  });

  console.log(`📊 Создано ${reportCells.length} ячеек для отчета на дату ${reportDate} (${Object.keys(addressGroups).length} адресов)`);
  return reportCells;
};

// Обновление связанных отчетов при изменении журнала
export const updateLinkedReports = async (sourceSheetId: number) => {
  try {
    // Находим все отчеты, связанные с данным журналом через report_sources
    const reportSources = await ReportSource.findAll({
      where: { sourceSheetId: sourceSheetId }
    });

    // Синхронизируем каждый отчет
    for (const reportSource of reportSources) {
      await syncLinkedSheetDataFromMultipleSources(reportSource.reportSheetId);
    }

    // Также обрабатываем старые связи через sourceSheetId (для совместимости)
    const linkedReports = await Sheet.findAll({
      where: { sourceSheetId: sourceSheetId }
    });

    for (const report of linkedReports) {
      await syncLinkedSheetData(report.id, sourceSheetId);
    }

    return reportSources.length + linkedReports.length;
  } catch (error) {
    console.error('Ошибка обновления связанных отчетов:', error);
    throw error;
  }
};

// Обновление даты отчета
export const updateReportDate = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;
    const { reportDate } = req.body;

    console.log('📋 Template route: PUT /update-report-date/' + sheetId);
    console.log('📋 Headers:', req.headers.authorization ? 'Authorization present' : 'No authorization');
    console.log('📋 Body:', req.body);

    // Находим таблицу отчета
    const reportSheet = await Sheet.findByPk(sheetId);
    if (!reportSheet) {
      return res.status(404).json({
        error: 'Таблица отчета не найдена'
      });
    }

    // Обновляем дату отчета
    await reportSheet.update({ reportDate });

    // Синхронизируем данные с новой датой - используем новую функцию для множественных источников
    await syncLinkedSheetDataFromMultipleSources(parseInt(sheetId), reportDate);

    res.json({
      message: 'Дата отчета успешно обновлена',
      reportDate
    });

  } catch (error) {
    console.error('Ошибка обновления даты отчета:', error);
    res.status(500).json({
      error: 'Ошибка сервера при обновлении даты отчета'
    });
  }
};

// Получение связанных журналов для отчета
export const getReportSources = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;

    const reportSources = await ReportSource.findAll({
      where: { reportSheetId: sheetId },
      include: [
        {
          model: Sheet,
          as: 'sourceSheet',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.json({
      message: 'Связанные журналы успешно получены',
      sources: reportSources
    });

  } catch (error) {
    console.error('Ошибка получения связанных журналов:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении связанных журналов'
    });
  }
};

// Добавление связи журнала с отчетом
export const addReportSource = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;
    const { sourceSheetId } = req.body;

    // Проверяем что таблицы существуют
    const reportSheet = await Sheet.findByPk(sheetId);
    const sourceSheet = await Sheet.findByPk(sourceSheetId);

    if (!reportSheet || !sourceSheet) {
      return res.status(404).json({
        error: 'Одна из таблиц не найдена'
      });
    }

    // Создаем связь (если не существует)
    const [reportSource, created] = await ReportSource.findOrCreate({
      where: { reportSheetId: parseInt(sheetId), sourceSheetId: parseInt(sourceSheetId) },
      defaults: { reportSheetId: parseInt(sheetId), sourceSheetId: parseInt(sourceSheetId) }
    });

    if (!created) {
      return res.status(400).json({
        error: 'Связь уже существует'
      });
    }

    // Синхронизируем данные
    await syncLinkedSheetDataFromMultipleSources(parseInt(sheetId));

    res.status(201).json({
      message: 'Журнал успешно добавлен к отчету',
      reportSource
    });

  } catch (error) {
    console.error('Ошибка добавления журнала к отчету:', error);
    res.status(500).json({
      error: 'Ошибка сервера при добавлении журнала к отчету'
    });
  }
};

// Удаление связи журнала с отчетом
export const removeReportSource = async (req: Request, res: Response) => {
  try {
    const { sheetId, sourceSheetId } = req.params;

    const deletedCount = await ReportSource.destroy({
      where: { reportSheetId: parseInt(sheetId), sourceSheetId: parseInt(sourceSheetId) }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        error: 'Связь не найдена'
      });
    }

    // Синхронизируем данные после удаления связи
    await syncLinkedSheetDataFromMultipleSources(parseInt(sheetId));

    res.json({
      message: 'Журнал успешно отвязан от отчета'
    });

  } catch (error) {
    console.error('Ошибка удаления связи журнала с отчетом:', error);
    res.status(500).json({
      error: 'Ошибка сервера при удалении связи журнала с отчетом'
    });
  }
}; 