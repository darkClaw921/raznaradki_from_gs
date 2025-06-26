import fs from 'fs';
import path from 'path';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../models';

interface Migration {
  filename: string;
  number: number;
  content: string;
}

// Проверка существования таблицы
const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const [results] = await sequelize.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = ?`,
      { 
        replacements: [tableName],
        type: QueryTypes.SELECT 
      }
    );
    return (results as any).count > 0;
  } catch (error) {
    return false;
  }
};

// Создание таблицы для отслеживания выполненных миграций
const createMigrationsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

// Получение списка выполненных миграций
const getExecutedMigrations = async (): Promise<string[]> => {
  try {
    const [results] = await sequelize.query(
      'SELECT filename FROM migrations ORDER BY filename',
      { type: QueryTypes.SELECT }
    );
    return (results as any[]).map(row => row.filename);
  } catch (error) {
    console.log('📊 Таблица миграций еще не существует, создаем...');
    await createMigrationsTable();
    return [];
  }
};

// Пометка миграции как выполненной
const markMigrationAsExecuted = async (filename: string) => {
  await sequelize.query(
    'INSERT INTO migrations (filename) VALUES (?)',
    { replacements: [filename] }
  );
};

// Загрузка всех миграций из папки
const loadMigrations = (): Migration[] => {
  // ✅ ИСПРАВЛЕН ПУТЬ: относительно корня проекта
  const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Папка миграций не найдена:', migrationsDir);
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Сортируем по имени файла

  return files.map(filename => {
    const filePath = path.join(migrationsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const numberMatch = filename.match(/^(\d+)/);
    const number = numberMatch ? parseInt(numberMatch[1]) : 0;

    return {
      filename,
      number,
      content
    };
  });
};

// Проверка должна ли миграция быть пропущена
const shouldSkipMigration = async (migration: Migration): Promise<boolean> => {
  const filename = migration.filename;
  
  // Проверяем специфичные миграции, которые могут быть уже выполнены
  if (filename.includes('add_cell_history') && await tableExists('cell_history')) {
    console.log(`⏭️  Пропускаю миграцию ${filename} - таблица cell_history уже существует`);
    return true;
  }
  
  if (filename.includes('add_sheet_templates') && await tableExists('sheet_templates')) {
    console.log(`⏭️  Пропускаю миграцию ${filename} - таблица sheet_templates уже существует`);
    return true;
  }
  
  if (filename.includes('add_report_sources') && await tableExists('report_sources')) {
    console.log(`⏭️  Пропускаю миграцию ${filename} - таблица report_sources уже существует`);
    return true;
  }
  
  if (filename.includes('add_webhook_system') && await tableExists('system_settings')) {
    console.log(`⏭️  Пропускаю миграцию ${filename} - таблицы webhook уже существуют`);
    return true;
  }

  // Проверяем наличие столбца report_date в таблице sheets
  if (filename.includes('add_report_date')) {
    try {
      const [results] = await sequelize.query(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = DATABASE() AND table_name = 'sheets' AND column_name = 'report_date'`,
        { type: QueryTypes.SELECT }
      );
      if ((results as any).count > 0) {
        console.log(`⏭️  Пропускаю миграцию ${filename} - столбец report_date уже существует`);
        return true;
      }
    } catch (error) {
      // Игнорируем ошибки проверки
    }
  }

  // Проверяем наличие столбца booking_id в таблице cells
  if (filename.includes('add_booking_id_to_cells')) {
    try {
      const [results] = await sequelize.query(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = DATABASE() AND table_name = 'cells' AND column_name = 'booking_id'`,
        { type: QueryTypes.SELECT }
      );
      if ((results as any).count > 0) {
        console.log(`⏭️  Пропускаю миграцию ${filename} - столбец booking_id уже существует`);
        return true;
      }
    } catch (error) {
      // Игнорируем ошибки проверки
    }
  }
  
  return false;
};

// Выполнение одной миграции
const executeMigration = async (migration: Migration) => {
  console.log(`📊 Выполняю миграцию: ${migration.filename}`);
  
  try {
    // Проверяем нужно ли пропустить миграцию
    if (await shouldSkipMigration(migration)) {
      console.log(`⏭️  Миграция ${migration.filename} пропущена`);
      return;
    }

    // Разбиваем SQL на отдельные команды
    const statements = migration.content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await sequelize.query(statement + ';');
      }
    }

    await markMigrationAsExecuted(migration.filename);
    console.log(`✅ Миграция ${migration.filename} выполнена успешно`);
  } catch (error) {
    console.error(`❌ Ошибка при выполнении миграции ${migration.filename}:`, error);
    throw error;
  }
};

// Основная функция для выполнения всех pending миграций
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🚀 Проверка и выполнение миграций...');

    // Создаем таблицу миграций если не существует
    await createMigrationsTable();

    // Получаем список выполненных миграций
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 Выполненные миграции: ${executedMigrations.length}`);

    // Загружаем все доступные миграции
    const availableMigrations = loadMigrations();
    console.log(`📁 Доступные миграции: ${availableMigrations.length}`);

    // Находим невыполненные миграции
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Все миграции уже выполнены');
      return;
    }

    console.log(`🔄 Найдено ${pendingMigrations.length} новых миграций для выполнения`);

    // Выполняем каждую pending миграцию по порядку
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }

    console.log('🎉 Все миграции выполнены успешно!');
  } catch (error) {
    console.error('💥 Критическая ошибка при выполнении миграций:', error);
    throw error;
  }
}; 