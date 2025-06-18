import { Model, Sequelize } from 'sequelize';
export interface UserSheetAttributes {
    id: number;
    userId: number;
    sheetId: number;
    permission: 'read' | 'write' | 'admin';
    rowRestrictions?: string;
    columnRestrictions?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserSheetCreationAttributes extends Omit<UserSheetAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class UserSheet extends Model<UserSheetAttributes, UserSheetCreationAttributes> implements UserSheetAttributes {
    id: number;
    userId: number;
    sheetId: number;
    permission: 'read' | 'write' | 'admin';
    rowRestrictions?: string;
    columnRestrictions?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare const UserSheetFactory: (sequelize: Sequelize) => typeof UserSheet;
export {};
