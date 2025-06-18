import { Model, Sequelize } from 'sequelize';
export interface RolePermissionAttributes {
    id: number;
    roleId: number;
    permissionId: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface RolePermissionCreationAttributes extends Omit<RolePermissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
    id: number;
    roleId: number;
    permissionId: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare const RolePermissionFactory: (sequelize: Sequelize) => typeof RolePermission;
export {};
