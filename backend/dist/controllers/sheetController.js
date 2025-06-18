"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resizeRow = exports.resizeColumn = exports.inviteMember = exports.getSheetMembers = exports.addRow = exports.addColumn = exports.checkCellAccess = exports.copySheetAccess = exports.getCellLevelAccess = exports.setCellLevelAccess = exports.addUserToSheet = exports.deleteSheet = exports.updateSheet = exports.createSheet = exports.getSheet = exports.getSheets = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const getSheets = async (req, res) => {
    try {
        const userId = req.user.id;
        const sheets = await models_1.Sheet.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { createdBy: userId },
                    { isPublic: true }
                ]
            },
            include: [
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: models_1.User,
                    as: 'users',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    through: {
                        attributes: ['permission', 'rowRestrictions', 'columnRestrictions']
                    }
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
        const userSheets = await models_1.UserSheet.findAll({
            where: { userId },
            include: [
                {
                    model: models_1.Sheet,
                    as: 'sheet',
                    include: [
                        {
                            model: models_1.User,
                            as: 'creator',
                            attributes: ['id', 'firstName', 'lastName', 'email']
                        }
                    ]
                }
            ]
        });
        const allSheets = [...sheets];
        userSheets.forEach((userSheet) => {
            if (!allSheets.find(sheet => sheet.id === userSheet.sheetId)) {
                allSheets.push(userSheet.sheet);
            }
        });
        res.json({
            sheets: allSheets,
            total: allSheets.length
        });
    }
    catch (error) {
        console.error('Ошибка получения таблиц:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении таблиц'
        });
    }
};
exports.getSheets = getSheets;
const getSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: models_1.User,
                    as: 'users',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    through: {
                        attributes: ['permission', 'rowRestrictions', 'columnRestrictions']
                    }
                },
                {
                    model: models_1.Cell,
                    as: 'cells'
                }
            ]
        });
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const hasAccess = sheet.createdBy === userId ||
            sheet.isPublic ||
            sheet.users?.some((user) => user.id === userId);
        if (!hasAccess) {
            return res.status(403).json({
                error: 'Нет доступа к этой таблице'
            });
        }
        let userPermissions = 'read';
        if (sheet.createdBy === userId) {
            userPermissions = 'admin';
        }
        else {
            const userSheet = await models_1.UserSheet.findOne({
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
    }
    catch (error) {
        console.error('Ошибка получения таблицы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении таблицы'
        });
    }
};
exports.getSheet = getSheet;
const createSheet = async (req, res) => {
    try {
        const { name, description, rowCount = 100, columnCount = 26, isPublic = false } = req.body;
        const userId = req.user.id;
        if (!name) {
            return res.status(400).json({
                error: 'Название таблицы обязательно'
            });
        }
        const sheet = await models_1.Sheet.create({
            name,
            description,
            createdBy: userId,
            rowCount,
            columnCount,
            isPublic
        });
        await models_1.UserSheet.create({
            userId,
            sheetId: sheet.id,
            permission: 'admin'
        });
        const createdSheet = await models_1.Sheet.findByPk(sheet.id, {
            include: [
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });
        res.status(201).json({
            message: 'Таблица успешно создана',
            sheet: createdSheet
        });
    }
    catch (error) {
        console.error('Ошибка создания таблицы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при создании таблицы'
        });
    }
};
exports.createSheet = createSheet;
const updateSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, rowCount, columnCount, isPublic, settings } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasWriteAccess = sheet.createdBy === userId ||
            (userSheet && ['write', 'admin'].includes(userSheet.permission));
        if (!hasWriteAccess) {
            return res.status(403).json({
                error: 'Нет прав на редактирование этой таблицы'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (rowCount !== undefined)
            updateData.rowCount = rowCount;
        if (columnCount !== undefined)
            updateData.columnCount = columnCount;
        if (isPublic !== undefined)
            updateData.isPublic = isPublic;
        if (settings !== undefined)
            updateData.settings = settings;
        await sheet.update(updateData);
        const updatedSheet = await models_1.Sheet.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });
        res.json({
            message: 'Таблица успешно обновлена',
            sheet: updatedSheet
        });
    }
    catch (error) {
        console.error('Ошибка обновления таблицы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при обновлении таблицы'
        });
    }
};
exports.updateSheet = updateSheet;
const deleteSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        if (sheet.createdBy !== userId) {
            return res.status(403).json({
                error: 'Только создатель может удалить таблицу'
            });
        }
        await sheet.destroy();
        res.json({
            message: 'Таблица успешно удалена'
        });
    }
    catch (error) {
        console.error('Ошибка удаления таблицы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при удалении таблицы'
        });
    }
};
exports.deleteSheet = deleteSheet;
const addUserToSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: targetUserId, permission = 'read', rowRestrictions, columnRestrictions } = req.body;
        const currentUserId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const currentUserSheet = await models_1.UserSheet.findOne({
            where: { userId: currentUserId, sheetId: id }
        });
        const hasAdminAccess = sheet.createdBy === currentUserId ||
            (currentUserSheet && currentUserSheet.permission === 'admin');
        if (!hasAdminAccess) {
            return res.status(403).json({
                error: 'Нет прав на добавление пользователей к таблице'
            });
        }
        const targetUser = await models_1.User.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                error: 'Пользователь не найден'
            });
        }
        const existingUserSheet = await models_1.UserSheet.findOne({
            where: { userId: targetUserId, sheetId: id }
        });
        if (existingUserSheet) {
            return res.status(409).json({
                error: 'Пользователь уже имеет доступ к этой таблице'
            });
        }
        await models_1.UserSheet.create({
            userId: targetUserId,
            sheetId: parseInt(id),
            permission,
            rowRestrictions: rowRestrictions ? JSON.stringify(rowRestrictions) : undefined,
            columnRestrictions: columnRestrictions ? JSON.stringify(columnRestrictions) : undefined
        });
        res.status(201).json({
            message: 'Пользователь успешно добавлен к таблице'
        });
    }
    catch (error) {
        console.error('Ошибка добавления пользователя к таблице:', error);
        res.status(500).json({
            error: 'Ошибка сервера при добавлении пользователя'
        });
    }
};
exports.addUserToSheet = addUserToSheet;
const setCellLevelAccess = async (req, res) => {
    try {
        const { id: sheetId } = req.params;
        const { userId, cellRestrictions, rowRestrictions, columnRestrictions, permission, cellRange } = req.body;
        if (req.user.role?.name !== 'admin') {
            const sheet = await models_1.Sheet.findByPk(sheetId);
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
        const user = await models_1.User.findByPk(userId);
        const sheet = await models_1.Sheet.findByPk(sheetId);
        if (!user || !sheet) {
            return res.status(404).json({
                error: 'Пользователь или таблица не найдены'
            });
        }
        const restrictions = {};
        if (rowRestrictions) {
            restrictions.rows = Array.isArray(rowRestrictions) ? rowRestrictions : [rowRestrictions];
        }
        if (columnRestrictions) {
            restrictions.columns = Array.isArray(columnRestrictions) ? columnRestrictions : [columnRestrictions];
        }
        if (cellRestrictions) {
            restrictions.cells = Array.isArray(cellRestrictions) ? cellRestrictions : [cellRestrictions];
        }
        if (cellRange) {
            restrictions.cellRange = cellRange;
        }
        const [userSheet, created] = await models_1.UserSheet.upsert({
            userId,
            sheetId,
            permission: permission || 'read',
            rowRestrictions: restrictions.rows ? JSON.stringify(restrictions.rows) : null,
            columnRestrictions: restrictions.columns ? JSON.stringify(restrictions.columns) : null
        });
        const result = await models_1.UserSheet.findByPk(userSheet.id, {
            include: [
                { model: models_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: models_1.Sheet, as: 'sheet', attributes: ['id', 'name'] }
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
    }
    catch (error) {
        console.error('Ошибка настройки детального доступа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при настройке детального доступа'
        });
    }
};
exports.setCellLevelAccess = setCellLevelAccess;
const getCellLevelAccess = async (req, res) => {
    try {
        const { sheetId } = req.params;
        if (req.user.role?.name !== 'admin') {
            const sheet = await models_1.Sheet.findByPk(sheetId);
            if (!sheet || sheet.createdBy !== req.user.id) {
                return res.status(403).json({
                    error: 'Недостаточно прав для просмотра настроек доступа'
                });
            }
        }
        const userSheets = await models_1.UserSheet.findAll({
            where: { sheetId },
            include: [
                { model: models_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });
        const accessList = userSheets.map((us) => ({
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
    }
    catch (error) {
        console.error('Ошибка получения прав доступа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении прав доступа'
        });
    }
};
exports.getCellLevelAccess = getCellLevelAccess;
const copySheetAccess = async (req, res) => {
    try {
        const { sourceSheetId, targetSheetId } = req.body;
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
        const sourceSheet = await models_1.Sheet.findByPk(sourceSheetId);
        const targetSheet = await models_1.Sheet.findByPk(targetSheetId);
        if (!sourceSheet || !targetSheet) {
            return res.status(404).json({
                error: 'Одна или обе таблицы не найдены'
            });
        }
        const sourceAccess = await models_1.UserSheet.findAll({
            where: { sheetId: sourceSheetId }
        });
        const targetAccessData = sourceAccess.map((access) => ({
            userId: access.userId,
            sheetId: targetSheetId,
            permission: access.permission,
            rowRestrictions: access.rowRestrictions,
            columnRestrictions: access.columnRestrictions
        }));
        await models_1.UserSheet.bulkCreate(targetAccessData, {
            updateOnDuplicate: ['permission', 'rowRestrictions', 'columnRestrictions', 'updatedAt']
        });
        res.json({
            message: `Скопировано ${sourceAccess.length} настроек доступа из таблицы "${sourceSheet.name}" в таблицу "${targetSheet.name}"`,
            copiedAccess: sourceAccess.length
        });
    }
    catch (error) {
        console.error('Ошибка копирования прав доступа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при копировании прав доступа'
        });
    }
};
exports.copySheetAccess = copySheetAccess;
const checkCellAccess = async (req, res) => {
    try {
        const { sheetId, row, column, userId } = req.body;
        if (!sheetId || row === undefined || column === undefined || !userId) {
            return res.status(400).json({
                error: 'ID таблицы, строка, столбец и ID пользователя обязательны'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId },
            include: [
                { model: models_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
                { model: models_1.Sheet, as: 'sheet', attributes: ['id', 'name'] }
            ]
        });
        let hasAccess = false;
        let accessLevel = 'none';
        let restrictions = {};
        if (userSheet) {
            accessLevel = userSheet.permission;
            if (userSheet.rowRestrictions) {
                const allowedRows = JSON.parse(userSheet.rowRestrictions);
                const rowAccess = allowedRows.includes(row) || allowedRows.includes('*');
                restrictions.rowAccess = rowAccess;
            }
            else {
                restrictions.rowAccess = true;
            }
            if (userSheet.columnRestrictions) {
                const allowedColumns = JSON.parse(userSheet.columnRestrictions);
                const columnAccess = allowedColumns.includes(column) || allowedColumns.includes('*');
                restrictions.columnAccess = columnAccess;
            }
            else {
                restrictions.columnAccess = true;
            }
            hasAccess = restrictions.rowAccess && restrictions.columnAccess;
        }
        res.json({
            hasAccess,
            accessLevel,
            restrictions,
            cell: { row, column },
            user: userSheet?.user,
            sheet: userSheet?.sheet
        });
    }
    catch (error) {
        console.error('Ошибка проверки доступа к ячейке:', error);
        res.status(500).json({
            error: 'Ошибка сервера при проверке доступа к ячейке'
        });
    }
};
exports.checkCellAccess = checkCellAccess;
const addColumn = async (req, res) => {
    try {
        const { id } = req.params;
        const { position } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasAdminAccess = sheet.createdBy === userId ||
            (userSheet && userSheet.permission === 'admin');
        if (!hasAdminAccess) {
            return res.status(403).json({
                error: 'Нет прав на изменение структуры таблицы'
            });
        }
        await sheet.update({
            columnCount: sheet.columnCount + 1
        });
        res.json({
            message: 'Столбец добавлен',
            sheet: await models_1.Sheet.findByPk(id)
        });
    }
    catch (error) {
        console.error('Ошибка добавления столбца:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.addColumn = addColumn;
const addRow = async (req, res) => {
    try {
        const { id } = req.params;
        const { position } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasAdminAccess = sheet.createdBy === userId ||
            (userSheet && userSheet.permission === 'admin');
        if (!hasAdminAccess) {
            return res.status(403).json({
                error: 'Нет прав на изменение структуры таблицы'
            });
        }
        await sheet.update({
            rowCount: sheet.rowCount + 1
        });
        res.json({
            message: 'Строка добавлена',
            sheet: await models_1.Sheet.findByPk(id)
        });
    }
    catch (error) {
        console.error('Ошибка добавления строки:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.addRow = addRow;
const getSheetMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasAccess = sheet.createdBy === userId || userSheet;
        if (!hasAccess) {
            return res.status(403).json({
                error: 'Нет доступа к таблице'
            });
        }
        const members = await models_1.UserSheet.findAll({
            where: { sheetId: id },
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });
        const creator = await models_1.User.findByPk(sheet.createdBy, {
            attributes: ['id', 'firstName', 'lastName', 'email']
        });
        res.json({
            members: [
                {
                    user: creator,
                    permission: 'owner',
                    joinedAt: sheet.createdAt
                },
                ...members.map((member) => ({
                    user: member.user,
                    permission: member.permission,
                    joinedAt: member.createdAt
                }))
            ]
        });
    }
    catch (error) {
        console.error('Ошибка получения участников:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getSheetMembers = getSheetMembers;
const inviteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, permission = 'read' } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasAdminAccess = sheet.createdBy === userId ||
            (userSheet && ['admin'].includes(userSheet.permission));
        if (!hasAdminAccess) {
            return res.status(403).json({
                error: 'Нет прав на приглашение участников'
            });
        }
        const invitedUser = await models_1.User.findOne({
            where: { email }
        });
        if (!invitedUser) {
            return res.status(404).json({
                error: 'Пользователь с таким email не найден'
            });
        }
        const existingMember = await models_1.UserSheet.findOne({
            where: { userId: invitedUser.id, sheetId: id }
        });
        if (existingMember) {
            return res.status(400).json({
                error: 'Пользователь уже является участником таблицы'
            });
        }
        await models_1.UserSheet.create({
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
    }
    catch (error) {
        console.error('Ошибка приглашения участника:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.inviteMember = inviteMember;
const resizeColumn = async (req, res) => {
    try {
        const { id } = req.params;
        const { column, width } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasAccess = sheet.createdBy === userId || userSheet;
        if (!hasAccess) {
            return res.status(403).json({
                error: 'Нет доступа к таблице'
            });
        }
        const currentSettings = sheet.settings || {};
        const columnSizes = currentSettings.columnSizes || {};
        columnSizes[column] = width;
        await sheet.update({
            settings: {
                ...currentSettings,
                columnSizes
            }
        });
        res.json({
            message: 'Размер столбца изменен',
            columnSizes
        });
    }
    catch (error) {
        console.error('Ошибка изменения размера столбца:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.resizeColumn = resizeColumn;
const resizeRow = async (req, res) => {
    try {
        const { id } = req.params;
        const { row, height } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(id);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId: id }
        });
        const hasAccess = sheet.createdBy === userId || userSheet;
        if (!hasAccess) {
            return res.status(403).json({
                error: 'Нет доступа к таблице'
            });
        }
        const currentSettings = sheet.settings || {};
        const rowSizes = currentSettings.rowSizes || {};
        rowSizes[row] = height;
        await sheet.update({
            settings: {
                ...currentSettings,
                rowSizes
            }
        });
        res.json({
            message: 'Размер строки изменен',
            rowSizes
        });
    }
    catch (error) {
        console.error('Ошибка изменения размера строки:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.resizeRow = resizeRow;
//# sourceMappingURL=sheetController.js.map