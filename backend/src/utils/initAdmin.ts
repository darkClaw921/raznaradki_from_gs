import bcrypt from 'bcryptjs';
import { User, Role } from '../models';

/**
 * Инициализация администратора системы
 * Создает роль admin и пользователя-администратора из переменных окружения
 */
export const initializeAdmin = async (): Promise<void> => {
  try {
    console.log('🔧 Инициализация администратора...');

    // Проверяем наличие необходимых переменных окружения
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Администратор';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Системы';

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  Переменные ADMIN_EMAIL и ADMIN_PASSWORD не установлены, пропускаем создание админа');
      return;
    }

    // Создаем или находим роль админа
    let adminRole = await Role.findOne({ where: { name: 'admin' } });
    
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'Системная роль администратора с полными правами',
        isSystem: true
      });
      console.log('✅ Создана роль администратора');
    }

    // Проверяем, существует ли уже администратор
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('ℹ️  Администратор уже существует:', adminEmail);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Создаем администратора
    const admin = await User.create({
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

  } catch (error) {
    console.error('❌ Ошибка при инициализации администратора:', error);
    throw error;
  }
}; 