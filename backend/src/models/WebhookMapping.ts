import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WebhookMappingAttributes {
  id: number;
  sheetId: number;
  apartmentTitles: string; // JSON массив названий апартаментов
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WebhookMapping extends Model<WebhookMappingAttributes> implements WebhookMappingAttributes {
  public id!: number;
  public sheetId!: number;
  public apartmentTitles!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const WebhookMappingFactory = (sequelize: Sequelize) => {
  WebhookMapping.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sheetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sheets',
          key: 'id',
        },
      },
      apartmentTitles: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON array of apartment titles',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'WebhookMapping',
      tableName: 'webhook_mappings',
    }
  );

  return WebhookMapping;
}; 