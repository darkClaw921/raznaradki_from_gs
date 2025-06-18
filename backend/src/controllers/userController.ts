import { Request, Response } from 'express';
import { User, Role, UserSheet, Sheet } from '../models';
import crypto from 'crypto';

// Получение списка пользователей
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      include: ['role'],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Получение пользователя по ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Обновление пользователя
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, roleId, isActive } = req.body;
    const currentUserId = req.user.id;

    // Проверка прав (только админ или сам пользователь)
    if (currentUserId !== parseInt(id) && req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    // Обновляем только разрешенные поля
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    
    // Только админ может менять роль и статус активности
    if (req.user.role?.name === 'admin') {
      if (roleId !== undefined) updateData.roleId = roleId;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'Пользователь обновлен',
      user: updatedUser
    });

  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Деактивация пользователя
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Только админ может деактивировать пользователей
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    await user.update({ isActive: false });

    res.json({
      message: 'Пользователь деактивирован'
    });

  } catch (error) {
    console.error('Ошибка деактивации пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Создание нового пользователя (только для админов)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, roleId, password, isActive = true } = req.body;

    // Только админ может создавать пользователей
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Email, имя и фамилия обязательны'
      });
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Получение роли по умолчанию
    let userRoleId = roleId;
    if (!userRoleId) {
      const defaultRole = await Role.findOne({ where: { name: 'user' } });
      userRoleId = defaultRole?.id;
    }

    // Генерация временного пароля если не указан
    const tempPassword = password || crypto.randomBytes(8).toString('hex');

    const user = await User.create({
      email,
      password: tempPassword,
      firstName,
      lastName,
      roleId: userRoleId,
      isActive
    });

    const createdUser = await User.findByPk(user.id, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      message: 'Пользователь создан успешно',
      user: createdUser,
      tempPassword: password ? undefined : tempPassword
    });

  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера при создании пользователя'
    });
  }
};

// Отправка приглашения пользователю
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, roleId, message } = req.body;

    // Только админ может приглашать пользователей
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!email) {
      return res.status(400).json({
        error: 'Email обязателен'
      });
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Генерация токена приглашения
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // Здесь можно добавить отправку email с приглашением
    // В рамках демо просто возвращаем ссылку для регистрации
    
    res.json({
      message: 'Приглашение создано',
      inviteToken,
      inviteUrl: `${process.env.FRONTEND_URL}/register?token=${inviteToken}&email=${email}`,
      email,
      firstName,
      lastName,
      roleId,
      customMessage: message
    });

  } catch (error) {
    console.error('Ошибка отправки приглашения:', error);
    res.status(500).json({
      error: 'Ошибка сервера при отправке приглашения'
    });
  }
};

// Массовые операции с пользователями
export const bulkUpdateUsers = async (req: Request, res: Response) => {
  try {
    const { userIds, updates } = req.body;

    // Только админ может выполнять массовые операции
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Список ID пользователей обязателен'
      });
    }

    const allowedUpdates = ['roleId', 'isActive'];
    const updateData: any = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    await User.update(updateData, {
      where: {
        id: userIds
      }
    });

    const updatedUsers = await User.findAll({
      where: { id: userIds },
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: `Обновлено ${updatedUsers.length} пользователей`,
      users: updatedUsers
    });

  } catch (error) {
    console.error('Ошибка массового обновления:', error);
    res.status(500).json({
      error: 'Ошибка сервера при массовом обновлении'
    });
  }
};

// Управление доступом пользователя к таблице
export const setUserSheetAccess = async (req: Request, res: Response) => {
  try {
    const { userId, sheetId, permission, rowRestrictions, columnRestrictions } = req.body;

    // Только админ или создатель таблицы может управлять доступом
    if (req.user.role?.name !== 'admin') {
      const sheet = await Sheet.findByPk(sheetId);
      if (!sheet || sheet.createdBy !== req.user.id) {
        return res.status(403).json({
          error: 'Недостаточно прав для управления этой таблицей'
        });
      }
    }

    if (!userId || !sheetId) {
      return res.status(400).json({
        error: 'ID пользователя и таблицы обязательны'
      });
    }

    // Проверка существования пользователя и таблицы
    const user = await User.findByPk(userId);
    const sheet = await Sheet.findByPk(sheetId);

    if (!user || !sheet) {
      return res.status(404).json({
        error: 'Пользователь или таблица не найдены'
      });
    }

    // Создание или обновление доступа
    const [userSheet, created] = await UserSheet.upsert({
      userId,
      sheetId,
      permission: permission || 'read',
      rowRestrictions: rowRestrictions ? JSON.stringify(rowRestrictions) : null,
      columnRestrictions: columnRestrictions ? JSON.stringify(columnRestrictions) : null
    });

    const result = await UserSheet.findByPk(userSheet.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Sheet, as: 'sheet', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      message: created ? 'Доступ предоставлен' : 'Доступ обновлен',
      userSheet: result
    });

  } catch (error) {
    console.error('Ошибка настройки доступа:', error);
    res.status(500).json({
      error: 'Ошибка сервера при настройке доступа'
    });
  }
};

// Удаление доступа пользователя к таблице
export const removeUserSheetAccess = async (req: Request, res: Response) => {
  try {
    const { userId, sheetId } = req.body;

    // Только админ или создатель таблицы может управлять доступом
    if (req.user.role?.name !== 'admin') {
      const sheet = await Sheet.findByPk(sheetId);
      if (!sheet || sheet.createdBy !== req.user.id) {
        return res.status(403).json({
          error: 'Недостаточно прав для управления этой таблицей'
        });
      }
    }

    const deleted = await UserSheet.destroy({
      where: { userId, sheetId }
    });

    if (deleted === 0) {
      return res.status(404).json({
        error: 'Доступ не найден'
      });
    }

    res.json({
      message: 'Доступ удален'
    });

  } catch (error) {
    console.error('Ошибка удаления доступа:', error);
    res.status(500).json({
      error: 'Ошибка сервера при удалении доступа'
    });
  }
};

// Получение всех доступов пользователя
export const getUserAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Только админ или сам пользователь может просматривать доступы
    if (req.user.role?.name !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const userSheets = await UserSheet.findAll({
      where: { userId: id },
      include: [
        { 
          model: Sheet, 
          as: 'sheet', 
          attributes: ['id', 'name', 'description', 'isPublic'],
          include: [
            { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
          ]
        }
      ]
    });

    res.json({
      userAccess: userSheets.map((us: any) => ({
        sheet: us.sheet,
        permission: us.permission,
        rowRestrictions: us.rowRestrictions ? JSON.parse(us.rowRestrictions) : null,
        columnRestrictions: us.columnRestrictions ? JSON.parse(us.columnRestrictions) : null,
        grantedAt: us.createdAt
      }))
    });

  } catch (error) {
    console.error('Ошибка получения доступов:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении доступов'
    });
  }
}; 