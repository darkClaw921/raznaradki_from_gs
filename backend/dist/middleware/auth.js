"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Токен доступа отсутствует' });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET не установлен');
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await models_1.User.findByPk(decoded.userId, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        console.error('Ошибка аутентификации:', error);
        return res.status(500).json({ error: 'Ошибка сервера при аутентификации' });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            req.user = null;
            return next();
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            req.user = null;
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await models_1.User.findByPk(decoded.userId, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        req.user = user && user.isActive ? user : null;
        next();
    }
    catch (error) {
        req.user = null;
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется аутентификация' });
        }
        const userRole = req.user.role?.name;
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                error: 'Недостаточно прав доступа',
                required: roles,
                current: userRole
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Требуется аутентификация' });
            }
            const userRole = await req.user.getRole({
                include: ['permissions']
            });
            const hasPermission = userRole.permissions.some((permission) => permission.resource === resource && permission.action === action);
            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Недостаточно прав для выполнения этого действия',
                    required: `${resource}:${action}`
                });
            }
            next();
        }
        catch (error) {
            console.error('Ошибка проверки разрешений:', error);
            return res.status(500).json({ error: 'Ошибка сервера при проверке разрешений' });
        }
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=auth.js.map