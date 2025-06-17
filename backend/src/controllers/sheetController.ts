import { Request, Response } from 'express';
import { Sheet, User, UserSheet, Cell } from '../models';
import { Op } from 'sequelize';

// Получение списка таблиц пользователя
export const getSheets = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Получаем таблицы, где пользователь является создателем или участником
    const sheets = await Sheet.findAll({
      where: {
        [Op.or]: [
          { createdBy: userId },
          { isPublic: true }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: {
            attributes: ['permission', 'rowRestrictions', 'columnRestrictions']
          }
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Также получаем таблицы, к которым пользователь имеет доступ через UserSheet
    const userSheets = await UserSheet.findAll({
      where: { userId },
      include: [
        {
          model: Sheet,
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });

    // Объединяем результаты и убираем дубликаты
    const allSheets = [...sheets];
    userSheets.forEach((userSheet: any) => {
      if (!allSheets.find(sheet => sheet.id === userSheet.sheetId)) {
        allSheets.push(userSheet.Sheet);
      }
    });

    res.json({
      sheets: allSheets,
      total: allSheets.length
    });

  } catch (error) {
    console.error('Ошибка получения таблиц:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении таблиц'
    });
  }
};

// Получение конкретной таблицы
export const getSheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: {
            attributes: ['permission', 'rowRestrictions', 'columnRestrictions']
          }
        },
        {
          model: Cell,
          as: 'cells'
        }
      ]
    });

    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка доступа
    const hasAccess = sheet.createdBy === userId || 
                     sheet.isPublic || 
                     (sheet as any).users?.some((user: any) => user.id === userId);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Нет доступа к этой таблице'
      });
    }

    // Получение прав пользователя на таблицу
    let userPermissions = 'read';
    if (sheet.createdBy === userId) {
      userPermissions = 'admin';
    } else {
      const userSheet = await UserSheet.findOne({
        where: { userId, sheetId: id }
      });
      if (userSheet) {
        userPermissions = userSheet.permission;
      }
    }

    res.json({
      sheet,
      userPermissions
    });

  } catch (error) {
    console.error('Ошибка получения таблицы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении таблицы'
    });
  }
};

// Создание новой таблицы
export const createSheet = async (req: Request, res: Response) => {
  try {
    const { name, description, rowCount = 100, columnCount = 26, isPublic = false } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        error: 'Название таблицы обязательно'
      });
    }

    const sheet = await Sheet.create({
      name,
      description,
      createdBy: userId,
      rowCount,
      columnCount,
      isPublic
    });

    // Создаем связь создателя с таблицей
    await UserSheet.create({
      userId,
      sheetId: sheet.id,
      permission: 'admin'
    });

    // Получаем созданную таблицу с дополнительными данными
    const createdSheet = await Sheet.findByPk(sheet.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Таблица успешно создана',
      sheet: createdSheet
    });

  } catch (error) {
    console.error('Ошибка создания таблицы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при создании таблицы'
    });
  }
};

// Обновление таблицы
export const updateSheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, rowCount, columnCount, isPublic, settings } = req.body;
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на редактирование
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasWriteAccess = sheet.createdBy === userId || 
                          (userSheet && ['write', 'admin'].includes(userSheet.permission));

    if (!hasWriteAccess) {
      return res.status(403).json({
        error: 'Нет прав на редактирование этой таблицы'
      });
    }

    // Обновляем только переданные поля
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rowCount !== undefined) updateData.rowCount = rowCount;
    if (columnCount !== undefined) updateData.columnCount = columnCount;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (settings !== undefined) updateData.settings = settings;

    await sheet.update(updateData);

    // Получаем обновленную таблицу
    const updatedSheet = await Sheet.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      message: 'Таблица успешно обновлена',
      sheet: updatedSheet
    });

  } catch (error) {
    console.error('Ошибка обновления таблицы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при обновлении таблицы'
    });
  }
};

// Удаление таблицы
export const deleteSheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Только создатель может удалить таблицу
    if (sheet.createdBy !== userId) {
      return res.status(403).json({
        error: 'Только создатель может удалить таблицу'
      });
    }

    await sheet.destroy();

    res.json({
      message: 'Таблица успешно удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления таблицы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при удалении таблицы'
    });
  }
};

// Добавление пользователя к таблице
export const addUserToSheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: targetUserId, permission = 'read', rowRestrictions, columnRestrictions } = req.body;
    const currentUserId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав (только админ таблицы или создатель)
    const currentUserSheet = await UserSheet.findOne({
      where: { userId: currentUserId, sheetId: id }
    });

    const hasAdminAccess = sheet.createdBy === currentUserId || 
                          (currentUserSheet && currentUserSheet.permission === 'admin');

    if (!hasAdminAccess) {
      return res.status(403).json({
        error: 'Нет прав на добавление пользователей к таблице'
      });
    }

    // Проверка существования целевого пользователя
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    // Проверка, не добавлен ли уже пользователь
    const existingUserSheet = await UserSheet.findOne({
      where: { userId: targetUserId, sheetId: id }
    });

    if (existingUserSheet) {
      return res.status(409).json({
        error: 'Пользователь уже имеет доступ к этой таблице'
      });
    }

    // Добавляем пользователя
    await UserSheet.create({
      userId: targetUserId,
      sheetId: parseInt(id),
      permission,
      rowRestrictions: rowRestrictions ? JSON.stringify(rowRestrictions) : undefined,
      columnRestrictions: columnRestrictions ? JSON.stringify(columnRestrictions) : undefined
    });

    res.status(201).json({
      message: 'Пользователь успешно добавлен к таблице'
    });

  } catch (error) {
    console.error('Ошибка добавления пользователя к таблице:', error);
    res.status(500).json({
      error: 'Ошибка сервера при добавлении пользователя'
    });
  }
}; 