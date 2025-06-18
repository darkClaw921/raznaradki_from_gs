import { Model, Sequelize } from 'sequelize';
export interface CellHistoryAttributes {
    id: number;
    cellId: number;
    sheetId: number;
    row: number;
    column: number;
    oldValue?: string;
    newValue?: string;
    oldFormula?: string;
    newFormula?: string;
    oldFormat?: any;
    newFormat?: any;
    changedBy: number;
    changeType: 'value' | 'formula' | 'format' | 'create' | 'delete';
    createdAt?: Date;
}
export interface CellHistoryCreationAttributes extends Omit<CellHistoryAttributes, 'id' | 'createdAt'> {
    id?: number;
}
declare class CellHistory extends Model<CellHistoryAttributes, CellHistoryCreationAttributes> implements CellHistoryAttributes {
    id: number;
    cellId: number;
    sheetId: number;
    row: number;
    column: number;
    oldValue?: string;
    newValue?: string;
    oldFormula?: string;
    newFormula?: string;
    oldFormat?: any;
    newFormat?: any;
    changedBy: number;
    changeType: 'value' | 'formula' | 'format' | 'create' | 'delete';
    readonly createdAt: Date;
}
export declare const CellHistoryFactory: (sequelize: Sequelize) => typeof CellHistory;
export {};
