import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SystemSettingsAttributes {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SystemSettings extends Model<SystemSettingsAttributes> implements SystemSettingsAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const SystemSettingsFactory = (sequelize: Sequelize) => {
  SystemSettings.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SystemSettings',
      tableName: 'system_settings',
    }
  );

  return SystemSettings;
}; 