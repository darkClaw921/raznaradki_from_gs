"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCells = exports.getCellHistory = exports.getCell = exports.updateCell = void 0;
const models_1 = require("../models");
const updateCell = async (req, res) => {
    try {
        const { sheetId, row, column } = req.params;
        const { value, formula, format } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(sheetId);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId }
        });
        const hasWriteAccess = sheet.createdBy === userId ||
            (userSheet && ['write', 'admin'].includes(userSheet.permission));
        if (!hasWriteAccess) {
            return res.status(403).json({
                error: 'Нет прав на редактирование ячеек'
            });
        }
        const rowNum = parseInt(row);
        const colNum = parseInt(column);
        const existingCell = await models_1.Cell.findOne({
            where: { sheetId, row: rowNum, column: colNum }
        });
        let cell = existingCell;
        if (cell) {
            let changeType = 'value';
            if (cell.formula !== formula && formula !== undefined) {
                changeType = 'formula';
            }
            else if (cell.value !== value && value !== undefined) {
                changeType = 'value';
            }
            else if (format && JSON.stringify(cell.format) !== JSON.stringify(format)) {
                changeType = 'format';
            }
            await models_1.CellHistory.create({
                cellId: cell.id,
                sheetId: parseInt(sheetId),
                row: rowNum,
                column: colNum,
                oldValue: cell.value,
                newValue: value,
                oldFormula: cell.formula,
                newFormula: formula,
                oldFormat: cell.format,
                newFormat: format,
                changedBy: userId,
                changeType
            });
            await cell.update({
                value: value || '',
                formula: formula || null,
                format: format || cell.format
            });
        }
        else {
            cell = await models_1.Cell.create({
                sheetId: parseInt(sheetId),
                row: rowNum,
                column: colNum,
                value: value || '',
                formula: formula || null,
                format: format || null,
                isLocked: false
            });
            await models_1.CellHistory.create({
                cellId: cell.id,
                sheetId: parseInt(sheetId),
                row: rowNum,
                column: colNum,
                oldValue: null,
                newValue: value,
                oldFormula: null,
                newFormula: formula,
                oldFormat: null,
                newFormat: format,
                changedBy: userId,
                changeType: 'create'
            });
        }
        res.json({
            message: 'Ячейка обновлена',
            cell
        });
    }
    catch (error) {
        console.error('Ошибка обновления ячейки:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.updateCell = updateCell;
const getCell = async (req, res) => {
    try {
        const { sheetId, row, column } = req.params;
        const cell = await models_1.Cell.findOne({
            where: {
                sheetId,
                row: parseInt(row),
                column: parseInt(column)
            }
        });
        res.json({
            cell: cell || {
                row: parseInt(row),
                column: parseInt(column),
                value: '',
                formula: null,
                format: null
            }
        });
    }
    catch (error) {
        console.error('Ошибка получения ячейки:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getCell = getCell;
const getCellHistory = async (req, res) => {
    try {
        const { sheetId, row, column } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const history = await models_1.CellHistory.findAll({
            where: {
                sheetId,
                row: parseInt(row),
                column: parseInt(column)
            },
            include: [
                {
                    model: models_1.User,
                    as: 'changedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        res.json({
            history,
            total: await models_1.CellHistory.count({
                where: {
                    sheetId,
                    row: parseInt(row),
                    column: parseInt(column)
                }
            })
        });
    }
    catch (error) {
        console.error('Ошибка получения истории ячейки:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.getCellHistory = getCellHistory;
const formatCells = async (req, res) => {
    try {
        const { sheetId } = req.params;
        const { startRow, endRow, startColumn, endColumn, format } = req.body;
        const userId = req.user.id;
        const sheet = await models_1.Sheet.findByPk(sheetId);
        if (!sheet) {
            return res.status(404).json({
                error: 'Таблица не найдена'
            });
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId }
        });
        const hasWriteAccess = sheet.createdBy === userId ||
            (userSheet && ['write', 'admin'].includes(userSheet.permission));
        if (!hasWriteAccess) {
            return res.status(403).json({
                error: 'Нет прав на редактирование форматирования'
            });
        }
        const updatedCells = [];
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startColumn; col <= endColumn; col++) {
                let cell = await models_1.Cell.findOne({
                    where: { sheetId, row, column: col }
                });
                if (cell) {
                    const oldFormat = cell.format;
                    const newFormat = { ...oldFormat, ...format };
                    await models_1.CellHistory.create({
                        cellId: cell.id,
                        sheetId: parseInt(sheetId),
                        row,
                        column: col,
                        oldValue: cell.value,
                        newValue: cell.value,
                        oldFormula: cell.formula,
                        newFormula: cell.formula,
                        oldFormat,
                        newFormat,
                        changedBy: userId,
                        changeType: 'format'
                    });
                    await cell.update({ format: newFormat });
                    updatedCells.push(cell);
                }
                else {
                    cell = await models_1.Cell.create({
                        sheetId: parseInt(sheetId),
                        row,
                        column: col,
                        value: '',
                        formula: null,
                        format,
                        isLocked: false
                    });
                    await models_1.CellHistory.create({
                        cellId: cell.id,
                        sheetId: parseInt(sheetId),
                        row,
                        column: col,
                        oldValue: null,
                        newValue: '',
                        oldFormula: null,
                        newFormula: null,
                        oldFormat: null,
                        newFormat: format,
                        changedBy: userId,
                        changeType: 'create'
                    });
                    updatedCells.push(cell);
                }
            }
        }
        res.json({
            message: 'Форматирование применено',
            updatedCells: updatedCells.length
        });
    }
    catch (error) {
        console.error('Ошибка применения форматирования:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.formatCells = formatCells;
//# sourceMappingURL=cellController.js.map