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

    // Очищаем старые данные отчета (кроме заголовков - строки 0 и 1)
    await Cell.destroy({
      where: {
        sheetId: reportSheetId,
        row: { [require('sequelize').Op.gt]: 1 } // Удаляем все кроме строк заголовков
      }
    });

    // Обновляем дату отчета в ячейке B1 (row=0, column=1)
    const reportDateCell = await Cell.findOne({
      where: { sheetId: reportSheetId, row: 0, column: 1 }
    });

    if (reportDateCell) {
      await reportDateCell.update({ value: reportDate });
    } else {
      await Cell.create({
        sheetId: reportSheetId,
        row: 0,
        column: 1,
        value: reportDate,
        format: { fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }
      });
    }

    // Создаем новые ячейки отчета
    if (reportCells.length > 0) {
      await Cell.bulkCreate(reportCells);
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
      Object.values(row).forEach((cell: any) => filteredRows.push(cell));
    }
  });

  return filteredRows;
};

// Преобразование данных журнала в формат отчета
const transformJournalToReport = async (journalCells: any[], reportSheetId: number, reportDate: string) => {
  const reportCells: any[] = [];
  
  // Группируем ячейки по строкам
  const rowsData: any = {};
  journalCells.forEach(cell => {
    if (!rowsData[cell.row]) {
      rowsData[cell.row] = {};
    }
    rowsData[cell.row][cell.column] = cell;
  });

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

  // Сначала получаем название журнала (адрес) для отчета
  const getJournalNameForAddress = async () => {
    try {
      // Получаем исходный журнал для определения адреса
      const reportSheet = await Sheet.findByPk(reportSheetId);
      if (reportSheet?.sourceSheetId) {
        const sourceSheet = await Sheet.findByPk(reportSheet.sourceSheetId);
        if (sourceSheet?.name) {
          // Извлекаем адрес из названия журнала (например "Журнал заселения DMD Cottage" -> "DMD Cottage")
          const addressMatch = sourceSheet.name.match(/Журнал заселения (.+)/);
          return addressMatch ? addressMatch[1] : sourceSheet.name;
        }
      }
      return 'Не указан';
    } catch (error) {
      console.error('Ошибка получения названия журнала:', error);
      return 'Не указан';
    }
  };

  // Получаем адрес синхронно в контексте этой функции
  const address = await getJournalNameForAddress();

  // Группируем данные по адресам для объединения выселения и заселения
  const addressGroups: any = {};

  // Собираем все релевантные записи
  Object.keys(rowsData).forEach(rowIndex => {
    const row = rowsData[rowIndex];
    
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

    const isCheckout = convertToISO(checkoutDate) === reportDate;
    const isCheckin = convertToISO(checkinDate) === reportDate;

    if (isCheckout || isCheckin) {
      // Используем динамический адрес из названия журнала
      if (!addressGroups[address]) {
        addressGroups[address] = {
          address,
          houseStatus: '',
          checkout: null,
          checkin: null
        };
      }

      if (isCheckout) {
        addressGroups[address].checkout = {
          guestName,
          phone,
          comment
        };
      }

      if (isCheckin) {
        addressGroups[address].checkin = {
          guestName,
          phone,
          checkoutDate,
          dayCount,
          totalAmount,
          prepayment,
          additionalPayment,
          comment
        };
      }

      // Определяем статус дома на основе наличия операций
      if (addressGroups[address].checkout && addressGroups[address].checkin) {
        addressGroups[address].houseStatus = 'Выс/Зас'; // И выселение и заселение
      } else if (addressGroups[address].checkout) {
        addressGroups[address].houseStatus = 'Выселение';
      } else if (addressGroups[address].checkin) {
        addressGroups[address].houseStatus = 'Заселение';
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
          column: 15, // Комментарии по оплате и проживанию в день заселения
          value: '' // Заполняется вручную
        }
      );
    } else {
      // Пустые ячейки для заселения
      for (let col = 6; col <= 15; col++) {
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