import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CellHistoryAttributes {
  id: number;
  cellId: number;
  sheetId: number;
  row: number;
  column: number;
  oldValue?: string;
  newValue?: string;
  oldFormula?: string;
  newFormula?: string;
  oldFormat?: any;
  newFormat?: any;
  changedBy: number;
  changeType: 'value' | 'formula' | 'format' | 'create' | 'delete';
  createdAt?: Date;
}

export interface CellHistoryCreationAttributes extends Omit<CellHistoryAttributes, 'id' | 'createdAt'> {
  id?: number;
}

class CellHistory extends Model<CellHistoryAttributes, CellHistoryCreationAttributes> implements CellHistoryAttributes {
  public id!: number;
  public cellId!: number;
  public sheetId!: number;
  public row!: number;
  public column!: number;
  public oldValue?: string;
  public newValue?: string;
  public oldFormula?: string;
  public newFormula?: string;
  public oldFormat?: any;
  public newFormat?: any;
  public changedBy!: number;
  public changeType!: 'value' | 'formula' | 'format' | 'create' | 'delete';
  public readonly createdAt!: Date;
}

export const CellHistoryFactory = (sequelize: Sequelize) => {
  CellHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      cellId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'cell_id',
      },
      sheetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sheet_id',
      },
      row: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      column: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      oldValue: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'old_value',
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'new_value',
      },
      oldFormula: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'old_formula',
      },
      newFormula: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'new_formula',
      },
      oldFormat: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'old_format',
      },
      newFormat: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'new_format',
      },
      changedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'changed_by',
      },
      changeType: {
        type: DataTypes.ENUM('value', 'formula', 'format', 'create', 'delete'),
        allowNull: false,
        field: 'change_type',
      },
    },
    {
      sequelize,
      modelName: 'CellHistory',
      tableName: 'cell_history',
      timestamps: true,
      updatedAt: false,
      underscored: true,
      indexes: [
        {
          fields: ['cell_id'],
        },
        {
          fields: ['sheet_id', 'row', 'column'],
        },
        {
          fields: ['changed_by'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return CellHistory;
}; 