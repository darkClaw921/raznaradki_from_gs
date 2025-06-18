import { Model, Sequelize } from 'sequelize';
export interface RoleAttributes {
    id: number;
    name: string;
    description?: string;
    isSystem: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface RoleCreationAttributes extends Omit<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: number;
    name: string;
    description?: string;
    isSystem: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare const RoleFactory: (sequelize: Sequelize) => typeof Role;
export {};
