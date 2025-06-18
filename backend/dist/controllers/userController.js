"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAccess = exports.removeUserSheetAccess = exports.setUserSheetAccess = exports.bulkUpdateUsers = exports.inviteUser = exports.createUser = exports.deactivateUser = exports.updateUser = exports.getUser = exports.getUsers = void 0;
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const getUsers = async (req, res) => {
    try {
        const users = await models_1.User.findAll({
            include: ['role'],
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json({ users });
    }
    catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await models_1.User.findByPk(id, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден'
            });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getUser = getUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, roleId, isActive } = req.body;
        const currentUserId = req.user.id;
        if (currentUserId !== parseInt(id) && req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const user = await models_1.User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден'
            });
        }
        const updateData = {};
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (req.user.role?.name === 'admin') {
            if (roleId !== undefined)
                updateData.roleId = roleId;
            if (isActive !== undefined)
                updateData.isActive = isActive;
        }
        await user.update(updateData);
        const updatedUser = await models_1.User.findByPk(id, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        res.json({
            message: 'Пользователь обновлен',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Ошибка обновления пользователя:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.updateUser = updateUser;
const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const user = await models_1.User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден'
            });
        }
        await user.update({ isActive: false });
        res.json({
            message: 'Пользователь деактивирован'
        });
    }
    catch (error) {
        console.error('Ошибка деактивации пользователя:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.deactivateUser = deactivateUser;
const createUser = async (req, res) => {
    try {
        const { email, firstName, lastName, roleId, password, isActive = true } = req.body;
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
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                error: 'Пользователь с таким email уже существует'
            });
        }
        let userRoleId = roleId;
        if (!userRoleId) {
            const defaultRole = await models_1.Role.findOne({ where: { name: 'user' } });
            userRoleId = defaultRole?.id;
        }
        const tempPassword = password || crypto_1.default.randomBytes(8).toString('hex');
        const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
        const user = await models_1.User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            roleId: userRoleId,
            isActive
        });
        const createdUser = await models_1.User.findByPk(user.id, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        res.status(201).json({
            message: 'Пользователь создан успешно',
            user: createdUser,
            tempPassword: password ? undefined : tempPassword
        });
    }
    catch (error) {
        console.error('Ошибка создания пользователя:', error);
        res.status(500).json({
            error: 'Ошибка сервера при создании пользователя'
        });
    }
};
exports.createUser = createUser;
const inviteUser = async (req, res) => {
    try {
        const { email, firstName, lastName, roleId, message } = req.body;
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
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                error: 'Пользователь с таким email уже существует'
            });
        }
        const inviteToken = crypto_1.default.randomBytes(32).toString('hex');
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
    }
    catch (error) {
        console.error('Ошибка отправки приглашения:', error);
        res.status(500).json({
            error: 'Ошибка сервера при отправке приглашения'
        });
    }
};
exports.inviteUser = inviteUser;
const bulkUpdateUsers = async (req, res) => {
    try {
        const { userIds, updates } = req.body;
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
        const updateData = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = updates[key];
            }
        });
        await models_1.User.update(updateData, {
            where: {
                id: userIds
            }
        });
        const updatedUsers = await models_1.User.findAll({
            where: { id: userIds },
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        res.json({
            message: `Обновлено ${updatedUsers.length} пользователей`,
            users: updatedUsers
        });
    }
    catch (error) {
        console.error('Ошибка массового обновления:', error);
        res.status(500).json({
            error: 'Ошибка сервера при массовом обновлении'
        });
    }
};
exports.bulkUpdateUsers = bulkUpdateUsers;
const setUserSheetAccess = async (req, res) => {
    try {
        const { userId, sheetId, permission, rowRestrictions, columnRestrictions } = req.body;
        if (req.user.role?.name !== 'admin') {
            const sheet = await models_1.Sheet.findByPk(sheetId);
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
        const user = await models_1.User.findByPk(userId);
        const sheet = await models_1.Sheet.findByPk(sheetId);
        if (!user || !sheet) {
            return res.status(404).json({
                error: 'Пользователь или таблица не найдены'
            });
        }
        const [userSheet, created] = await models_1.UserSheet.upsert({
            userId,
            sheetId,
            permission: permission || 'read',
            rowRestrictions: rowRestrictions ? JSON.stringify(rowRestrictions) : null,
            columnRestrictions: columnRestrictions ? JSON.stringify(columnRestrictions) : null
        });
        const result = await models_1.UserSheet.findByPk(userSheet.id, {
            include: [
                { model: models_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: models_1.Sheet, as: 'sheet', attributes: ['id', 'name'] }
            ]
        });
        res.json({
            message: created ? 'Доступ предоставлен' : 'Доступ обновлен',
            userSheet: result
        });
    }
    catch (error) {
        console.error('Ошибка настройки доступа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при настройке доступа'
        });
    }
};
exports.setUserSheetAccess = setUserSheetAccess;
const removeUserSheetAccess = async (req, res) => {
    try {
        const { userId, sheetId } = req.body;
        if (req.user.role?.name !== 'admin') {
            const sheet = await models_1.Sheet.findByPk(sheetId);
            if (!sheet || sheet.createdBy !== req.user.id) {
                return res.status(403).json({
                    error: 'Недостаточно прав для управления этой таблицей'
                });
            }
        }
        const deleted = await models_1.UserSheet.destroy({
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
    }
    catch (error) {
        console.error('Ошибка удаления доступа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при удалении доступа'
        });
    }
};
exports.removeUserSheetAccess = removeUserSheetAccess;
const getUserAccess = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role?.name !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const userSheets = await models_1.UserSheet.findAll({
            where: { userId: id },
            include: [
                {
                    model: models_1.Sheet,
                    as: 'sheet',
                    attributes: ['id', 'name', 'description', 'isPublic'],
                    include: [
                        { model: models_1.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
                    ]
                }
            ]
        });
        res.json({
            userAccess: userSheets.map((us) => ({
                sheet: us.sheet,
                permission: us.permission,
                rowRestrictions: us.rowRestrictions ? JSON.parse(us.rowRestrictions) : null,
                columnRestrictions: us.columnRestrictions ? JSON.parse(us.columnRestrictions) : null,
                grantedAt: us.createdAt
            }))
        });
    }
    catch (error) {
        console.error('Ошибка получения доступов:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении доступов'
        });
    }
};
exports.getUserAccess = getUserAccess;
//# sourceMappingURL=userController.js.map