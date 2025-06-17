-- DMD Cottage Sheets Database Schema

-- Создание базы данных
CREATE DATABASE IF NOT EXISTS dmd_cottage_sheets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dmd_cottage_sheets;

-- Таблица ролей
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица разрешений
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(50) NOT NULL COMMENT 'Ресурс (sheet, cell, user)',
    action VARCHAR(50) NOT NULL COMMENT 'Действие (read, write, delete, manage)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_resource_action (resource, action)
);

-- Таблица связи ролей и разрешений
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Таблица пользователей
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    invited_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role_id)
);

-- Таблица таблиц (sheets)
CREATE TABLE sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    row_count INT DEFAULT 100,
    column_count INT DEFAULT 26,
    settings JSON COMMENT 'Настройки таблицы (форматирование, фильтры и т.д.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_sheets_creator (created_by),
    INDEX idx_sheets_name (name)
);

-- Таблица ячеек
CREATE TABLE cells (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sheet_id INT NOT NULL,
    row INT NOT NULL,
    column INT NOT NULL,
    value TEXT COMMENT 'Отображаемое значение ячейки',
    formula TEXT COMMENT 'Формула ячейки (если есть)',
    format JSON COMMENT 'Форматирование ячейки (цвет, шрифт и т.д.)',
    is_locked BOOLEAN DEFAULT FALSE,
    merged_with VARCHAR(10) COMMENT 'Адрес главной ячейки при объединении',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cell_position (sheet_id, row, column),
    INDEX idx_cells_sheet (sheet_id)
);

-- Таблица связи пользователей и таблиц с разрешениями
CREATE TABLE user_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sheet_id INT NOT NULL,
    permission ENUM('read', 'write', 'admin') NOT NULL DEFAULT 'read',
    row_restrictions TEXT COMMENT 'JSON со списком разрешенных строк',
    column_restrictions TEXT COMMENT 'JSON со списком разрешенных столбцов',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_sheet (user_id, sheet_id)
);

-- Вставка базовых ролей
INSERT INTO roles (name, description, is_system) VALUES
('Администратор', 'Полный доступ ко всем функциям системы', TRUE),
('Редактор', 'Может создавать и редактировать таблицы', TRUE),
('Пользователь', 'Базовый доступ к просмотру и редактированию назначенных таблиц', TRUE);

-- Вставка базовых разрешений
INSERT INTO permissions (name, description, resource, action) VALUES
('Просмотр таблиц', 'Возможность просматривать таблицы', 'sheet', 'read'),
('Создание таблиц', 'Возможность создавать новые таблицы', 'sheet', 'create'),
('Редактирование таблиц', 'Возможность редактировать таблицы', 'sheet', 'write'),
('Удаление таблиц', 'Возможность удалять таблицы', 'sheet', 'delete'),
('Управление таблицами', 'Полное управление таблицами', 'sheet', 'manage'),

('Просмотр ячеек', 'Возможность просматривать ячейки', 'cell', 'read'),
('Редактирование ячеек', 'Возможность редактировать ячейки', 'cell', 'write'),
('Форматирование ячеек', 'Возможность форматировать ячейки', 'cell', 'format'),

('Просмотр пользователей', 'Возможность просматривать пользователей', 'user', 'read'),
('Создание пользователей', 'Возможность создавать пользователей', 'user', 'create'),
('Редактирование пользователей', 'Возможность редактировать пользователей', 'user', 'write'),
('Удаление пользователей', 'Возможность удалять пользователей', 'user', 'delete'),

('Управление ролями', 'Возможность управлять ролями', 'role', 'manage'),
('Приглашение пользователей', 'Возможность приглашать новых пользователей', 'invite', 'create');

-- Назначение разрешений ролям
-- Администратор получает все разрешения
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Редактор получает разрешения на работу с таблицами и ячейками
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE resource IN ('sheet', 'cell') OR (resource = 'invite' AND action = 'create');

-- Пользователь получает базовые разрешения
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE (resource = 'sheet' AND action IN ('read', 'write')) 
   OR (resource = 'cell' AND action IN ('read', 'write', 'format'));

-- Создание первого администратора (пароль: admin123)
INSERT INTO users (email, password, first_name, last_name, role_id) VALUES
('admin@dmdcottage.com', '$2a$10$rOzJJjkzjKKWJXtb/OrHd.y8b1/H9bGBm8SgB1u.vQYP0QJXFqhcy', 'Администратор', 'Системы', 1); 