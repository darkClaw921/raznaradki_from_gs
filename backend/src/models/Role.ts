import { DataTypes, Model, Sequelize } from 'sequelize';

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

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public isSystem!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const RoleFactory = (sequelize: Sequelize) => {
  Role.init(
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
      isSystem: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_system',
      },
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      timestamps: true,
      underscored: true,
    }
  );

  return Role;
}; 