"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateUser = exports.inviteUser = exports.me = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const generateToken = (payload) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET не установлен');
    }
    return jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, roleId = 3 } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Все поля обязательны для заполнения'
            });
        }
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                error: 'Пользователь с таким email уже существует'
            });
        }
        const role = await models_1.Role.findByPk(roleId);
        if (!role) {
            return res.status(400).json({
                error: 'Указанная роль не найдена'
            });
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await models_1.User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            roleId,
            isActive: true,
            invitedBy: req.user?.id || null
        });
        const userWithRole = await models_1.User.findByPk(user.id, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        const token = generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.roleId
        });
        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: userWithRole,
            token
        });
    }
    catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({
            error: 'Ошибка сервера при регистрации'
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email и пароль обязательны'
            });
        }
        const user = await models_1.User.findOne({
            where: { email },
            include: ['role']
        });
        if (!user) {
            return res.status(401).json({
                error: 'Неверный email или пароль'
            });
        }
        if (!user.isActive) {
            return res.status(401).json({
                error: 'Аккаунт деактивирован'
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Неверный email или пароль'
            });
        }
        await user.update({ lastLoginAt: new Date() });
        const token = generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.roleId
        });
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.json({
            message: 'Успешный вход в систему',
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при входе'
        });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        const user = await models_1.User.findByPk(req.user.id, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден'
            });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
};
exports.me = me;
const inviteUser = async (req, res) => {
    try {
        const { email, firstName, lastName, roleId = 3 } = req.body;
        if (!req.user || req.user.role?.name === 'Пользователь') {
            return res.status(403).json({
                error: 'Недостаточно прав для приглашения пользователей'
            });
        }
        if (!email || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Email, имя и фамилия обязательны'
            });
        }
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                error: 'Пользователь с таким email уже существует'
            });
        }
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
        const user = await models_1.User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            roleId,
            isActive: false,
            invitedBy: req.user.id
        });
        res.status(201).json({
            message: 'Пользователь приглашен',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            tempPassword
        });
    }
    catch (error) {
        console.error('Ошибка приглашения пользователя:', error);
        res.status(500).json({
            error: 'Ошибка сервера при приглашении'
        });
    }
};
exports.inviteUser = inviteUser;
const activateUser = async (req, res) => {
    try {
        const { email, tempPassword, newPassword } = req.body;
        if (!email || !tempPassword || !newPassword) {
            return res.status(400).json({
                error: 'Все поля обязательны'
            });
        }
        const user = await models_1.User.findOne({ where: { email, isActive: false } });
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден или уже активирован'
            });
        }
        const isValid = await bcryptjs_1.default.compare(tempPassword, user.password);
        if (!isValid) {
            return res.status(401).json({
                error: 'Неверный временный пароль'
            });
        }
        const newHashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await user.update({
            password: newHashedPassword,
            isActive: true
        });
        res.json({
            message: 'Аккаунт успешно активирован'
        });
    }
    catch (error) {
        console.error('Ошибка активации:', error);
        res.status(500).json({
            error: 'Ошибка сервера при активации'
        });
    }
};
exports.activateUser = activateUser;
//# sourceMappingURL=authController.js.map