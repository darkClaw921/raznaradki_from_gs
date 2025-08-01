import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SheetAttributes {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  isPublic: boolean;
  rowCount: number;
  columnCount: number;
  templateId?: number;
  sourceSheetId?: number;
  reportDate?: string;
  settings?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SheetCreationAttributes extends Omit<SheetAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number;
}

class Sheet extends Model<SheetAttributes, SheetCreationAttributes> implements SheetAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public createdBy!: number;
  public isPublic!: boolean;
  public rowCount!: number;
  public columnCount!: number;
  public templateId?: number;
  public sourceSheetId?: number;
  public reportDate?: string;
  public settings?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const SheetFactory = (sequelize: Sequelize) => {
  Sheet.init(
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
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_public',
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
      templateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'template_id',
      },
      sourceSheetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'source_sheet_id',
        comment: 'ID исходной таблицы для автоматического заполнения (используется в отчетах)',
      },
      reportDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'report_date',
        comment: 'Дата отчета для фильтрации связанных данных',
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Настройки таблицы (форматирование, фильтры и т.д.)',
      },
    },
    {
      sequelize,
      modelName: 'Sheet',
      tableName: 'sheets',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['created_by'],
        },
        {
          fields: ['name'],
        },
        {
          fields: ['source_sheet_id'],
        },
      ],
    }
  );

  return Sheet;
}; 