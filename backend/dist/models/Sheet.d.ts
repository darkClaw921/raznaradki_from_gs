import { Model, Sequelize } from 'sequelize';
export interface SheetAttributes {
    id: number;
    name: string;
    description?: string;
    createdBy: number;
    isPublic: boolean;
    rowCount: number;
    columnCount: number;
    settings?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SheetCreationAttributes extends Omit<SheetAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class Sheet extends Model<SheetAttributes, SheetCreationAttributes> implements SheetAttributes {
    id: number;
    name: string;
    description?: string;
    createdBy: number;
    isPublic: boolean;
    rowCount: number;
    columnCount: number;
    settings?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare const SheetFactory: (sequelize: Sequelize) => typeof Sheet;
export {};
