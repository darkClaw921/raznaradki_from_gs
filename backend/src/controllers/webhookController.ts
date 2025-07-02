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
      return res.status(403).json({ message: 'Webhook отключен' });
    }

    // Проверяем корректность webhook ID
    const webhookSecretSetting = await SystemSettings.findOne({
      where: { key: 'webhook_secret' }
    });

    if (!webhookSecretSetting || webhookSecretSetting.value !== webhookId) {
      return res.status(401).json({ message: 'Неверный webhook ID' });
    }

    // Извлекаем данные бронирования
    const bookingData = extractBookingData(webhookData);
    if (!bookingData) {
      return res.status(400).json({ message: 'Некорректные данные webhook' });
    }

    // Находим таблицы, которые должны получить эти данные
    const targetSheets = await findTargetSheets(bookingData.apartmentTitle);
    
    if (targetSheets.length === 0) {
      console.log(`Не найдено таблиц для апартаментов: ${bookingData.apartmentTitle}`);
      return res.json({ message: 'Данные обработаны, но подходящих таблиц не найдено' });
    }

    // Добавляем данные в каждую подходящую таблицу
    for (const sheet of targetSheets) {
      await addBookingToSheet(sheet, bookingData);
    }

    console.log(`Данные бронирования добавлены в ${targetSheets.length} таблиц`);
    res.json({ message: 'Данные успешно обработаны', processedSheets: targetSheets.length });

  } catch (error) {
    console.error('Ошибка при обработке webhook:', error);
    res.status(500).json({ message: 'Ошибка при обработке webhook' });
  }
};

// Извлечение данных бронирования из webhook
function extractBookingData(webhookData: any) {
  try {
    console.log('🔍 Анализ структуры webhookData:', {
      isArray: Array.isArray(webhookData),
      length: Array.isArray(webhookData) ? webhookData.length : 'не массив',
      hasData: webhookData?.data ? 'есть data' : 'нет data',
      firstElement: Array.isArray(webhookData) && webhookData.length > 0 ? 'есть первый элемент' : 'нет первого элемента'
    });

    let bookingSource;
    
    // Проверяем, приходят ли данные в виде массива (как в логах)
    if (Array.isArray(webhookData) && webhookData.length > 0) {
      // Данные в формате массива - берем первый элемент и его body
      const firstElement = webhookData[0];
      if (firstElement?.body?.data?.booking) {
        bookingSource = firstElement.body.data.booking;
        console.log('✅ Найдены данные бронирования в массиве: webhookData[0].body.data.booking');
      }
    } else if (webhookData?.data?.booking) {
      // Данные в прямом формате объекта
      bookingSource = webhookData.data.booking;
      console.log('✅ Найдены данные бронирования в объекте: webhookData.data.booking');
    }

    if (!bookingSource) {
      console.log('❌ Данные бронирования не найдены в webhook');
      return null;
    }

    console.log('📋 Извлеченные поля бронирования:', {
      apartment_title: bookingSource.apartment?.title,
      begin_date: bookingSource.begin_date,
      end_date: bookingSource.end_date,
      client_fio: bookingSource.client?.fio,
      client_phone: bookingSource.client?.phone,
      amount: bookingSource.amount,
      source: bookingSource.source
    });
    
    // Вычисляем количество дней
    const beginDate = new Date(bookingSource.begin_date);
    const endDate = new Date(bookingSource.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24));

    const extractedData = {
      id: bookingSource.id, // ID бронирования для связи
      apartmentTitle: bookingSource.apartment?.title || '',
      beginDate: bookingSource.begin_date,
      endDate: bookingSource.end_date,
      daysCount: daysDiff,
      guestName: bookingSource.client?.fio || '',
      phone: bookingSource.client?.phone || '',
      totalAmount: bookingSource.amount || 0,
      prepayment: bookingSource.prepayment || 0,
      pricePerDay: bookingSource.price_per_day || 0,
      statusCode: bookingSource.status_cd || 0,
      source: bookingSource.source || '',
      notes: bookingSource.notes || ''
    };

    console.log('✅ Успешно извлечены данные для обработки:', extractedData);
    return extractedData;
  } catch (error) {
    console.error('❌ Ошибка при извлечении данных бронирования:', error);
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