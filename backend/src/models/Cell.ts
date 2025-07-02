import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CellAttributes {
  id: number;
  sheetId: number;
  row: number;
  column: number;
  value?: string;
  formula?: string;
  format?: any;
  isLocked: boolean;
  mergedWith?: string;
  bookingId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CellCreationAttributes extends Omit<CellAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number;
}

class Cell extends Model<CellAttributes, CellCreationAttributes> implements CellAttributes {
  public id!: number;
  public sheetId!: number;
  public row!: number;
  public column!: number;
  public value?: string;
  public formula?: string;
  public format?: any;
  public isLocked!: boolean;
  public mergedWith?: string;
  public bookingId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const CellFactory = (sequelize: Sequelize) => {
  Cell.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sheetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sheet_id',
      },
      row: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      column: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Отображаемое значение ячейки',
      },
      formula: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Формула ячейки (если есть)',
      },
      format: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Форматирование ячейки (цвет, шрифт и т.д.)',
      },
      isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_locked',
      },
      mergedWith: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Ссылка на ячейку, с которой объединена текущая (формат: row-column)',
      },
      bookingId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'booking_id',
        comment: 'ID внешнего бронирования для связи с webhook данными',
      },
    },
    {
      sequelize,
      modelName: 'Cell',
      tableName: 'cells',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['sheet_id', 'row', 'column'],
          name: 'unique_cell_position'
        }
      ]
    }
  );

  return Cell;
};

export default Cell; 