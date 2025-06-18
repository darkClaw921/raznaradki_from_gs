"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFactory = void 0;
const sequelize_1 = require("sequelize");
class User extends sequelize_1.Model {
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
const UserFactory = (sequelize) => {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        firstName: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            field: 'first_name',
        },
        lastName: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            field: 'last_name',
        },
        roleId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'role_id',
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
        lastLoginAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            field: 'last_login_at',
        },
        invitedBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            field: 'invited_by',
        },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['email'],
                unique: true,
            },
            {
                fields: ['role_id'],
            },
        ],
    });
    return User;
};
exports.UserFactory = UserFactory;
//# sourceMappingURL=User.js.map