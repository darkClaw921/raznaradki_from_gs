"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const initializeAdmin = async () => {
    try {
        console.log('🔧 Инициализация администратора...');
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Администратор';
        const adminLastName = process.env.ADMIN_LAST_NAME || 'Системы';
        if (!adminEmail || !adminPassword) {
            console.log('⚠️  Переменные ADMIN_EMAIL и ADMIN_PASSWORD не установлены, пропускаем создание админа');
            return;
        }
        let adminRole = await models_1.Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            adminRole = await models_1.Role.create({
                name: 'admin',
                description: 'Системная роль администратора с полными правами',
                isSystem: true
            });
            console.log('✅ Создана роль администратора');
        }
        const existingAdmin = await models_1.User.findOne({ where: { email: adminEmail } });
        if (existingAdmin) {
            console.log('ℹ️  Администратор уже существует:', adminEmail);
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        const admin = await models_1.User.create({
            email: adminEmail,
            password: hashedPassword,
            firstName: adminFirstName,
            lastName: adminLastName,
            roleId: adminRole.id,
            isActive: true
        });
        console.log('✅ Администратор создан:', {
            email: admin.email,
            name: `${admin.firstName} ${admin.lastName}`,
            role: adminRole.name
        });
    }
    catch (error) {
        console.error('❌ Ошибка при инициализации администратора:', error);
        throw error;
    }
};
exports.initializeAdmin = initializeAdmin;
//# sourceMappingURL=initAdmin.js.map