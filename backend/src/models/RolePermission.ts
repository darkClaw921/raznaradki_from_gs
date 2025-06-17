import { DataTypes, Model, Sequelize } from 'sequelize';

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

class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  public id!: number;
  public roleId!: number;
  public permissionId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const RolePermissionFactory = (sequelize: Sequelize) => {
  RolePermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'role_id',
      },
      permissionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'permission_id',
      },
    },
    {
      sequelize,
      modelName: 'RolePermission',
      tableName: 'role_permissions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['role_id', 'permission_id'],
          unique: true,
        },
      ],
    }
  );

  return RolePermission;
}; 