import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, Sheet, UserSheet } from '../models';

interface AuthenticatedSocket extends Socket {
  user?: any;
}

// Аутентификация пользователя через WebSocket
const authenticateSocket = async (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Токен отсутствует'));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new Error('JWT_SECRET не установлен'));
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findByPk(decoded.userId, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return next(new Error('Пользователь не найден'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Недействительный токен'));
  }
};

// Проверка доступа к таблице
const checkSheetAccess = async (userId: number, sheetId: string): Promise<boolean> => {
  try {
    const sheet = await Sheet.findByPk(sheetId);
    if (!sheet) return false;

    // Создатель или публичная таблица
    if (sheet.createdBy === userId || sheet.isPublic) {
      return true;
    }

    // Проверка через UserSheet
    const userSheet = await UserSheet.findOne({
      where: { userId, sheetId }
    });

    return !!userSheet;
  } catch (error) {
    return false;
  }
};

export const initializeSocketHandlers = (io: Server) => {
  // Middleware для аутентификации
  io.use(authenticateSocket);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Пользователь подключен: ${socket.user.email}`);

    // Присоединение к комнате таблицы
    socket.on('joinSheet', async (data) => {
      const { sheetId } = data;
      
      // Проверка доступа
      const hasAccess = await checkSheetAccess(socket.user.id, sheetId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Нет доступа к таблице' });
        return;
      }

      // Покидаем все предыдущие комнаты таблиц
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('sheet-')) {
          socket.leave(room);
        }
      });

      // Присоединяемся к новой комнате
      socket.join(`sheet-${sheetId}`);
      
      // Уведомляем других участников
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

    // Покидание таблицы
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

    // Обновление ячейки в реальном времени
    socket.on('updateCell', async (data) => {
      const { sheetId, row, column, value, formula, format } = data;
      
      // Проверка доступа
      const hasAccess = await checkSheetAccess(socket.user.id, sheetId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Нет доступа к таблице' });
        return;
      }

      // Отправляем обновление всем участникам, кроме отправителя
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

    // Курсор пользователя (показывает где находится пользователь)
    socket.on('cursorMove', (data) => {
      const { sheetId, row, column } = data;
      
      socket.to(`sheet-${sheetId}`).emit('userCursor', {
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        position: { row, column },
        sheetId
      });
    });

    // Выделение диапазона ячеек
    socket.on('cellSelection', (data) => {
      const { sheetId, startRow, startColumn, endRow, endColumn } = data;
      
      socket.to(`sheet-${sheetId}`).emit('userSelection', {
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        selection: { startRow, startColumn, endRow, endColumn },
        sheetId
      });
    });

    // Блокировка ячейки для редактирования
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

    // Разблокировка ячейки
    socket.on('unlockCell', (data) => {
      const { sheetId, row, column } = data;
      
      socket.to(`sheet-${sheetId}`).emit('cellUnlocked', {
        sheetId,
        position: { row, column },
        unlockedBy: socket.user.id
      });
    });

    // Отключение пользователя
    socket.on('disconnect', () => {
      console.log(`Пользователь отключен: ${socket.user?.email}`);
      
      // Уведомляем все комнаты о выходе пользователя
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

    // Обработка ошибок
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}; 