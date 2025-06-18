"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionFactory = void 0;
const sequelize_1 = require("sequelize");
class Permission extends sequelize_1.Model {
}
const PermissionFactory = (sequelize) => {
    Permission.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        resource: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            comment: 'Ресурс (sheet, cell, user)',
        },
        action: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            comment: 'Действие (read, write, delete, manage)',
        },
    }, {
        sequelize,
        modelName: 'Permission',
        tableName: 'permissions',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['resource', 'action'],
                unique: true,
            },
        ],
    });
    return Permission;
};
exports.PermissionFactory = PermissionFactory;
//# sourceMappingURL=Permission.js.map