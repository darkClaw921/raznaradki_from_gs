"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSheetFactory = void 0;
const sequelize_1 = require("sequelize");
class UserSheet extends sequelize_1.Model {
}
const UserSheetFactory = (sequelize) => {
    UserSheet.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
        },
        sheetId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'sheet_id',
        },
        permission: {
            type: sequelize_1.DataTypes.ENUM('read', 'write', 'admin'),
            allowNull: false,
            defaultValue: 'read',
        },
        rowRestrictions: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'row_restrictions',
            comment: 'JSON со списком разрешенных строк',
        },
        columnRestrictions: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'column_restrictions',
            comment: 'JSON со списком разрешенных столбцов',
        },
    }, {
        sequelize,
        modelName: 'UserSheet',
        tableName: 'user_sheets',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['user_id', 'sheet_id'],
                unique: true,
            },
        ],
    });
    return UserSheet;
};
exports.UserSheetFactory = UserSheetFactory;
//# sourceMappingURL=UserSheet.js.map