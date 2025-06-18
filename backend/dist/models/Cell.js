"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellFactory = void 0;
const sequelize_1 = require("sequelize");
class Cell extends sequelize_1.Model {
    get address() {
        const columnLetter = String.fromCharCode(65 + this.column);
        return `${columnLetter}${this.row + 1}`;
    }
}
const CellFactory = (sequelize) => {
    Cell.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        sheetId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'sheet_id',
        },
        row: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        column: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        value: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Отображаемое значение ячейки',
        },
        formula: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Формула ячейки (если есть)',
        },
        format: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            comment: 'Форматирование ячейки (цвет, шрифт и т.д.)',
        },
        isLocked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_locked',
        },
        mergedWith: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: true,
            field: 'merged_with',
            comment: 'Адрес главной ячейки при объединении',
        },
    }, {
        sequelize,
        modelName: 'Cell',
        tableName: 'cells',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['sheet_id', 'row', 'column'],
                unique: true,
            },
            {
                fields: ['sheet_id'],
            },
        ],
    });
    return Cell;
};
exports.CellFactory = CellFactory;
//# sourceMappingURL=Cell.js.map