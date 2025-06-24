import { Request, Response } from 'express';
import { SystemSettings } from '../models';
// Используем console.log для логирования в Node.js
import { v4 as uuidv4 } from 'uuid';

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.findAll();
    
    // Преобразуем в объект для удобства
    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json(settingsObject);
  } catch (error) {
    console.error('Ошибка при получении системных настроек:', error);
    res.status(500).json({ message: 'Ошибка при получении настроек' });
  }
};

export const updateSystemSetting = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ message: 'Не указан ключ или значение настройки' });
    }

    // Находим или создаем настройку
    const [setting, created] = await SystemSettings.findOrCreate({
      where: { key },
      defaults: { key, value }
    });

    if (!created) {
      setting.value = value;
      await setting.save();
    }

    console.log(`Обновлена настройка ${key}: ${value}`);
    res.json(setting);
  } catch (error) {
    console.error('Ошибка при обновлении системной настройки:', error);
    res.status(500).json({ message: 'Ошибка при обновлении настройки' });
  }
};

export const generateWebhookUrl = async (req: Request, res: Response) => {
  try {
    const webhookId = uuidv4();
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const webhookUrl = `${baseUrl}/api/webhook/${webhookId}`;

    // Сохраняем URL и секрет в настройки
    await SystemSettings.findOrCreate({
      where: { key: 'webhook_url' },
      defaults: { key: 'webhook_url', value: webhookUrl }
    });

    await SystemSettings.findOrCreate({
      where: { key: 'webhook_secret' },
      defaults: { key: 'webhook_secret', value: webhookId }
    });

    console.log('Сгенерирован новый webhook URL:', webhookUrl);
    res.json({ webhookUrl, webhookId });
  } catch (error) {
    console.error('Ошибка при генерации webhook URL:', error);
    res.status(500).json({ message: 'Ошибка при генерации webhook URL' });
  }
};

export const toggleWebhook = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;

    await SystemSettings.findOrCreate({
      where: { key: 'webhook_enabled' },
      defaults: { key: 'webhook_enabled', value: enabled.toString() }
    });

    const setting = await SystemSettings.findOne({ where: { key: 'webhook_enabled' } });
    if (setting) {
      setting.value = enabled.toString();
      await setting.save();
    }

    console.log(`Webhook ${enabled ? 'включен' : 'отключен'}`);
    res.json({ enabled });
  } catch (error) {
    console.error('Ошибка при переключении webhook:', error);
    res.status(500).json({ message: 'Ошибка при переключении webhook' });
  }
}; 