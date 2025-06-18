import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SheetTemplateAttributes {
  id: number;
  name: string;
  description: string;
  category: string;
  structure: any; // JSON со структурой таблицы (заголовки, данные, форматирование)
  rowCount: number;
  columnCount: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SheetTemplate extends Model<SheetTemplateAttributes> implements SheetTemplateAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public category!: string;
  public structure!: any;
  public rowCount!: number;
  public columnCount!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const SheetTemplateFactory = (sequelize: Sequelize) => {
  SheetTemplate.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Категория шаблона (hotel, finance, project, etc.)',
      },
      structure: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'JSON структура таблицы: заголовки, примеры данных, форматирование',
      },
      rowCount: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        field: 'row_count',
      },
      columnCount: {
        type: DataTypes.INTEGER,
        defaultValue: 26,
        field: 'column_count',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      modelName: 'SheetTemplate',
      tableName: 'sheet_templates',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['category'],
        },
        {
          fields: ['is_active'],
        },
      ],
    }
  );

  return SheetTemplate;
}; 