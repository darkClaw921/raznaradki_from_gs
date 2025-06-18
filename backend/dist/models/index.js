"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellHistory = exports.RolePermission = exports.UserSheet = exports.Cell = exports.Sheet = exports.Permission = exports.Role = exports.User = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const Role_1 = require("./Role");
const Permission_1 = require("./Permission");
const Sheet_1 = require("./Sheet");
const Cell_1 = require("./Cell");
const UserSheet_1 = require("./UserSheet");
const RolePermission_1 = require("./RolePermission");
const CellHistory_1 = require("./CellHistory");
const sequelize = new sequelize_1.Sequelize({
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
exports.sequelize = sequelize;
const User = (0, User_1.UserFactory)(sequelize);
exports.User = User;
const Role = (0, Role_1.RoleFactory)(sequelize);
exports.Role = Role;
const Permission = (0, Permission_1.PermissionFactory)(sequelize);
exports.Permission = Permission;
const Sheet = (0, Sheet_1.SheetFactory)(sequelize);
exports.Sheet = Sheet;
const Cell = (0, Cell_1.CellFactory)(sequelize);
exports.Cell = Cell;
const UserSheet = (0, UserSheet_1.UserSheetFactory)(sequelize);
exports.UserSheet = UserSheet;
const RolePermission = (0, RolePermission_1.RolePermissionFactory)(sequelize);
exports.RolePermission = RolePermission;
const CellHistory = (0, CellHistory_1.CellHistoryFactory)(sequelize);
exports.CellHistory = CellHistory;
const setupAssociations = () => {
    User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
    Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
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
    Sheet.hasMany(Cell, { foreignKey: 'sheetId', as: 'cells' });
    Cell.belongsTo(Sheet, { foreignKey: 'sheetId', as: 'sheet' });
    Sheet.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    User.hasMany(Sheet, { foreignKey: 'createdBy', as: 'createdSheets' });
    UserSheet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    UserSheet.belongsTo(Sheet, { foreignKey: 'sheetId', as: 'sheet' });
    User.hasMany(UserSheet, { foreignKey: 'userId', as: 'userSheets' });
    Sheet.hasMany(UserSheet, { foreignKey: 'sheetId', as: 'userSheets' });
    RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
    RolePermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'permission' });
    Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' });
    Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'permissionRoles' });
    CellHistory.belongsTo(Cell, { foreignKey: 'cellId', as: 'cell' });
    CellHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'changedByUser' });
    CellHistory.belongsTo(Sheet, { foreignKey: 'sheetId', as: 'sheet' });
    Cell.hasMany(CellHistory, { foreignKey: 'cellId', as: 'history' });
    User.hasMany(CellHistory, { foreignKey: 'changedBy', as: 'cellChanges' });
    Sheet.hasMany(CellHistory, { foreignKey: 'sheetId', as: 'cellHistory' });
};
setupAssociations();
//# sourceMappingURL=index.js.map