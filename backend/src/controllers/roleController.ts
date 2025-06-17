import { Request, Response } from 'express';
import { Role, Permission, RolePermission } from '../models';

// Получение списка ролей
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.findAll({
      include: ['permissions'],
      order: [['createdAt', 'ASC']]
    });

    res.json({ roles });
  } catch (error) {
    console.error('Ошибка получения ролей:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Создание новой роли
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissionIds = [] } = req.body;

    // Только админ может создавать роли
    if (req.user.role?.name !== 'Администратор') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'Название роли обязательно'
      });
    }

    // Проверка на уникальность
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(409).json({
        error: 'Роль с таким названием уже существует'
      });
    }

    const role = await Role.create({
      name,
      description,
      isSystem: false
    });

    // Назначение разрешений
    if (permissionIds.length > 0) {
      const permissions = await Permission.findAll({
        where: { id: permissionIds }
      });

      // Создаем связи через RolePermission
      await RolePermission.bulkCreate(
        permissions.map((permission: any) => ({
          roleId: role.id,
          permissionId: permission.id
        }))
      );
    }

    const createdRole = await Role.findByPk(role.id, {
      include: ['permissions']
    });

    res.status(201).json({
      message: 'Роль создана',
      role: createdRole
    });

  } catch (error) {
    console.error('Ошибка создания роли:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Обновление роли
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    // Только админ может обновлять роли
    if (req.user.role?.name !== 'Администратор') {
      return res.status(403).json({
        error: 'Недостаточно прав'
      });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        error: 'Роль не найдена'
      });
    }

    // Системные роли нельзя изменять
    if (role.isSystem) {
      return res.status(403).json({
        error: 'Системные роли нельзя изменять'
      });
    }

    // Обновление основных данных
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await role.update(updateData);

    // Обновление разрешений
    if (permissionIds !== undefined) {
      // Удаляем старые связи
      await RolePermission.destroy({
        where: { roleId: role.id }
      });

      // Создаем новые связи
      if (permissionIds.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: permissionIds }
        });

        await RolePermission.bulkCreate(
          permissions.map((permission: any) => ({
            roleId: role.id,
            permissionId: permission.id
          }))
        );
      }
    }

    const updatedRole = await Role.findByPk(id, {
      include: ['permissions']
    });

    res.json({
      message: 'Роль обновлена',
      role: updatedRole
    });

  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
};

// Получение списка разрешений
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.findAll({
      order: [['resource', 'ASC'], ['action', 'ASC']]
    });

    res.json({ permissions });
  } catch (error) {
    console.error('Ошибка получения разрешений:', error);
    res.status(500).json({
      error: 'Ошибка сервера'
    });
  }
}; 