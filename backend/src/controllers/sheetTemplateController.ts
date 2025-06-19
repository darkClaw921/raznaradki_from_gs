import { Request, Response } from 'express';
import { SheetTemplate, Sheet, UserSheet, Cell } from '../models';

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
    const { name, description, sourceSheetId } = req.body;
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

    // Если это связанная таблица, синхронизируем данные
    if (sourceSheetId) {
      await syncLinkedSheetData(sheet.id, sourceSheetId);
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

// Синхронизация данных связанной таблицы
export const syncLinkedSheetData = async (reportSheetId: number, sourceSheetId: number, targetDate?: string) => {
  try {
    // Получаем данные из журнала заселения
    const sourceCells = await Cell.findAll({
      where: { sheetId: sourceSheetId },
      order: [['row', 'ASC'], ['column', 'ASC']]
    });

    // Если указана дата, фильтруем данные
    const filteredData = filterJournalDataByDate(sourceCells, targetDate);

    // Преобразуем данные в формат отчета
    const reportCells = transformJournalToReport(filteredData, reportSheetId, targetDate);

    // Очищаем старые данные отчета (кроме заголовков)
    await Cell.destroy({
      where: {
        sheetId: reportSheetId,
        row: { [require('sequelize').Op.gt]: 0 } // Удаляем все кроме строки заголовков
      }
    });

    // Создаем новые ячейки отчета
    if (reportCells.length > 0) {
      await Cell.bulkCreate(reportCells);
    }

    return true;
  } catch (error) {
    console.error('Ошибка синхронизации связанной таблицы:', error);
    throw error;
  }
};

// Фильтрация данных журнала по дате
const filterJournalDataByDate = (cells: any[], targetDate?: string) => {
  if (!targetDate) return cells;

  // Группируем ячейки по строкам
  const rowsData: any = {};
  cells.forEach(cell => {
    if (!rowsData[cell.row]) {
      rowsData[cell.row] = {};
    }
    rowsData[cell.row][cell.column] = cell;
  });

  const filteredRows: any[] = [];
  
  // Проверяем каждую строку на соответствие дате
  Object.keys(rowsData).forEach(rowIndex => {
    const row = rowsData[rowIndex];
    const checkinDate = row[1]?.value; // Колонка "Дата заселения"
    const checkoutDate = row[3]?.value; // Колонка "Дата выселения"

    // Включаем строку если дата заселения или выселения совпадает с целевой датой
    if (checkinDate === targetDate || checkoutDate === targetDate) {
      Object.values(row).forEach((cell: any) => filteredRows.push(cell));
    }
  });

  return filteredRows;
};

// Преобразование данных журнала в формат отчета
const transformJournalToReport = (journalCells: any[], reportSheetId: number, targetDate?: string) => {
  const reportCells: any[] = [];
  
  // Группируем ячейки по строкам
  const rowsData: any = {};
  journalCells.forEach(cell => {
    if (!rowsData[cell.row]) {
      rowsData[cell.row] = {};
    }
    rowsData[cell.row][cell.column] = cell;
  });

  let currentReportRow = 1; // Начинаем с 1 строки (0 - заголовки)

  // Обрабатываем каждую строку журнала
  Object.keys(rowsData).forEach(rowIndex => {
    const row = rowsData[rowIndex];
    const checkinDate = row[1]?.value; // Дата заселения
    const checkoutDate = row[3]?.value; // Дата выселения
    const guestName = row[4]?.value; // ФИО
    const phone = row[5]?.value; // Телефон
    const totalAmount = row[6]?.value; // Общая сумма
    const prepayment = row[7]?.value; // Предоплата
    const additionalPayment = row[8]?.value; // Доплата
    const houseStatus = row[9]?.value; // Статус дома
    const comment = row[11]?.value; // Комментарий

    // Заполняем адрес (пока статичный, можно сделать динамическим)
    reportCells.push({
      sheetId: reportSheetId,
      row: currentReportRow,
      column: 0, // Адрес
      value: '29'
    });

    // Определяем тип операции (заселение/выселение)
    const isCheckout = checkoutDate === targetDate;
    const isCheckin = checkinDate === targetDate;

    if (isCheckout) {
      // Данные выселения (колонки 1-5)
      reportCells.push(
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 1, // Статус дома
          value: houseStatus || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 2, // ФИО выселяющегося
          value: guestName || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 3, // Телефон выселяющегося
          value: phone || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 4, // Комментарий из журнала
          value: comment || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 5, // Время выселения
          value: '' // Заполняется вручную
        }
      );
    }

    if (isCheckin) {
      // Данные заселения (колонки 6-15)
      reportCells.push(
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 6, // ФИО заселяющегося
          value: guestName || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 7, // Телефон заселяющегося
          value: phone || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 8, // Время заселения
          value: '' // Заполняется вручную
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 9, // Дата выселения
          value: checkoutDate || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 10, // Кол-во дней
          value: row[2]?.value || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 11, // Общая сумма
          value: totalAmount || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 12, // Предоплата
          value: prepayment || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 13, // Доплата
          value: additionalPayment || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 14, // Комментарий из журнала
          value: comment || ''
        },
        {
          sheetId: reportSheetId,
          row: currentReportRow,
          column: 15, // Комментарии по оплате
          value: '' // Заполняется вручную
        }
      );
    }

    currentReportRow++;
  });

  return reportCells;
};

// Обновление связанных отчетов при изменении журнала
export const updateLinkedReports = async (sourceSheetId: number) => {
  try {
    // Находим все отчеты, связанные с данным журналом
    const linkedReports = await Sheet.findAll({
      where: { sourceSheetId: sourceSheetId }
    });

    // Синхронизируем каждый отчет
    for (const report of linkedReports) {
      await syncLinkedSheetData(report.id, sourceSheetId);
    }

    return linkedReports.length;
  } catch (error) {
    console.error('Ошибка обновления связанных отчетов:', error);
    throw error;
  }
}; 