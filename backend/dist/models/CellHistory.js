"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellHistoryFactory = void 0;
const sequelize_1 = require("sequelize");
class CellHistory extends sequelize_1.Model {
}
const CellHistoryFactory = (sequelize) => {
    CellHistory.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cellId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'cell_id',
        },
        sheetId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'sheet_id',
        },
        row: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        column: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        oldValue: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'old_value',
        },
        newValue: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'new_value',
        },
        oldFormula: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'old_formula',
        },
        newFormula: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'new_formula',
        },
        oldFormat: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            field: 'old_format',
        },
        newFormat: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            field: 'new_format',
        },
        changedBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'changed_by',
        },
        changeType: {
            type: sequelize_1.DataTypes.ENUM('value', 'formula', 'format', 'create', 'delete'),
            allowNull: false,
            field: 'change_type',
        },
    }, {
        sequelize,
        modelName: 'CellHistory',
        tableName: 'cell_history',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                fields: ['cell_id'],
            },
            {
                fields: ['sheet_id', 'row', 'column'],
            },
            {
                fields: ['changed_by'],
            },
            {
                fields: ['created_at'],
            },
        ],
    });
    return CellHistory;
};
exports.CellHistoryFactory = CellHistoryFactory;
//# sourceMappingURL=CellHistory.js.map