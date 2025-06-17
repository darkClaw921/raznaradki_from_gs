import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';
import { JwtPayload } from '../middleware/auth';

// Генерация JWT токена
const generateToken = (payload: JwtPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET не установлен');
  }
  
  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

// Регистрация пользователя
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, roleId = 3 } = req.body;

    // Валидация обязательных полей
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Все поля обязательны для заполнения'
      });
    }

    // Проверка на существование пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Проверка роли
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({
        error: 'Указанная роль не найдена'
      });
    }

    // Хеширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId,
      isActive: true,
      invitedBy: req.user?.id || null
    });

    // Получение данных пользователя с ролью
    const userWithRole = await User.findByPk(user.id, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    // Генерация токена
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

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      error: 'Ошибка сервера при регистрации'
    });
  }
};

// Вход в систему
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны'
      });
    }

    // Поиск пользователя
    const user = await User.findOne({ 
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

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    // Обновление времени последнего входа
    await user.update({ lastLoginAt: new Date() });

    // Генерация токена
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId
    });

    // Возвращаем данные без пароля
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      message: 'Успешный вход в систему',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      error: 'Ошибка сервера при входе'
    });
  }
};

// Получение информации о текущем пользователе
export const me = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Приглашение пользователя
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, roleId = 3 } = req.body;

    // Проверка разрешений
    if (!req.user || req.user.role?.name === 'Пользователь') {
      return res.status(403).json({
        error: 'Недостаточно прав для приглашения пользователей'
      });
    }

    // Валидация
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Email, имя и фамилия обязательны'
      });
    }

    // Проверка на существование пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Генерация временного пароля
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Создание пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId,
      isActive: false, // Неактивен до подтверждения
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
      tempPassword // В реальном приложении отправить по email
    });

  } catch (error) {
    console.error('Ошибка приглашения пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера при приглашении'
    });
  }
};

// Активация приглашенного пользователя
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({
        error: 'Все поля обязательны'
      });
    }

    const user = await User.findOne({ where: { email, isActive: false } });
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден или уже активирован'
      });
    }

    // Проверка временного пароля
    const isValid = await bcrypt.compare(tempPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Неверный временный пароль'
      });
    }

    // Установка нового пароля и активация
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: newHashedPassword,
      isActive: true
    });

    res.json({
      message: 'Аккаунт успешно активирован'
    });

  } catch (error) {
    console.error('Ошибка активации:', error);
    res.status(500).json({
      error: 'Ошибка сервера при активации'
    });
  }
}; 