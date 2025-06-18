"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketHandlers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Токен отсутствует'));
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return next(new Error('JWT_SECRET не установлен'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await models_1.User.findByPk(decoded.userId, {
            include: ['role'],
            attributes: { exclude: ['password'] }
        });
        if (!user || !user.isActive) {
            return next(new Error('Пользователь не найден'));
        }
        socket.user = user;
        next();
    }
    catch (error) {
        next(new Error('Недействительный токен'));
    }
};
const checkSheetAccess = async (userId, sheetId) => {
    try {
        const sheet = await models_1.Sheet.findByPk(sheetId);
        if (!sheet)
            return false;
        if (sheet.createdBy === userId || sheet.isPublic) {
            return true;
        }
        const userSheet = await models_1.UserSheet.findOne({
            where: { userId, sheetId }
        });
        return !!userSheet;
    }
    catch (error) {
        return false;
    }
};
const initializeSocketHandlers = (io) => {
    io.use(authenticateSocket);
    io.on('connection', (socket) => {
        console.log(`Пользователь подключен: ${socket.user.email}`);
        socket.on('joinSheet', async (data) => {
            const { sheetId } = data;
            const hasAccess = await checkSheetAccess(socket.user.id, sheetId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Нет доступа к таблице' });
                return;
            }
            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                if (room.startsWith('sheet-')) {
                    socket.leave(room);
                }
            });
            socket.join(`sheet-${sheetId}`);
            socket.to(`sheet-${sheetId}`).emit('userJoined', {
                user: {
                    id: socket.user.id,
                    firstName: socket.user.firstName,
                    lastName: socket.user.lastName,
                    email: socket.user.email
                },
                sheetId
            });
            socket.emit('sheetJoined', { sheetId });
        });
        socket.on('leaveSheet', (data) => {
            const { sheetId } = data;
            socket.leave(`sheet-${sheetId}`);
            socket.to(`sheet-${sheetId}`).emit('userLeft', {
                user: {
                    id: socket.user.id,
                    firstName: socket.user.firstName,
                    lastName: socket.user.lastName
                },
                sheetId
            });
        });
        socket.on('updateCell', async (data) => {
            const { sheetId, row, column, value, formula, format } = data;
            const hasAccess = await checkSheetAccess(socket.user.id, sheetId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Нет доступа к таблице' });
                return;
            }
            socket.to(`sheet-${sheetId}`).emit('cellUpdated', {
                sheetId,
                cell: {
                    row: parseInt(row),
                    column: parseInt(column),
                    value,
                    formula,
                    format
                },
                updatedBy: {
                    id: socket.user.id,
                    name: `${socket.user.firstName} ${socket.user.lastName}`
                }
            });
        });
        socket.on('cursorMove', (data) => {
            const { sheetId, row, column } = data;
            socket.to(`sheet-${sheetId}`).emit('userCursor', {
                userId: socket.user.id,
                userName: `${socket.user.firstName} ${socket.user.lastName}`,
                position: { row, column },
                sheetId
            });
        });
        socket.on('cellSelection', (data) => {
            const { sheetId, startRow, startColumn, endRow, endColumn } = data;
            socket.to(`sheet-${sheetId}`).emit('userSelection', {
                userId: socket.user.id,
                userName: `${socket.user.firstName} ${socket.user.lastName}`,
                selection: { startRow, startColumn, endRow, endColumn },
                sheetId
            });
        });
        socket.on('lockCell', (data) => {
            const { sheetId, row, column } = data;
            socket.to(`sheet-${sheetId}`).emit('cellLocked', {
                sheetId,
                position: { row, column },
                lockedBy: {
                    id: socket.user.id,
                    name: `${socket.user.firstName} ${socket.user.lastName}`
                }
            });
        });
        socket.on('unlockCell', (data) => {
            const { sheetId, row, column } = data;
            socket.to(`sheet-${sheetId}`).emit('cellUnlocked', {
                sheetId,
                position: { row, column },
                unlockedBy: socket.user.id
            });
        });
        socket.on('disconnect', () => {
            console.log(`Пользователь отключен: ${socket.user?.email}`);
            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                if (room.startsWith('sheet-')) {
                    const sheetId = room.replace('sheet-', '');
                    socket.to(room).emit('userLeft', {
                        user: {
                            id: socket.user.id,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        },
                        sheetId
                    });
                }
            });
        });
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
};
exports.initializeSocketHandlers = initializeSocketHandlers;
//# sourceMappingURL=socketHandlers.js.map