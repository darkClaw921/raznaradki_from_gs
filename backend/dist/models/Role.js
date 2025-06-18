"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleFactory = void 0;
const sequelize_1 = require("sequelize");
class Role extends sequelize_1.Model {
}
const RoleFactory = (sequelize) => {
    Role.init({
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
        isSystem: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_system',
        },
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: true,
        underscored: true,
    });
    return Role;
};
exports.RoleFactory = RoleFactory;
//# sourceMappingURL=Role.js.map