import { Model, Sequelize } from 'sequelize';
export interface UserAttributes {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
    isActive: boolean;
    lastLoginAt?: Date;
    invitedBy?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    id?: number;
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
    isActive: boolean;
    lastLoginAt?: Date;
    invitedBy?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    get fullName(): string;
}
export declare const UserFactory: (sequelize: Sequelize) => typeof User;
export {};
