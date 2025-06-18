import { Sequelize } from 'sequelize';
import { UserFactory } from './User';
import { RoleFactory } from './Role';
import { PermissionFactory } from './Permission';
import { SheetFactory } from './Sheet';
import { CellFactory } from './Cell';
import { UserSheetFactory } from './UserSheet';
import { RolePermissionFactory } from './RolePermission';
import { CellHistoryFactory } from './CellHistory';

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
const User: any = UserFactory(sequelize);
const Role: any = RoleFactory(sequelize);
const Permission: any = PermissionFactory(sequelize);
const Sheet: any = SheetFactory(sequelize);
const Cell: any = CellFactory(sequelize);
const UserSheet: any = UserSheetFactory(sequelize);
const RolePermission: any = RolePermissionFactory(sequelize);
const CellHistory: any = CellHistoryFactory(sequelize);

// Определение ассоциаций
const setupAssociations = () => {
  // User - Role (многие к одному)
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

  // User - Sheet (многие ко многим через UserSheet)
  User.belongsToMany(Sheet, {
    through: UserSheet,
    foreignKey: 'userId',
    otherKey: 'sheetId',
    as: 'sheets'
  });
  Sheet.belongsToMany(User, {
    through: UserSheet,
    foreignKey: 'sheetId',
    otherKey: 'userId',
    as: 'users'
  });

  // Role - Permission (многие ко многим)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions'
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles'
  });

  // Sheet - Cell (один ко многим)
  Sheet.hasMany(Cell, { foreignKey: 'sheetId', as: 'cells' });
  Cell.belongsTo(Sheet, { foreignKey: 'sheetId', as: 'sheet' });

  // User - Sheet (создатель)
  Sheet.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  User.hasMany(Sheet, { foreignKey: 'createdBy', as: 'createdSheets' });

  // Прямые ассоциации для UserSheet (нужно для include)
  UserSheet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  UserSheet.belongsTo(Sheet, { foreignKey: 'sheetId', as: 'sheet' });
  User.hasMany(UserSheet, { foreignKey: 'userId', as: 'userSheets' });
  Sheet.hasMany(UserSheet, { foreignKey: 'sheetId', as: 'userSheets' });

  // Прямые ассоциации для RolePermission (нужно для include)
  RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  RolePermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'permission' });
  Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' });
  Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'permissionRoles' });

  // Ассоциации для CellHistory
  CellHistory.belongsTo(Cell, { foreignKey: 'cellId', as: 'cell' });
  CellHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'changedByUser' });
  CellHistory.belongsTo(Sheet, { foreignKey: 'sheetId', as: 'sheet' });
  Cell.hasMany(CellHistory, { foreignKey: 'cellId', as: 'history' });
  User.hasMany(CellHistory, { foreignKey: 'changedBy', as: 'cellChanges' });
  Sheet.hasMany(CellHistory, { foreignKey: 'sheetId', as: 'cellHistory' });
};

setupAssociations();

export {
  sequelize,
  User,
  Role,
  Permission,
  Sheet,
  Cell,
  UserSheet,
  RolePermission,
  CellHistory
}; 