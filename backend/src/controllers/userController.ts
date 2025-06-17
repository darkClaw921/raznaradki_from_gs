import { Request, Response } from 'express';
import { User, Role } from '../models';

// Получение списка пользователей
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      include: ['role'],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Получение пользователя по ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
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
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Обновление пользователя
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, roleId, isActive } = req.body;
    const currentUserId = req.user.id;

    // Проверка прав (только админ или сам пользователь)
    if (currentUserId !== parseInt(id) && req.user.role?.name !== 'Администратор') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    // Обновляем только разрешенные поля
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    
    // Только админ может менять роль и статус активности
    if (req.user.role?.name === 'Администратор') {
      if (roleId !== undefined) updateData.roleId = roleId;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'Пользователь обновлен',
      user: updatedUser
    });

  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Деактивация пользователя
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Только админ может деактивировать пользователей
    if (req.user.role?.name !== 'Администратор') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    await user.update({ isActive: false });

    res.json({
      message: 'Пользователь деактивирован'
    });

  } catch (error) {
    console.error('Ошибка деактивации пользователя:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
}; 