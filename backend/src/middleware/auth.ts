import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

// Расширяем интерфейс Request для включения пользователя
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET не установлен');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Получаем пользователя из базы данных
    const user = await User.findByPk(decoded.userId, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    
    console.error('Ошибка аутентификации:', error);
    return res.status(500).json({ error: 'Ошибка сервера при аутентификации' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
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

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await User.findByPk(decoded.userId, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    req.user = user && user.isActive ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Требуется аутентификация' });
      }

      // Проверяем разрешения через роль пользователя
      const userRole = await req.user.getRole({
        include: ['permissions']
      });

      const hasPermission = userRole.permissions.some((permission: any) => 
        permission.resource === resource && permission.action === action
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Недостаточно прав для выполнения этого действия',
          required: `${resource}:${action}`
        });
      }

      next();
    } catch (error) {
      console.error('Ошибка проверки разрешений:', error);
      return res.status(500).json({ error: 'Ошибка сервера при проверке разрешений' });
    }
  };
}; 