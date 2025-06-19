import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ReportSourceAttributes {
  id: number;
  reportSheetId: number;
  sourceSheetId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSourceCreationAttributes {
  reportSheetId: number;
  sourceSheetId: number;
}

class ReportSource extends Model<ReportSourceAttributes, ReportSourceCreationAttributes> implements ReportSourceAttributes {
  public id!: number;
  public reportSheetId!: number;
  public sourceSheetId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof ReportSource {
    ReportSource.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        reportSheetId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'sheets',
            key: 'id',
          },
        },
        sourceSheetId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'sheets',
            key: 'id',
          },
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'report_sources',
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['reportSheetId', 'sourceSheetId'],
          },
        ],
      }
    );

    return ReportSource;
  }
}

export { ReportSource }; 