import { DataTypes, Model, Sequelize } from 'sequelize';

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

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public resource!: string;
  public action!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const PermissionFactory = (sequelize: Sequelize) => {
  Permission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resource: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Ресурс (sheet, cell, user)',
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Действие (read, write, delete, manage)',
      },
    },
    {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['resource', 'action'],
          unique: true,
        },
      ],
    }
  );

  return Permission;
}; 