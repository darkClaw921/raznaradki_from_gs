import { Request, Response } from 'express';
import { User, Role, UserSheet, Sheet } from '../models';

// Создание группы пользователей
export const createUserGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, userIds, defaultPermissions } = req.body;

    // Только админ может создавать группы
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'Название группы обязательно'
      });
    }

    // Создаем роль для группы
    const role = await Role.create({
      name,
      description: description || `Группа: ${name}`,
      isSystem: false
    });

    // Назначаем пользователям роль группы (если указаны)
    let groupUsers: any[] = [];
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      await User.update(
        { roleId: role.id },
        { where: { id: userIds } }
      );

      groupUsers = await User.findAll({
        where: { id: userIds },
        attributes: { exclude: ['password'] },
        include: ['role']
      });
    }

    res.status(201).json({
      message: 'Группа создана успешно',
      group: {
        id: role.id,
        name: role.name,
        description: role.description,
        users: groupUsers,
        defaultPermissions
      }
    });

  } catch (error) {
    console.error('Ошибка создания группы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при создании группы'
    });
  }
};

// Получение списка групп
export const getGroups = async (req: Request, res: Response) => {
  try {
    // Только админ может просматривать группы
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const groups = await Role.findAll({
      where: { isSystem: false },
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email', 'isActive']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ groups });

  } catch (error) {
    console.error('Ошибка получения групп:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении групп'
    });
  }
};

// Обновление группы
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, userIds } = req.body;

    // Только админ может обновлять группы
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const role = await Role.findByPk(id);
    if (!role || role.isSystem) {
      return res.status(404).json({
        error: 'Группа не найдена или является системной'
      });
    }

    // Обновляем информацию о группе
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    await role.update(updateData);

    // Обновляем состав группы если указан
    if (userIds && Array.isArray(userIds)) {
      // Сначала убираем роль у всех текущих участников
      await User.update(
        { roleId: null },
        { where: { roleId: id } }
      );

      // Назначаем роль новым участникам
      if (userIds.length > 0) {
        await User.update(
          { roleId: parseInt(id as string) },
          { where: { id: userIds } }
        );
      }
    }

    const updatedGroup = await Role.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email', 'isActive']
        }
      ]
    });

    res.json({
      message: 'Группа обновлена',
      group: updatedGroup
    });

  } catch (error) {
    console.error('Ошибка обновления группы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при обновлении группы'
    });
  }
};

// Добавление пользователей в группу
export const addUsersToGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    // Только админ может управлять группами
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: 'Список пользователей обязателен'
      });
    }

    const role = await Role.findByPk(id);
    if (!role || role.isSystem) {
      return res.status(404).json({
        error: 'Группа не найдена или является системной'
      });
    }

    await User.update(
      { roleId: parseInt(id as string) },
      { where: { id: userIds } }
    );

    const addedUsers = await User.findAll({
      where: { id: userIds },
      attributes: { exclude: ['password'] },
      include: ['role']
    });

    res.json({
      message: `Добавлено ${addedUsers.length} пользователей в группу`,
      users: addedUsers
    });

  } catch (error) {
    console.error('Ошибка добавления пользователей в группу:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Удаление пользователей из группы
export const removeUsersFromGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    // Только админ может управлять группами
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: 'Список пользователей обязателен'
      });
    }

    // Получаем роль пользователя по умолчанию
    const defaultRole = await Role.findOne({ where: { name: 'user' } });

    await User.update(
      { roleId: defaultRole?.id || null },
      { where: { id: userIds, roleId: id } }
    );

    res.json({
      message: `Удалено ${userIds.length} пользователей из группы`
    });

  } catch (error) {
    console.error('Ошибка удаления пользователей из группы:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Удаление группы
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Только админ может удалять группы
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const role = await Role.findByPk(id);
    if (!role || role.isSystem) {
      return res.status(404).json({
        error: 'Группа не найдена или является системной'
      });
    }

    // Получаем роль пользователя по умолчанию
    const defaultRole = await Role.findOne({ where: { name: 'user' } });

    // Переводим всех пользователей группы в роль по умолчанию
    await User.update(
      { roleId: defaultRole?.id || null },
      { where: { roleId: id } }
    );

    await role.destroy();

    res.json({
      message: 'Группа удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления группы:', error);
    res.status(500).json({
      error: 'Ошибка сервера при удалении группы'
    });
  }
};

// Настройка групповых прав доступа к таблице
export const setGroupSheetAccess = async (req: Request, res: Response) => {
  try {
    const { groupId, sheetId, permission, rowRestrictions, columnRestrictions } = req.body;

    // Только админ может настраивать групповые права
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!groupId || !sheetId) {
      return res.status(400).json({
        error: 'ID группы и таблицы обязательны'
      });
    }

    // Проверяем существование группы и таблицы
    const role = await Role.findByPk(groupId);
    const sheet = await Sheet.findByPk(sheetId);

    if (!role || role.isSystem) {
      return res.status(404).json({
        error: 'Группа не найдена или является системной'
      });
    }

    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Получаем всех пользователей группы
    const groupUsers = await User.findAll({
      where: { roleId: groupId },
      attributes: ['id']
    });

    const userIds = groupUsers.map((user: any) => user.id);

    // Создаем или обновляем доступ для всех пользователей группы
    const accessData = userIds.map((userId: number) => ({
      userId,
      sheetId: parseInt(sheetId),
      permission: permission || 'read',
      rowRestrictions: rowRestrictions ? JSON.stringify(rowRestrictions) : null,
      columnRestrictions: columnRestrictions ? JSON.stringify(columnRestrictions) : null
    }));

    await UserSheet.bulkCreate(accessData, {
      updateOnDuplicate: ['permission', 'rowRestrictions', 'columnRestrictions', 'updatedAt']
    });

    res.json({
      message: `Настроен доступ для группы "${role.name}" к таблице "${sheet.name}"`,
      affectedUsers: userIds.length
    });

  } catch (error) {
    console.error('Ошибка настройки групповых прав:', error);
    res.status(500).json({
      error: 'Ошибка сервера при настройке групповых прав'
    });
  }
}; 