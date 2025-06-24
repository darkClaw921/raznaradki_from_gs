import { Sequelize } from 'sequelize';
import { UserFactory } from './User';
import { RoleFactory } from './Role';
import { PermissionFactory } from './Permission';
import { SheetFactory } from './Sheet';
import { CellFactory } from './Cell';
import { UserSheetFactory } from './UserSheet';
import { RolePermissionFactory } from './RolePermission';
import { CellHistoryFactory } from './CellHistory';
import { SheetTemplateFactory } from './SheetTemplate';
import { ReportSource } from './ReportSource';
import { SystemSettingsFactory } from './SystemSettings';
import { WebhookMappingFactory } from './WebhookMapping';

// Инициализация Sequelize
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'dmd_cottage_sheets',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Инициализация моделей
const UserModel = UserFactory(sequelize);
const RoleModel = RoleFactory(sequelize);
const PermissionModel = PermissionFactory(sequelize);
const SheetModel = SheetFactory(sequelize);
const CellModel = CellFactory(sequelize);
const UserSheetModel = UserSheetFactory(sequelize);
const RolePermissionModel = RolePermissionFactory(sequelize);
const CellHistoryModel = CellHistoryFactory(sequelize);
const SheetTemplateModel = SheetTemplateFactory(sequelize);
const ReportSourceModel = ReportSource.initModel(sequelize);
const SystemSettingsModel = SystemSettingsFactory(sequelize);
const WebhookMappingModel = WebhookMappingFactory(sequelize);

// Определение ассоциаций
const setupAssociations = () => {
  // User - Role (многие к одному)
  UserModel.belongsTo(RoleModel, { foreignKey: 'roleId', as: 'role' });
  RoleModel.hasMany(UserModel, { foreignKey: 'roleId', as: 'users' });

  // User - Sheet (многие ко многим через UserSheet)
  UserModel.belongsToMany(SheetModel, {
    through: UserSheetModel,
    foreignKey: 'userId',
    otherKey: 'sheetId',
    as: 'sheets'
  });
  SheetModel.belongsToMany(UserModel, {
    through: UserSheetModel,
    foreignKey: 'sheetId',
    otherKey: 'userId',
    as: 'users'
  });

  // Role - Permission (многие ко многим)
  RoleModel.belongsToMany(PermissionModel, {
    through: RolePermissionModel,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions'
  });
  PermissionModel.belongsToMany(RoleModel, {
    through: RolePermissionModel,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles'
  });

  // Sheet - Cell (один ко многим)
  SheetModel.hasMany(CellModel, { foreignKey: 'sheetId', as: 'cells' });
  CellModel.belongsTo(SheetModel, { foreignKey: 'sheetId', as: 'sheet' });

  // User - Sheet (создатель)
  SheetModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });
  UserModel.hasMany(SheetModel, { foreignKey: 'createdBy', as: 'createdSheets' });

  // Прямые ассоциации для UserSheet (нужно для include)
  UserSheetModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
  UserSheetModel.belongsTo(SheetModel, { foreignKey: 'sheetId', as: 'sheet' });
  UserModel.hasMany(UserSheetModel, { foreignKey: 'userId', as: 'userSheets' });
  SheetModel.hasMany(UserSheetModel, { foreignKey: 'sheetId', as: 'userSheets' });

  // Прямые ассоциации для RolePermission (нужно для include)
  RolePermissionModel.belongsTo(RoleModel, { foreignKey: 'roleId', as: 'role' });
  RolePermissionModel.belongsTo(PermissionModel, { foreignKey: 'permissionId', as: 'permission' });
  RoleModel.hasMany(RolePermissionModel, { foreignKey: 'roleId', as: 'rolePermissions' });
  PermissionModel.hasMany(RolePermissionModel, { foreignKey: 'permissionId', as: 'permissionRoles' });

  // Ассоциации для CellHistory
  CellHistoryModel.belongsTo(CellModel, { foreignKey: 'cellId', as: 'cell' });
  CellHistoryModel.belongsTo(UserModel, { foreignKey: 'changedBy', as: 'changedByUser' });
  CellHistoryModel.belongsTo(SheetModel, { foreignKey: 'sheetId', as: 'sheet' });
  CellModel.hasMany(CellHistoryModel, { foreignKey: 'cellId', as: 'history' });
  UserModel.hasMany(CellHistoryModel, { foreignKey: 'changedBy', as: 'cellChanges' });
  SheetModel.hasMany(CellHistoryModel, { foreignKey: 'sheetId', as: 'cellHistory' });

  // Sheet - SheetTemplate (один ко многим)
  SheetModel.belongsTo(SheetTemplateModel, { foreignKey: 'templateId', as: 'template' });
  SheetTemplateModel.hasMany(SheetModel, { foreignKey: 'templateId', as: 'sheets' });

  // Sheet - Sheet (самосвязь для источника данных)
  SheetModel.belongsTo(SheetModel, { foreignKey: 'sourceSheetId', as: 'sourceSheet' });
  SheetModel.hasMany(SheetModel, { foreignKey: 'sourceSheetId', as: 'dependentSheets' });

  // ReportSource ассоциации (многие ко многим между отчетами и журналами)
  SheetModel.belongsToMany(SheetModel, {
    through: ReportSourceModel,
    foreignKey: 'reportSheetId',
    otherKey: 'sourceSheetId',
    as: 'linkedSources'
  });
  SheetModel.belongsToMany(SheetModel, {
    through: ReportSourceModel,
    foreignKey: 'sourceSheetId',
    otherKey: 'reportSheetId',
    as: 'linkedReports'
  });
  
  // Прямые ассоциации для ReportSource
  ReportSourceModel.belongsTo(SheetModel, { foreignKey: 'reportSheetId', as: 'reportSheet' });
  ReportSourceModel.belongsTo(SheetModel, { foreignKey: 'sourceSheetId', as: 'sourceSheet' });
  SheetModel.hasMany(ReportSourceModel, { foreignKey: 'reportSheetId', as: 'reportSources' });
  SheetModel.hasMany(ReportSourceModel, { foreignKey: 'sourceSheetId', as: 'sourceReports' });

  // WebhookMapping associations  
  SheetModel.hasOne(WebhookMappingModel, { foreignKey: 'sheetId', as: 'webhookMapping' });
  WebhookMappingModel.belongsTo(SheetModel, { foreignKey: 'sheetId', as: 'sheet' });
};

setupAssociations();

export {
  sequelize,
  UserModel as User,
  RoleModel as Role,
  PermissionModel as Permission,
  SheetModel as Sheet,
  CellModel as Cell,
  UserSheetModel as UserSheet,
  RolePermissionModel as RolePermission,
  CellHistoryModel as CellHistory,
  SheetTemplateModel as SheetTemplate,
  ReportSourceModel as ReportSource,
  SystemSettingsModel as SystemSettings,
  WebhookMappingModel as WebhookMapping,
}; 