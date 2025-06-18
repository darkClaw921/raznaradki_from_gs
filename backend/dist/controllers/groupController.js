"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGroupSheetAccess = exports.deleteGroup = exports.removeUsersFromGroup = exports.addUsersToGroup = exports.updateGroup = exports.getGroups = exports.createUserGroup = void 0;
const models_1 = require("../models");
const createUserGroup = async (req, res) => {
    try {
        const { name, description, userIds, defaultPermissions } = req.body;
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
        const role = await models_1.Role.create({
            name,
            description: description || `Группа: ${name}`,
            isSystem: false
        });
        let groupUsers = [];
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            await models_1.User.update({ roleId: role.id }, { where: { id: userIds } });
            groupUsers = await models_1.User.findAll({
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
    }
    catch (error) {
        console.error('Ошибка создания группы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при создании группы'
        });
    }
};
exports.createUserGroup = createUserGroup;
const getGroups = async (req, res) => {
    try {
        if (req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const groups = await models_1.Role.findAll({
            where: { isSystem: false },
            include: [
                {
                    model: models_1.User,
                    as: 'users',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'isActive']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ groups });
    }
    catch (error) {
        console.error('Ошибка получения групп:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении групп'
        });
    }
};
exports.getGroups = getGroups;
const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, userIds } = req.body;
        if (req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const role = await models_1.Role.findByPk(id);
        if (!role || role.isSystem) {
            return res.status(404).json({
                error: 'Группа не найдена или является системной'
            });
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (description)
            updateData.description = description;
        await role.update(updateData);
        if (userIds && Array.isArray(userIds)) {
            await models_1.User.update({ roleId: null }, { where: { roleId: id } });
            if (userIds.length > 0) {
                await models_1.User.update({ roleId: id }, { where: { id: userIds } });
            }
        }
        const updatedGroup = await models_1.Role.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'users',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'isActive']
                }
            ]
        });
        res.json({
            message: 'Группа обновлена',
            group: updatedGroup
        });
    }
    catch (error) {
        console.error('Ошибка обновления группы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при обновлении группы'
        });
    }
};
exports.updateGroup = updateGroup;
const addUsersToGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;
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
        const role = await models_1.Role.findByPk(id);
        if (!role || role.isSystem) {
            return res.status(404).json({
                error: 'Группа не найдена или является системной'
            });
        }
        await models_1.User.update({ roleId: id }, { where: { id: userIds } });
        const addedUsers = await models_1.User.findAll({
            where: { id: userIds },
            attributes: { exclude: ['password'] },
            include: ['role']
        });
        res.json({
            message: `Добавлено ${addedUsers.length} пользователей в группу`,
            users: addedUsers
        });
    }
    catch (error) {
        console.error('Ошибка добавления пользователей в группу:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.addUsersToGroup = addUsersToGroup;
const removeUsersFromGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;
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
        const defaultRole = await models_1.Role.findOne({ where: { name: 'user' } });
        await models_1.User.update({ roleId: defaultRole?.id || null }, { where: { id: userIds, roleId: id } });
        res.json({
            message: `Удалено ${userIds.length} пользователей из группы`
        });
    }
    catch (error) {
        console.error('Ошибка удаления пользователей из группы:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.removeUsersFromGroup = removeUsersFromGroup;
const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const role = await models_1.Role.findByPk(id);
        if (!role || role.isSystem) {
            return res.status(404).json({
                error: 'Группа не найдена или является системной'
            });
        }
        const defaultRole = await models_1.Role.findOne({ where: { name: 'user' } });
        await models_1.User.update({ roleId: defaultRole?.id || null }, { where: { roleId: id } });
        await role.destroy();
        res.json({
            message: 'Группа удалена'
        });
    }
    catch (error) {
        console.error('Ошибка удаления группы:', error);
        res.status(500).json({
            error: 'Ошибка сервера при удалении группы'
        });
    }
};
exports.deleteGroup = deleteGroup;
const setGroupSheetAccess = async (req, res) => {
    try {
        const { groupId, sheetId, permission, rowRestrictions, columnRestrictions } = req.body;
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
        const role = await models_1.Role.findByPk(groupId);
        const sheet = await models_1.Sheet.findByPk(sheetId);
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
        const groupUsers = await models_1.User.findAll({
            where: { roleId: groupId },
            attributes: ['id']
        });
        const userIds = groupUsers.map((user) => user.id);
        const accessData = userIds.map((userId) => ({
            userId,
            sheetId: parseInt(sheetId),
            permission: permission || 'read',
            rowRestrictions: rowRestrictions ? JSON.stringify(rowRestrictions) : null,
            columnRestrictions: columnRestrictions ? JSON.stringify(columnRestrictions) : null
        }));
        await models_1.UserSheet.bulkCreate(accessData, {
            updateOnDuplicate: ['permission', 'rowRestrictions', 'columnRestrictions', 'updatedAt']
        });
        res.json({
            message: `Настроен доступ для группы "${role.name}" к таблице "${sheet.name}"`,
            affectedUsers: userIds.length
        });
    }
    catch (error) {
        console.error('Ошибка настройки групповых прав:', error);
        res.status(500).json({
            error: 'Ошибка сервера при настройке групповых прав'
        });
    }
};
exports.setGroupSheetAccess = setGroupSheetAccess;
//# sourceMappingURL=groupController.js.map