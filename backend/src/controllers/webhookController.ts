import { Request, Response } from 'express';
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

// Добавление данных бронирования в таблицу
async function addBookingToSheet(sheet: any, bookingData: any) {
  try {
    // Находим следующую свободную строку
    const existingCells = await Cell.findAll({
      where: { sheetId: sheet.id },
      order: [['row', 'DESC']]
    });

    const lastRow = existingCells.length > 0 ? existingCells[0].row : 0;
    const newRow = lastRow + 1;

    // Маппинг данных в ячейки (в соответствии с шаблоном "Журнал заселения DMD Cottage")
    const cellsToCreate = [
      { row: newRow, column: 0, value: bookingData.beginDate }, // Дата заселения
      { row: newRow, column: 1, value: bookingData.daysCount.toString() }, // Кол-во дней
      { row: newRow, column: 2, value: bookingData.endDate }, // Дата выселения
      { row: newRow, column: 3, value: bookingData.guestName }, // ФИО
      { row: newRow, column: 4, value: bookingData.phone }, // Телефон
      { row: newRow, column: 5, value: bookingData.totalAmount.toString() }, // Общая сумма
      { row: newRow, column: 6, value: bookingData.prepayment.toString() }, // Предоплата
      { row: newRow, column: 7, value: bookingData.pricePerDay.toString() }, // Доплата за день
      { row: newRow, column: 8, value: bookingData.statusCode.toString() }, // Статус дома
      { row: newRow, column: 9, value: bookingData.source }, // Источник
      { row: newRow, column: 10, value: bookingData.notes }, // Комментарий
    ];

    // Создаем ячейки
    for (const cellData of cellsToCreate) {
      await Cell.create({
        sheetId: sheet.id,
        row: cellData.row,
        column: cellData.column,
        value: cellData.value,
        formula: null
      });
    }

    console.log(`Добавлена новая строка в таблицу ${sheet.title} (ID: ${sheet.id})`);
  } catch (error) {
    console.error(`Ошибка при добавлении данных в таблицу ${sheet.id}:`, error);
  }
} 