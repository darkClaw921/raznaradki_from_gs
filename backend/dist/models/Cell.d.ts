import { Model, Sequelize } from 'sequelize';
export interface CellAttributes {
    id: number;
    sheetId: number;
    row: number;
    column: number;
    value?: string;
    formula?: string;
    format?: any;
    isLocked: boolean;
    mergedWith?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface CellCreationAttributes extends Omit<CellAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class Cell extends Model<CellAttributes, CellCreationAttributes> implements CellAttributes {
    id: number;
    sheetId: number;
    row: number;
    column: number;
    value?: string;
    formula?: string;
    format?: any;
    isLocked: boolean;
    mergedWith?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    get address(): string;
}
export declare const CellFactory: (sequelize: Sequelize) => typeof Cell;
export {};
