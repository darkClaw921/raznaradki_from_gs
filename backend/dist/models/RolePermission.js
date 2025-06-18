"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionFactory = void 0;
const sequelize_1 = require("sequelize");
class RolePermission extends sequelize_1.Model {
}
const RolePermissionFactory = (sequelize) => {
    RolePermission.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        roleId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'role_id',
        },
        permissionId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'permission_id',
        },
    }, {
        sequelize,
        modelName: 'RolePermission',
        tableName: 'role_permissions',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['role_id', 'permission_id'],
                unique: true,
            },
        ],
    });
    return RolePermission;
};
exports.RolePermissionFactory = RolePermissionFactory;
//# sourceMappingURL=RolePermission.js.map