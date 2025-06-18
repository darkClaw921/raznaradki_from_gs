"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = exports.updateRole = exports.createRole = exports.getRoles = void 0;
const models_1 = require("../models");
const getRoles = async (req, res) => {
    try {
        const roles = await models_1.Role.findAll({
            include: ['permissions'],
            order: [['createdAt', 'ASC']]
        });
        res.json({ roles });
    }
    catch (error) {
        console.error('Ошибка получения ролей:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getRoles = getRoles;
const createRole = async (req, res) => {
    try {
        const { name, description, permissionIds = [] } = req.body;
        if (req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        if (!name) {
            return res.status(400).json({
                error: 'Название роли обязательно'
            });
        }
        const existingRole = await models_1.Role.findOne({ where: { name } });
        if (existingRole) {
            return res.status(409).json({
                error: 'Роль с таким названием уже существует'
            });
        }
        const role = await models_1.Role.create({
            name,
            description,
            isSystem: false
        });
        if (permissionIds.length > 0) {
            const permissions = await models_1.Permission.findAll({
                where: { id: permissionIds }
            });
            await models_1.RolePermission.bulkCreate(permissions.map((permission) => ({
                roleId: role.id,
                permissionId: permission.id
            })));
        }
        const createdRole = await models_1.Role.findByPk(role.id, {
            include: ['permissions']
        });
        res.status(201).json({
            message: 'Роль создана',
            role: createdRole
        });
    }
    catch (error) {
        console.error('Ошибка создания роли:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissionIds } = req.body;
        if (req.user.role?.name !== 'admin') {
            return res.status(403).json({
                error: 'Недостаточно прав'
            });
        }
        const role = await models_1.Role.findByPk(id);
        if (!role) {
            return res.status(404).json({
                error: 'Роль не найдена'
            });
        }
        if (role.isSystem) {
            return res.status(403).json({
                error: 'Системные роли нельзя изменять'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        await role.update(updateData);
        if (permissionIds !== undefined) {
            await models_1.RolePermission.destroy({
                where: { roleId: role.id }
            });
            if (permissionIds.length > 0) {
                const permissions = await models_1.Permission.findAll({
                    where: { id: permissionIds }
                });
                await models_1.RolePermission.bulkCreate(permissions.map((permission) => ({
                    roleId: role.id,
                    permissionId: permission.id
                })));
            }
        }
        const updatedRole = await models_1.Role.findByPk(id, {
            include: ['permissions']
        });
        res.json({
            message: 'Роль обновлена',
            role: updatedRole
        });
    }
    catch (error) {
        console.error('Ошибка обновления роли:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.updateRole = updateRole;
const getPermissions = async (req, res) => {
    try {
        const permissions = await models_1.Permission.findAll({
            order: [['resource', 'ASC'], ['action', 'ASC']]
        });
        res.json({ permissions });
    }
    catch (error) {
        console.error('Ошибка получения разрешений:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getPermissions = getPermissions;
//# sourceMappingURL=roleController.js.map