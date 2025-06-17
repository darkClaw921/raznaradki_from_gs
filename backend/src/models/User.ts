import { DataTypes, Model, Sequelize } from 'sequelize';

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

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public roleId!: number;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public invitedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Виртуальное поле для полного имени
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const UserFactory = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'role_id',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at',
      },
      invitedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'invited_by',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['email'],
          unique: true,
        },
        {
          fields: ['role_id'],
        },
      ],
    }
  );

  return User;
}; 