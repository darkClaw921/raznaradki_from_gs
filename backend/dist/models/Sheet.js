"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetFactory = void 0;
const sequelize_1 = require("sequelize");
class Sheet extends sequelize_1.Model {
}
const SheetFactory = (sequelize) => {
    Sheet.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'created_by',
        },
        isPublic: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_public',
        },
        rowCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 100,
            field: 'row_count',
        },
        columnCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 26,
            field: 'column_count',
        },
        settings: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            comment: 'Настройки таблицы (форматирование, фильтры и т.д.)',
        },
    }, {
        sequelize,
        modelName: 'Sheet',
        tableName: 'sheets',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['created_by'],
            },
            {
                fields: ['name'],
            },
        ],
    });
    return Sheet;
};
exports.SheetFactory = SheetFactory;
//# sourceMappingURL=Sheet.js.map