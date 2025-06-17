import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserSheetAttributes {
  id: number;
  userId: number;
  sheetId: number;
  permission: 'read' | 'write' | 'admin';
  rowRestrictions?: string;
  columnRestrictions?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSheetCreationAttributes extends Omit<UserSheetAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number;
}

class UserSheet extends Model<UserSheetAttributes, UserSheetCreationAttributes> implements UserSheetAttributes {
  public id!: number;
  public userId!: number;
  public sheetId!: number;
  public permission!: 'read' | 'write' | 'admin';
  public rowRestrictions?: string;
  public columnRestrictions?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const UserSheetFactory = (sequelize: Sequelize) => {
  UserSheet.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      sheetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sheet_id',
      },
      permission: {
        type: DataTypes.ENUM('read', 'write', 'admin'),
        allowNull: false,
        defaultValue: 'read',
      },
      rowRestrictions: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'row_restrictions',
        comment: 'JSON со списком разрешенных строк',
      },
      columnRestrictions: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'column_restrictions',
        comment: 'JSON со списком разрешенных столбцов',
      },
    },
    {
      sequelize,
      modelName: 'UserSheet',
      tableName: 'user_sheets',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id', 'sheet_id'],
          unique: true,
        },
      ],
    }
  );

  return UserSheet;
}; 