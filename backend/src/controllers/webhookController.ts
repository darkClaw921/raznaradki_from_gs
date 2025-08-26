import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { WebhookMapping, Sheet, Cell, SystemSettings } from '../models';

// Получение настроек webhook для таблицы
export const getWebhookMapping = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;

    const mapping = await WebhookMapping.findOne({
      where: { sheetId },
      include: [{ model: Sheet, as: 'sheet' }]
    });

    res.json(mapping);
  } catch (error) {
    console.error('Ошибка при получении настроек webhook:', error);
    res.status(500).json({ message: 'Ошибка при получении настроек webhook' });
  }
};

// Создание или обновление настроек webhook для таблицы
export const updateWebhookMapping = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;
    const { apartmentTitles, isActive } = req.body;

    if (!apartmentTitles || !Array.isArray(apartmentTitles)) {
      return res.status(400).json({ message: 'Необходимо указать массив названий апартаментов' });
    }

    // Проверяем существование таблицы
    const sheet = await Sheet.findByPk(sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Таблица не найдена' });
    }

    const apartmentTitlesJson = JSON.stringify(apartmentTitles);

    const [mapping, created] = await WebhookMapping.findOrCreate({
      where: { sheetId },
      defaults: {
        sheetId: parseInt(sheetId),
        apartmentTitles: apartmentTitlesJson,
        isActive: isActive !== false
      }
    });

    if (!created) {
      mapping.apartmentTitles = apartmentTitlesJson;
      mapping.isActive = isActive !== false;
      await mapping.save();
    }

    console.log(`Обновлены настройки webhook для таблицы ${sheetId}`);
    res.json(mapping);
  } catch (error) {
    console.error('Ошибка при обновлении настроек webhook:', error);
    res.status(500).json({ message: 'Ошибка при обновлении настроек webhook' });
  }
};

// Обработка входящего webhook
export const processWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const webhookData = req.body;

    console.log('Получен webhook запрос:', JSON.stringify(webhookData, null, 2));

    // Проверяем, включен ли webhook
    const webhookEnabledSetting = await SystemSettings.findOne({
      where: { key: 'webhook_enabled' }
    });

    if (!webhookEnabledSetting || webhookEnabledSetting.value !== 'true') {
      console.log('Webhook отключен — запрос принят, но не обработан. Возвращаем 200.');
      return res.json({ message: 'Webhook принят, но отключен на сервере' });
    }

    // Проверяем корректность webhook ID
    const webhookSecretSetting = await SystemSettings.findOne({
      where: { key: 'webhook_secret' }
    });

    if (!webhookSecretSetting || webhookSecretSetting.value !== webhookId) {
      console.log('Неверный webhook ID — запрос принят, но не обработан. Возвращаем 200.');
      return res.json({ message: 'Webhook принят, но webhook ID некорректен' });
    }

    // Извлекаем данные бронирования и тип действия
    const webhookInfo = extractWebhookInfo(webhookData);
    if (!webhookInfo) {
      console.log('Некорректные/неподдерживаемые данные webhook — запрос принят. Возвращаем 200.');
      return res.json({ message: 'Webhook принят, но данные не соответствуют ожидаемому формату' });
    }

    const { action, bookingData } = webhookInfo;

    // Находим таблицы в зависимости от типа действия
    let targetSheets = [];
    
    if (action === 'delete_booking') {
      // Для удаления ищем таблицы по booking_id во всех активных таблицах
      targetSheets = await findSheetsByBookingId(bookingData.id);
      console.log(`🔍 Поиск таблиц для удаления бронирования ID ${bookingData.id}`);
    } else {
      // Для создания/обновления ищем по названию апартамента
      targetSheets = await findTargetSheets(bookingData.apartmentTitle);
      console.log(`🔍 Поиск таблиц для апартамента: ${bookingData.apartmentTitle}`);
    }
    
    if (targetSheets.length === 0) {
      if (action === 'delete_booking') {
        console.log(`❌ Не найдено таблиц с бронированием ID ${bookingData.id}`);
        return res.json({ message: 'Данные обработаны, но подходящих таблиц не найдено' });
      } else {
        console.log(`❌ Не найдено таблиц для апартаментов: ${bookingData.apartmentTitle}`);
        return res.json({ message: 'Данные обработаны, но подходящих таблиц не найдено' });
      }
    }

    // Обрабатываем действие в зависимости от типа
    if (action === 'delete_booking') {
      // Удаляем бронирование из каждой подходящей таблицы
      for (const sheet of targetSheets) {
        await deleteBookingFromSheet(sheet, bookingData);
      }
      console.log(`🗑️ Бронирование удалено из ${targetSheets.length} таблиц`);
    } else {
      // Добавляем или обновляем данные бронирования в каждую подходящую таблицу
      for (const sheet of targetSheets) {
        await addBookingToSheet(sheet, bookingData);
      }
      console.log(`✅ Данные бронирования добавлены в ${targetSheets.length} таблиц`);
    }

    res.json({ 
      message: 'Данные успешно обработаны', 
      action: action,
      processedSheets: targetSheets.length 
    });

  } catch (error) {
    console.error('Ошибка при обработке webhook:', error);
    res.json({ message: 'Webhook принят, но при обработке произошла ошибка' });
  }
};

// Извлечение информации о webhook (действие и данные бронирования)
function extractWebhookInfo(webhookData: any) {
  try {
    console.log('🔍 Анализ структуры webhookData:', {
      isArray: Array.isArray(webhookData),
      length: Array.isArray(webhookData) ? webhookData.length : 'не массив',
      hasData: webhookData?.data ? 'есть data' : 'нет data',
      firstElement: Array.isArray(webhookData) && webhookData.length > 0 ? 'есть первый элемент' : 'нет первого элемента'
    });

    let webhookSource;
    let action = 'create_or_update'; // По умолчанию
    
    // Проверяем, приходят ли данные в виде массива (как в логах)
    if (Array.isArray(webhookData) && webhookData.length > 0) {
      // Данные в формате массива - берем первый элемент и его body
      const firstElement = webhookData[0];
      if (firstElement?.body?.data?.booking) {
        webhookSource = firstElement.body.data.booking;
        action = firstElement.body.action || 'create_or_update';
        console.log('✅ Найдены данные бронирования в массиве: webhookData[0].body.data.booking');
      }
    } else if (webhookData?.data?.booking) {
      // Данные в прямом формате объекта
      webhookSource = webhookData.data.booking;
      action = webhookData.action || 'create_or_update';
      console.log('✅ Найдены данные бронирования в объекте: webhookData.data.booking');
    }

    if (!webhookSource) {
      console.log('❌ Данные бронирования не найдены в webhook');
      return null;
    }

    console.log('📋 Извлеченные поля бронирования:', {
      action: action,
      apartment_title: webhookSource.apartment?.title,
      begin_date: webhookSource.begin_date,
      end_date: webhookSource.end_date,
      client_fio: webhookSource.client?.fio,
      client_phone: webhookSource.client?.phone,
      amount: webhookSource.amount,
      source: webhookSource.source
    });
    
    // Вычисляем количество дней
    const beginDate = new Date(webhookSource.begin_date);
    const endDate = new Date(webhookSource.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24));

    const extractedData = {
      id: webhookSource.id, // ID бронирования для связи
      apartmentTitle: webhookSource.apartment?.title || '',
      beginDate: webhookSource.begin_date,
      endDate: webhookSource.end_date,
      daysCount: daysDiff,
      guestName: webhookSource.client?.fio || '',
      phone: webhookSource.client?.phone || '',
      totalAmount: webhookSource.amount || 0,
      prepayment: webhookSource.prepayment || 0,
      pricePerDay: webhookSource.price_per_day || 0,
      statusCode: webhookSource.status_cd || 0,
      source: webhookSource.source || '',
      notes: webhookSource.notes || ''
    };

    console.log('✅ Успешно извлечены данные для обработки:', { action, ...extractedData });
    return { action, bookingData: extractedData };
  } catch (error) {
    console.error('❌ Ошибка при извлечении данных webhook:', error);
    return null;
  }
}

// Поиск таблиц для конкретного апартамента
async function findTargetSheets(apartmentTitle: string) {
  try {
    const mappings = await WebhookMapping.findAll({
      where: { isActive: true },
      include: [{ model: Sheet, as: 'sheet' }]
    });

    const targetSheets = [];

    for (const mapping of mappings) {
      const apartmentTitles = JSON.parse(mapping.apartmentTitles);
      if (apartmentTitles.includes(apartmentTitle)) {
        targetSheets.push((mapping as any).sheet);
      }
    }

    return targetSheets;
  } catch (error) {
    console.error('Ошибка при поиске целевых таблиц:', error);
    return [];
  }
}

// Поиск таблиц по booking_id (для удаления)
async function findSheetsByBookingId(bookingId: number) {
  try {
    console.log(`🔍 Поиск таблиц с бронированием ID ${bookingId}`);
    
    // Ищем все ячейки с данным booking_id
    const cellsWithBooking = await Cell.findAll({
      where: { bookingId: bookingId },
      attributes: ['sheetId'],
      group: ['sheetId']
    });

    if (cellsWithBooking.length === 0) {
      console.log(`❌ Не найдено ячеек с booking_id ${bookingId}`);
      return [];
    }

    const sheetIds = cellsWithBooking.map(cell => cell.sheetId);
    console.log(`📋 Найдены таблицы с ID: ${sheetIds.join(', ')}`);

    // Получаем информацию о таблицах
    const sheets = await Sheet.findAll({
      where: { id: sheetIds }
    });

    console.log(`✅ Найдено ${sheets.length} таблиц для удаления бронирования ID ${bookingId}`);
    return sheets;
  } catch (error) {
    console.error('❌ Ошибка при поиске таблиц по booking_id:', error);
    return [];
  }
}

// Форматирование даты в русский месяц и год
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month} ${year}`;
}

// Форматирование даты в формат DD.MM.YYYY
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
}

// Добавление или обновление данных бронирования в таблице
async function addBookingToSheet(sheet: any, bookingData: any) {
  try {
    const bookingId = bookingData.id;
    
    // Ищем существующие ячейки с данным booking_id
    const existingBookingCells = await Cell.findAll({
      where: { 
        sheetId: sheet.id,
        bookingId: bookingId
      },
      order: [['column', 'ASC']]
    });

    let targetRow: number;
    let isUpdate = false;

    if (existingBookingCells.length > 0) {
      // Обновляем существующее бронирование
      targetRow = existingBookingCells[0].row;
      isUpdate = true;
      console.log(`🔄 Обновление существующего бронирования ID ${bookingId} в таблице ${sheet.title}, строка ${targetRow}`);
    } else {
      // Создаем новое бронирование - находим последнюю заполненную строку
      const lastCells = await Cell.findAll({
        where: { 
          sheetId: sheet.id,
          value: { [Op.ne]: '' } // Исключаем пустые ячейки
        },
        order: [['row', 'DESC']],
        limit: 1
      });

      const lastFilledRow = lastCells.length > 0 ? lastCells[0].row : 0;
      targetRow = lastFilledRow + 1;
      console.log(`➕ Создание нового бронирования ID ${bookingId} в таблице ${sheet.title}, строка ${targetRow}`);
    }

    console.log(`🔍 Анализ бронирования ID ${bookingId} в таблице ${sheet.title}:`, {
      операция: isUpdate ? 'обновление' : 'создание',
      строка: targetRow,
      существующих_ячеек: existingBookingCells.length
    });

    // Форматируем месяц и год из даты заселения
    const monthYear = formatMonthYear(bookingData.beginDate);
    
    // Форматируем даты в российский формат DD.MM.YYYY
    const formattedBeginDate = formatDate(bookingData.beginDate);
    const formattedEndDate = formatDate(bookingData.endDate);

    // Маппинг данных в ячейки (в соответствии с шаблоном "Журнал заселения DMD Cottage")
    const cellsData = [
      { row: targetRow, column: 0, value: monthYear }, // Месяц (например, "Январь 2025")
      { row: targetRow, column: 1, value: formattedBeginDate }, // Дата заселения (03.01.2025)
      { row: targetRow, column: 2, value: bookingData.daysCount.toString() }, // Кол-во дней
      { row: targetRow, column: 3, value: formattedEndDate }, // Дата выселения (06.01.2025)
      { row: targetRow, column: 4, value: bookingData.guestName }, // ФИО
      { row: targetRow, column: 5, value: bookingData.phone }, // Телефон
      { row: targetRow, column: 6, value: bookingData.totalAmount.toString() }, // Общая сумма
      { row: targetRow, column: 7, value: bookingData.prepayment.toString() }, // Предоплата
      { row: targetRow, column: 8, value: bookingData.pricePerDay.toString() }, // Доплата за день
      { row: targetRow, column: 10, value: bookingData.source }, // Источник
      { row: targetRow, column: 11, value: bookingData.notes }, // Комментарий
    ];

    console.log(`📝 ${isUpdate ? 'Обновляемые' : 'Добавляемые'} данные в таблицу ${sheet.title}:`, {
      booking_id: bookingId,
      строка: targetRow,
      операция: isUpdate ? 'обновление' : 'создание',
      месяц: monthYear,
      дата_заселения: formattedBeginDate,
      дни: bookingData.daysCount,
      дата_выселения: formattedEndDate,
      фио: bookingData.guestName,
      телефон: bookingData.phone,
      сумма: bookingData.totalAmount
    });

    if (isUpdate) {
      // Обновляем существующие ячейки
      for (const cellData of cellsData) {
        await Cell.update(
          { 
            value: cellData.value,
            formula: null 
          },
          {
            where: {
              sheetId: sheet.id,
              row: cellData.row,
              column: cellData.column,
              bookingId: bookingId
            }
          }
        );
      }
    } else {
      // Создаем новые ячейки
      for (const cellData of cellsData) {
        await Cell.create({
          sheetId: sheet.id,
          row: cellData.row,
          column: cellData.column,
          value: cellData.value,
          formula: null,
          bookingId: bookingId
        });
      }
    }

    console.log(`✅ ${isUpdate ? 'Обновлено' : 'Добавлено'} бронирование ID ${bookingId} в таблице ${sheet.title} (ID: ${sheet.id}), строка ${targetRow}`);
  } catch (error) {
    console.error(`❌ Ошибка при добавлении данных в таблицу ${sheet.id}:`, error);
  }
} 

// Удаление бронирования из таблицы и сдвиг строк вверх
async function deleteBookingFromSheet(sheet: any, bookingData: any) {
  try {
    const bookingId = bookingData.id;
    
    // Ищем ячейки с данным booking_id
    const bookingCells = await Cell.findAll({
      where: { 
        sheetId: sheet.id,
        bookingId: bookingId
      },
      order: [['row', 'ASC'], ['column', 'ASC']]
    });

    if (bookingCells.length === 0) {
      console.log(`❌ Бронирование ID ${bookingId} не найдено в таблице ${sheet.title}`);
      return;
    }

    const targetRow = bookingCells[0].row;
    console.log(`🗑️ Удаление бронирования ID ${bookingId} из таблицы ${sheet.title}, строка ${targetRow}`);

    // Удаляем все ячейки с данным booking_id
    await Cell.destroy({
      where: { 
        sheetId: sheet.id,
        bookingId: bookingId
      }
    });

    console.log(`✅ Удалено ${bookingCells.length} ячеек бронирования ID ${bookingId}`);

    // Сдвигаем все строки ниже удаленной вверх на одну позицию
    const cellsToShift = await Cell.findAll({
      where: { 
        sheetId: sheet.id,
        row: { [Op.gt]: targetRow } // Все строки больше удаленной
      },
      order: [['row', 'ASC'], ['column', 'ASC']]
    });

    if (cellsToShift.length > 0) {
      console.log(`⬆️ Сдвигаем ${cellsToShift.length} ячеек вверх на одну позицию`);

      // Группируем ячейки по строкам для правильного сдвига
      const rowsToShift = [...new Set(cellsToShift.map(cell => cell.row))].sort((a, b) => a - b);
      
      // Сдвигаем строки снизу вверх, чтобы избежать конфликтов
      for (let i = rowsToShift.length - 1; i >= 0; i--) {
        const currentRow = rowsToShift[i];
        const newRow = currentRow - 1;
        
        await Cell.update(
          { row: newRow },
          {
            where: {
              sheetId: sheet.id,
              row: currentRow
            }
          }
        );
      }

      console.log(`✅ Сдвинуто ${cellsToShift.length} ячеек в ${rowsToShift.length} строках`);
    } else {
      console.log(`ℹ️ Нет ячеек для сдвига после строки ${targetRow}`);
    }

    console.log(`✅ Бронирование ID ${bookingId} успешно удалено из таблицы ${sheet.title} (ID: ${sheet.id})`);
  } catch (error) {
    console.error(`❌ Ошибка при удалении бронирования из таблицы ${sheet.id}:`, error);
  }
} 