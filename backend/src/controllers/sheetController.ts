import { Request, Response } from 'express';
import { Sheet, User, UserSheet, Cell, SheetTemplate } from '../models';
import { Op, QueryTypes } from 'sequelize';

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
        },
        {
          model: SheetTemplate,
          as: 'template',
          attributes: ['id', 'name', 'description', 'category']
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
          as: 'sheet',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
              model: SheetTemplate,
              as: 'template',
              attributes: ['id', 'name', 'description', 'category']
            }
          ]
        }
      ]
    });

    // Объединяем результаты и убираем дубликаты
    const allSheets = [...sheets];
    userSheets.forEach((userSheet: any) => {
      if (!allSheets.find(sheet => sheet.id === userSheet.sheetId)) {
        allSheets.push(userSheet.sheet);
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
          model: SheetTemplate,
          as: 'template',
          attributes: ['id', 'name', 'description', 'category']
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

    // Логируем settings для диагностики
    console.log(`📊 getSheet - Sheet ID: ${sheet.id}, Settings:`, sheet.settings);

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

// Настройка детальных прав доступа к таблице
export const setCellLevelAccess = async (req: Request, res: Response) => {
  try {
    const { id: sheetId } = req.params; // sheetId берем из URL параметров
    const { userId, cellRestrictions, rowRestrictions, columnRestrictions, permission, cellRange } = req.body;

    // Только админ или создатель таблицы может управлять доступом
    if (req.user.role?.name !== 'admin') {
      const sheet = await Sheet.findByPk(sheetId);
      if (!sheet || sheet.createdBy !== req.user.id) {
        return res.status(403).json({
          error: 'Недостаточно прав для управления этой таблицей'
        });
      }
    }

    if (!userId) {
      return res.status(400).json({
        error: 'ID пользователя обязателен'
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

    // Формируем объекты ограничений
    const restrictions: any = {};
    
    if (rowRestrictions) {
      restrictions.rows = Array.isArray(rowRestrictions) ? rowRestrictions : [rowRestrictions];
    }
    
    if (columnRestrictions) {
      restrictions.columns = Array.isArray(columnRestrictions) ? columnRestrictions : [columnRestrictions];
    }
    
    if (cellRestrictions) {
      restrictions.cells = Array.isArray(cellRestrictions) ? cellRestrictions : [cellRestrictions];
    }

    // Обрабатываем cellRange если указан
    if (cellRange) {
      restrictions.cellRange = cellRange;
    }

    // Создание или обновление доступа
    const [userSheet, created] = await UserSheet.upsert({
      userId: parseInt(userId as string),
      sheetId: parseInt(sheetId as string),
      permission: permission || 'read',
      rowRestrictions: restrictions.rows ? JSON.stringify(restrictions.rows) : null,
      columnRestrictions: restrictions.columns ? JSON.stringify(restrictions.columns) : null
    });

    const result = await UserSheet.findByPk(userSheet.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Sheet, as: 'sheet', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      message: created ? 'Детальный доступ настроен' : 'Детальный доступ обновлен',
      userSheet: {
        ...result?.toJSON(),
        parsedRestrictions: {
          rows: result?.rowRestrictions ? JSON.parse(result.rowRestrictions) : null,
          columns: result?.columnRestrictions ? JSON.parse(result.columnRestrictions) : null,
          cells: restrictions.cells || null
        }
      }
    });

  } catch (error) {
    console.error('Ошибка настройки детального доступа:', error);
    res.status(500).json({
      error: 'Ошибка сервера при настройке детального доступа'
    });
  }
};

// Получение детальных прав доступа к таблице
export const getCellLevelAccess = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.params;

    // Только админ или создатель таблицы может просматривать права доступа
    if (req.user.role?.name !== 'admin') {
      const sheet = await Sheet.findByPk(sheetId);
      if (!sheet || sheet.createdBy !== req.user.id) {
        return res.status(403).json({
          error: 'Недостаточно прав для просмотра настроек доступа'
        });
      }
    }

    const userSheets = await UserSheet.findAll({
      where: { sheetId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    const accessList = userSheets.map((us: any) => ({
      user: us.user,
      permission: us.permission,
      restrictions: {
        rows: us.rowRestrictions ? JSON.parse(us.rowRestrictions) : null,
        columns: us.columnRestrictions ? JSON.parse(us.columnRestrictions) : null
      },
      grantedAt: us.createdAt,
      updatedAt: us.updatedAt
    }));

    res.json({
      sheetId,
      accessList,
      totalUsers: accessList.length
    });

  } catch (error) {
    console.error('Ошибка получения прав доступа:', error);
    res.status(500).json({
      error: 'Ошибка сервера при получении прав доступа'
    });
  }
};

// Копирование прав доступа между таблицами
export const copySheetAccess = async (req: Request, res: Response) => {
  try {
    const { sourceSheetId, targetSheetId } = req.body;

    // Только админ может копировать права доступа
    if (req.user.role?.name !== 'admin') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!sourceSheetId || !targetSheetId) {
      return res.status(400).json({
        error: 'ID исходной и целевой таблиц обязательны'
      });
    }

    // Проверка существования таблиц
    const sourceSheet = await Sheet.findByPk(sourceSheetId);
    const targetSheet = await Sheet.findByPk(targetSheetId);

    if (!sourceSheet || !targetSheet) {
      return res.status(404).json({
        error: 'Одна или обе таблицы не найдены'
      });
    }

    // Получаем права доступа исходной таблицы
    const sourceAccess = await UserSheet.findAll({
      where: { sheetId: sourceSheetId }
    });

    // Копируем права доступа в целевую таблицу
    const targetAccessData = sourceAccess.map((access: any) => ({
      userId: access.userId,
      sheetId: targetSheetId,
      permission: access.permission,
      rowRestrictions: access.rowRestrictions,
      columnRestrictions: access.columnRestrictions
    }));

    await UserSheet.bulkCreate(targetAccessData, {
      updateOnDuplicate: ['permission', 'rowRestrictions', 'columnRestrictions', 'updatedAt']
    });

    res.json({
      message: `Скопировано ${sourceAccess.length} настроек доступа из таблицы "${sourceSheet.name}" в таблицу "${targetSheet.name}"`,
      copiedAccess: sourceAccess.length
    });

  } catch (error) {
    console.error('Ошибка копирования прав доступа:', error);
    res.status(500).json({
      error: 'Ошибка сервера при копировании прав доступа'
    });
  }
};

// Проверка доступа пользователя к конкретной ячейке
export const checkCellAccess = async (req: Request, res: Response) => {
  try {
    const { sheetId, row, column, userId } = req.body;

    if (!sheetId || row === undefined || column === undefined || !userId) {
      return res.status(400).json({
        error: 'ID таблицы, строка, столбец и ID пользователя обязательны'
      });
    }

    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        { model: Sheet, as: 'sheet', attributes: ['id', 'name'] }
      ]
    });

    let hasAccess = false;
    let accessLevel = 'none';
    let restrictions: any = {};

    if (userSheet) {
      accessLevel = userSheet.permission;
      
      // Проверяем ограничения по строкам
      if (userSheet.rowRestrictions) {
        const allowedRows = JSON.parse(userSheet.rowRestrictions);
        const rowAccess = allowedRows.includes(row) || allowedRows.includes('*');
        restrictions.rowAccess = rowAccess;
      } else {
        restrictions.rowAccess = true;
      }

      // Проверяем ограничения по столбцам
      if (userSheet.columnRestrictions) {
        const allowedColumns = JSON.parse(userSheet.columnRestrictions);
        const columnAccess = allowedColumns.includes(column) || allowedColumns.includes('*');
        restrictions.columnAccess = columnAccess;
      } else {
        restrictions.columnAccess = true;
      }

      hasAccess = restrictions.rowAccess && restrictions.columnAccess;
    }

    res.json({
      hasAccess,
      accessLevel,
      restrictions,
      cell: { row, column },
              user: (userSheet as any)?.user,
        sheet: (userSheet as any)?.sheet
    });

  } catch (error) {
    console.error('Ошибка проверки доступа к ячейке:', error);
    res.status(500).json({
      error: 'Ошибка сервера при проверке доступа к ячейке'
    });
  }
};

// Добавление столбца
export const addColumn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position } = req.body; // позиция для вставки (опционально)
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на редактирование структуры
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAdminAccess = sheet.createdBy === userId || 
                          (userSheet && userSheet.permission === 'admin');

    if (!hasAdminAccess) {
      return res.status(403).json({
        error: 'Нет прав на изменение структуры таблицы'
      });
    }

    // Увеличиваем количество столбцов
    await sheet.update({
      columnCount: sheet.columnCount + 1
    });

    res.json({
      message: 'Столбец добавлен',
      sheet: await Sheet.findByPk(id)
    });

  } catch (error) {
    console.error('Ошибка добавления столбца:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Добавление строки
export const addRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position } = req.body; // позиция для вставки (опционально)
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на редактирование структуры
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAdminAccess = sheet.createdBy === userId || 
                          (userSheet && userSheet.permission === 'admin');

    if (!hasAdminAccess) {
      return res.status(403).json({
        error: 'Нет прав на изменение структуры таблицы'
      });
    }

    // Увеличиваем количество строк
    await sheet.update({
      rowCount: sheet.rowCount + 1
    });

    res.json({
      message: 'Строка добавлена',
      sheet: await Sheet.findByPk(id)
    });

  } catch (error) {
    console.error('Ошибка добавления строки:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Массовое добавление строк
export const addRowsBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { count = 1 } = req.body; // количество строк для добавления
    const userId = req.user.id;

    console.log(`Массовое добавление ${count} строк для таблицы ${id}`);

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на редактирование структуры
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAdminAccess = sheet.createdBy === userId || 
                          (userSheet && userSheet.permission === 'admin');

    if (!hasAdminAccess) {
      return res.status(403).json({
        error: 'Нет прав на изменение структуры таблицы'
      });
    }

    // Валидация количества (max 1000 строк за раз для безопасности)
    const validCount = Math.min(Math.max(count, 1), 1000);

    // Дополнительная проверка для очень больших запросов
    if (count > 100) {
      console.log(`⚠️  Большой запрос: добавление ${count} строк, обработка может занять время`);
    }

    // Увеличиваем количество строк одним запросом
    await sheet.update({
      rowCount: sheet.rowCount + validCount
    });

    console.log(`Успешно добавлено ${validCount} строк. Новое количество: ${sheet.rowCount + validCount}`);

    res.json({
      message: `Добавлено ${validCount} строк`,
      addedCount: validCount,
      sheet: await Sheet.findByPk(id)
    });

  } catch (error) {
    console.error('Ошибка массового добавления строк:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Массовое добавление столбцов
export const addColumnsBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { count = 1 } = req.body; // количество столбцов для добавления
    const userId = req.user.id;

    console.log(`Массовое добавление ${count} столбцов для таблицы ${id}`);

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на редактирование структуры
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAdminAccess = sheet.createdBy === userId || 
                          (userSheet && userSheet.permission === 'admin');

    if (!hasAdminAccess) {
      return res.status(403).json({
        error: 'Нет прав на изменение структуры таблицы'
      });
    }

    // Валидация количества (max 500 столбцов за раз для безопасности)
    const validCount = Math.min(Math.max(count, 1), 500);

    // Дополнительная проверка для очень больших запросов
    if (count > 26) {
      console.log(`⚠️  Большой запрос: добавление ${count} столбцов, обработка может занять время`);
    }

    // Увеличиваем количество столбцов одним запросом
    await sheet.update({
      columnCount: sheet.columnCount + validCount
    });

    console.log(`Успешно добавлено ${validCount} столбцов. Новое количество: ${sheet.columnCount + validCount}`);

    res.json({
      message: `Добавлено ${validCount} столбцов`,
      addedCount: validCount,
      sheet: await Sheet.findByPk(id)
    });

  } catch (error) {
    console.error('Ошибка массового добавления столбцов:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Получение участников таблицы
export const getSheetMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка доступа к таблице
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAccess = sheet.createdBy === userId || userSheet;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Нет доступа к таблице'
      });
    }

    // Получаем всех участников
    const members = await UserSheet.findAll({
      where: { sheetId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Добавляем создателя таблицы
    const creator = await User.findByPk(sheet.createdBy, {
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    res.json({
      members: [
        {
          user: creator,
          permission: 'owner',
          joinedAt: sheet.createdAt
        },
        ...members.map((member: any) => ({
          user: member.user,
          permission: member.permission,
          joinedAt: member.createdAt
        }))
      ]
    });

  } catch (error) {
    console.error('Ошибка получения участников:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Приглашение участника
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, permission = 'read' } = req.body;
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка прав на приглашение
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAdminAccess = sheet.createdBy === userId || 
                          (userSheet && ['admin'].includes(userSheet.permission));

    if (!hasAdminAccess) {
      return res.status(403).json({
        error: 'Нет прав на приглашение участников'
      });
    }

    // Поиск пользователя по email
    const invitedUser = await User.findOne({
      where: { email }
    });

    if (!invitedUser) {
      return res.status(404).json({
        error: 'Пользователь с таким email не найден'
      });
    }

    // Проверка, не является ли уже участником
    const existingMember = await UserSheet.findOne({
      where: { userId: invitedUser.id, sheetId: id }
    });

    if (existingMember) {
      return res.status(400).json({
        error: 'Пользователь уже является участником таблицы'
      });
    }

    // Создаем доступ
    await UserSheet.create({
      userId: invitedUser.id,
      sheetId: parseInt(id),
      permission
    });

    res.json({
      message: 'Участник приглашен',
      member: {
        user: {
          id: invitedUser.id,
          firstName: invitedUser.firstName,
          lastName: invitedUser.lastName,
          email: invitedUser.email
        },
        permission
      }
    });

  } catch (error) {
    console.error('Ошибка приглашения участника:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Изменение размеров столбца
export const resizeColumn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { column, width } = req.body;
    const userId = req.user.id;

    console.log(`🔧 Изменение размера столбца - Sheet ID: ${id}, Column: ${column}, Width: ${width}, User: ${userId}`);

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      console.error(`❌ Таблица не найдена: ${id}`);
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка доступа к таблице
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAccess = sheet.createdBy === userId || userSheet;

    if (!hasAccess) {
      console.error(`❌ Нет доступа к таблице - User: ${userId}, Sheet: ${id}`);
      return res.status(403).json({
        error: 'Нет доступа к таблице'
      });
    }

    // Обновляем настройки размеров
    const currentSettings = sheet.settings || {};
    const columnSizes = currentSettings.columnSizes || {};
    console.log(`📊 Текущие настройки столбцов:`, columnSizes);
    
    columnSizes[column] = width;
    console.log(`📊 Новые настройки столбцов:`, columnSizes);

    const updatedSettings = {
      ...currentSettings,
      columnSizes
    };

    console.log(`🔄 Обновляем settings - ДО:`, currentSettings);
    console.log(`🔄 Обновляем settings - ПОСЛЕ:`, updatedSettings);

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем прямой SQL для обновления JSON поля
    try {
      const settingsJson = JSON.stringify(updatedSettings);
      console.log(`🔄 JSON для сохранения:`, settingsJson);
      
      const updateQuery = `UPDATE sheets SET settings = ? WHERE id = ?`;
      await sheet.sequelize?.query(updateQuery, {
        replacements: [settingsJson, id],
        type: QueryTypes.UPDATE
      });
      
      console.log(`📝 Использован прямой SQL для сохранения JSON поля`);

      // Перезагружаем sheet из базы для проверки сохранения
      await sheet.reload();
      console.log(`✅ Размер столбца изменен успешно - Column: ${column}, Width: ${width}`);
      console.log(`🔍 Проверка сохранения - settings в базе:`, sheet.settings);
      
      // Дополнительная проверка - получаем данные напрямую из MySQL
      const directQuery = await sheet.sequelize?.query(`SELECT settings FROM sheets WHERE id = ${id}`);
      console.log(`🔍 Прямой запрос MySQL:`, directQuery?.[0]?.[0]);

      res.json({
        message: 'Размер столбца изменен',
        columnSizes,
        settings: sheet.settings
      });
      
    } catch (sqlError) {
      console.error(`❌ Ошибка SQL обновления:`, sqlError);
      
      // Fallback - пробуем старый способ
      sheet.settings = updatedSettings;
      sheet.changed('settings', true);
      await sheet.save();
      await sheet.reload();
      
      res.json({
        message: 'Размер столбца изменен (fallback)',
        columnSizes,
        settings: sheet.settings
      });
    }

  } catch (error) {
    console.error('❌ Ошибка изменения размера столбца:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      details: error.message
    });
  }
};

// Изменение размеров строки
export const resizeRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { row, height } = req.body;
    const userId = req.user.id;

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка доступа к таблице
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAccess = sheet.createdBy === userId || userSheet;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Нет доступа к таблице'
      });
    }

    // Обновляем настройки размеров
    const currentSettings = sheet.settings || {};
    const rowSizes = currentSettings.rowSizes || {};
    rowSizes[row] = height;

    const updatedRowSettings = {
      ...currentSettings,
      rowSizes
    };

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем прямой SQL для обновления JSON поля
    try {
      const settingsJson = JSON.stringify(updatedRowSettings);
      console.log(`🔄 JSON для сохранения строки:`, settingsJson);
      
      const updateQuery = `UPDATE sheets SET settings = ? WHERE id = ?`;
      await sheet.sequelize?.query(updateQuery, {
        replacements: [settingsJson, id],
        type: QueryTypes.UPDATE
      });
      
      console.log(`📝 Использован прямой SQL для сохранения JSON поля строки`);

      // Перезагружаем sheet из базы для проверки сохранения
      await sheet.reload();
      console.log(`✅ Размер строки изменен успешно - Row: ${row}, Height: ${height}`);
      console.log(`🔍 Проверка сохранения - settings в базе:`, sheet.settings);

      res.json({
        message: 'Размер строки изменен',
        rowSizes,
        settings: sheet.settings
      });
      
    } catch (sqlError) {
      console.error(`❌ Ошибка SQL обновления строки:`, sqlError);
      
      // Fallback - пробуем старый способ
      sheet.settings = updatedRowSettings;
      sheet.changed('settings', true);
      await sheet.save();
      await sheet.reload();
      
      res.json({
        message: 'Размер строки изменен (fallback)',
        rowSizes,
        settings: sheet.settings
      });
    }

  } catch (error) {
    console.error('Ошибка изменения размера строки:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Обновление настроек таблицы (массовое обновление размеров)
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;

    console.log(`🔧 Массовое обновление настроек - Sheet ID: ${id}, User: ${userId}`);
    console.log(`📊 Новые настройки:`, settings);

    const sheet = await Sheet.findByPk(id);
    if (!sheet) {
      console.error(`❌ Таблица не найдена: ${id}`);
      return res.status(404).json({
        error: 'Таблица не найдена'
      });
    }

    // Проверка доступа к таблице
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId: id }
    });

    const hasAccess = sheet.createdBy === userId || userSheet;

    if (!hasAccess) {
      console.error(`❌ Нет доступа к таблице - User: ${userId}, Sheet: ${id}`);
      return res.status(403).json({
        error: 'Нет доступа к таблице'
      });
    }

    // Обновляем настройки
    const currentSettings = sheet.settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };

    console.log(`🔄 Обновляем settings - ДО:`, currentSettings);
    console.log(`🔄 Обновляем settings - ПОСЛЕ:`, updatedSettings);

    // Используем прямой SQL для обновления JSON поля
    try {
      const settingsJson = JSON.stringify(updatedSettings);
      console.log(`🔄 JSON для сохранения:`, settingsJson);
      
      const updateQuery = `UPDATE sheets SET settings = ? WHERE id = ?`;
      await sheet.sequelize?.query(updateQuery, {
        replacements: [settingsJson, id],
        type: QueryTypes.UPDATE
      });
      
      console.log(`📝 Использован прямой SQL для сохранения JSON поля`);

      // Перезагружаем sheet из базы для проверки сохранения
      await sheet.reload();
      console.log(`✅ Настройки обновлены успешно`);
      console.log(`🔍 Проверка сохранения - settings в базе:`, sheet.settings);

      res.json({
        message: 'Настройки обновлены',
        settings: sheet.settings
      });
      
    } catch (sqlError) {
      console.error(`❌ Ошибка SQL обновления:`, sqlError);
      
      // Fallback - пробуем старый способ
      sheet.settings = updatedSettings;
      sheet.changed('settings', true);
      await sheet.save();
      await sheet.reload();
      
      res.json({
        message: 'Настройки обновлены (fallback)',
        settings: sheet.settings
      });
    }

  } catch (error) {
    console.error('❌ Ошибка обновления настроек:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      details: error.message
    });
  }
}; 