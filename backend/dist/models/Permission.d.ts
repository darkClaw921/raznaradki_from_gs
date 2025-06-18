import { Model, Sequelize } from 'sequelize';
export interface PermissionAttributes {
    id: number;
    name: string;
    description?: string;
    resource: string;
    action: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface PermissionCreationAttributes extends Omit<PermissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    id: number;
    name: string;
    description?: string;
    resource: string;
    action: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare const PermissionFactory: (sequelize: Sequelize) => typeof Permission;
export {};
