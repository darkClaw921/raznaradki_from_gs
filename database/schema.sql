-- DMD Cottage Sheets Database Schema

-- Создание базы данных с правильной кодировкой для русского языка
CREATE DATABASE IF NOT EXISTS dmd_cottage_sheets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dmd_cottage_sheets;

-- Установка кодировки для текущего соединения
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `row` INT NOT NULL,
    `column` INT NOT NULL,
    value TEXT COMMENT 'Отображаемое значение ячейки',
    formula TEXT COMMENT 'Формула ячейки (если есть)',
    format JSON COMMENT 'Форматирование ячейки (цвет, шрифт и т.д.)',
    is_locked BOOLEAN DEFAULT FALSE,
    merged_with VARCHAR(10) COMMENT 'Адрес главной ячейки при объединении',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cell_position (sheet_id, `row`, `column`),
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

-- Таблица истории изменений ячеек
CREATE TABLE cell_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cell_id INT NOT NULL,
    sheet_id INT NOT NULL,
    `row` INT NOT NULL,
    `column` INT NOT NULL,
    old_value TEXT COMMENT 'Предыдущее значение ячейки',
    new_value TEXT COMMENT 'Новое значение ячейки',
    old_formula TEXT COMMENT 'Предыдущая формула ячейки',
    new_formula TEXT COMMENT 'Новая формула ячейки',
    old_format JSON COMMENT 'Предыдущее форматирование ячейки',
    new_format JSON COMMENT 'Новое форматирование ячейки',
    changed_by INT NOT NULL,
    change_type ENUM('value', 'formula', 'format', 'create', 'delete') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cell_id) REFERENCES cells(id) ON DELETE CASCADE,
    FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cell_history_cell (cell_id),
    INDEX idx_cell_history_sheet_position (sheet_id, `row`, `column`),
    INDEX idx_cell_history_user (changed_by),
    INDEX idx_cell_history_created (created_at)
);

-- Вставка базовых ролей
INSERT INTO roles (name, description, is_system) VALUES
('admin', 'Полный доступ ко всем функциям системы', TRUE),
('editor', 'Может создавать и редактировать таблицы', TRUE),
('user', 'Базовый доступ к просмотру и редактированию назначенных таблиц', TRUE);

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
('admin@dmdcottage.com', '$2a$10$0co0eYLjVCpuFHuVdxtSf.Zj2JhSR9rt5jmglJvE6H/ZMROWwAv/y', 'Администратор', 'Системы', 1); 

-- Создание таблицы шаблонов
CREATE TABLE sheet_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL COMMENT 'Категория шаблона (hotel, finance, project, etc.)',
    structure JSON NOT NULL COMMENT 'JSON структура таблицы: заголовки, примеры данных, форматирование',
    row_count INT DEFAULT 100,
    column_count INT DEFAULT 26,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_templates_category (category),
    INDEX idx_templates_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Добавление поля template_id в таблицу sheets
ALTER TABLE sheets ADD COLUMN template_id INT DEFAULT NULL COMMENT 'ID шаблона, на основе которого создана таблица';
ALTER TABLE sheets ADD INDEX idx_sheets_template (template_id);

-- Добавление поля source_sheet_id для связи между таблицами (отчеты ссылаются на журналы)
ALTER TABLE sheets ADD COLUMN source_sheet_id INT DEFAULT NULL COMMENT 'ID исходной таблицы для автоматического заполнения (используется в отчетах)';
ALTER TABLE sheets ADD INDEX idx_sheets_source (source_sheet_id);
ALTER TABLE sheets ADD FOREIGN KEY (source_sheet_id) REFERENCES sheets(id) ON DELETE SET NULL;

-- Добавление поля report_date для хранения даты отчета
ALTER TABLE sheets ADD COLUMN report_date DATE DEFAULT NULL COMMENT 'Дата отчета для фильтрации связанных данных';
ALTER TABLE sheets ADD INDEX idx_sheets_report_date (report_date);

-- Вставка шаблона "Журнал заселения DMD Cottage"
INSERT INTO sheet_templates (name, description, category, structure, row_count, column_count) VALUES
('Журнал заселения DMD Cottage', 'Журнал учета заселения и выселения гостей коттеджа', 'hotel', 
JSON_OBJECT(
    'headers', JSON_ARRAY(
        JSON_OBJECT('row', 0, 'column', 0, 'value', 'Месяц', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 1, 'value', 'Дата заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 2, 'value', 'Кол-во дней', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 3, 'value', 'Дата выселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 4, 'value', 'ФИО', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 5, 'value', 'Телефон', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 6, 'value', 'Общая сумма проживания', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 7, 'value', 'Предоплата (сумма аванса)', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 8, 'value', 'Доплата за проживание в день заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 9, 'value', 'Статус дома', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 10, 'value', 'Источник', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 11, 'value', 'Комментарий по оплате и проживанию', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd'))
    ),
    'sampleData', JSON_ARRAY(
        JSON_OBJECT('row', 1, 'column', 0, 'value', 'Январь 2025'),
        JSON_OBJECT('row', 1, 'column', 1, 'value', '01.01.2025'),
        JSON_OBJECT('row', 1, 'column', 2, 'value', '2'),
        JSON_OBJECT('row', 1, 'column', 3, 'value', '03.01.2025'),
        JSON_OBJECT('row', 1, 'column', 4, 'value', 'Иван Петров'),
        JSON_OBJECT('row', 1, 'column', 5, 'value', '+7 952 894-02-80'),
        JSON_OBJECT('row', 1, 'column', 6, 'value', '100 000'),
        JSON_OBJECT('row', 1, 'column', 7, 'value', '50 000'),
        JSON_OBJECT('row', 1, 'column', 8, 'value', '50 000'),
        JSON_OBJECT('row', 1, 'column', 9, 'value', 'Проживают'),
        JSON_OBJECT('row', 1, 'column', 10, 'value', 'Booking.com'),
        JSON_OBJECT('row', 1, 'column', 11, 'value', '100к/50п доплата 50.000 до 16 ГОСТЕЙ'),
        JSON_OBJECT('row', 2, 'column', 0, 'value', 'Январь 2025'),
        JSON_OBJECT('row', 2, 'column', 1, 'value', '03.01.2025'),
        JSON_OBJECT('row', 2, 'column', 2, 'value', '2'),
        JSON_OBJECT('row', 2, 'column', 3, 'value', '05.01.2025'),
        JSON_OBJECT('row', 2, 'column', 4, 'value', 'Мария Сидорова'),
        JSON_OBJECT('row', 2, 'column', 5, 'value', '+7 999 833-04-80'),
        JSON_OBJECT('row', 2, 'column', 6, 'value', '80 000'),
        JSON_OBJECT('row', 2, 'column', 7, 'value', '40 000'),
        JSON_OBJECT('row', 2, 'column', 8, 'value', '40 000'),
        JSON_OBJECT('row', 2, 'column', 9, 'value', 'Выс/Зас'),
        JSON_OBJECT('row', 2, 'column', 10, 'value', 'Прямое обращение'),
        JSON_OBJECT('row', 2, 'column', 11, 'value', '80к/40п доплата 40.000 до 12 ГОСТЕЙ')
    ),
    'columnWidths', JSON_OBJECT(
        '0', 120, '1', 120, '2', 100, '3', 120, '4', 150, '5', 130, 
        '6', 180, '7', 180, '8', 200, '9', 120, '10', 100, '11', 300
    )
), 50, 12);

-- Вставка шаблона "Отчет заселения/выселения"
INSERT INTO sheet_templates (name, description, category, structure, row_count, column_count) VALUES
('Отчет заселения/выселения DMD Cottage', 'Ежедневный отчет о заселениях и выселениях на конкретную дату', 'hotel', 
JSON_OBJECT(
    'headers', JSON_ARRAY(
        JSON_OBJECT('row', 0, 'column', 0, 'value', 'ДАТА ОТЧЕТА', 'format', JSON_OBJECT('fontWeight', 'bold', 'fontSize', '16px', 'textAlign', 'center')),
        JSON_OBJECT('row', 0, 'column', 2, 'value', 'ВЫСЕЛЕНИЕ', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee', 'textAlign', 'center')),
        JSON_OBJECT('row', 0, 'column', 6, 'value', 'ЗАСЕЛЕНИЕ', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8', 'textAlign', 'center')),
        JSON_OBJECT('row', 1, 'column', 0, 'value', 'Адрес', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#f5f5f5')),
        JSON_OBJECT('row', 1, 'column', 1, 'value', 'Статус дома', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#f5f5f5')),
        JSON_OBJECT('row', 1, 'column', 2, 'value', 'ФИО', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 3, 'value', 'Телефон', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 4, 'value', 'Комментарий', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 5, 'value', 'Время выселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 6, 'value', 'ФИО', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 7, 'value', 'Телефон', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 8, 'value', 'Время заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 9, 'value', 'Дата выселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 10, 'value', 'Кол-во дней', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 11, 'value', 'Общая сумма', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 12, 'value', 'Предоплата', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 13, 'value', 'Доплата', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 14, 'value', 'Комментарий', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 15, 'value', 'Примечания', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8'))
    ),
    'sampleData', JSON_ARRAY(
        JSON_OBJECT('row', 2, 'column', 0, 'value', 'Коттедж №1'),
        JSON_OBJECT('row', 2, 'column', 1, 'value', 'Выс/Зас'),
        JSON_OBJECT('row', 2, 'column', 2, 'value', 'Иван Петров'),
        JSON_OBJECT('row', 2, 'column', 3, 'value', '+7 952 894-02-80'),
        JSON_OBJECT('row', 2, 'column', 4, 'value', '100к/50п доплата 50.000'),
        JSON_OBJECT('row', 2, 'column', 5, 'value', '11:00'),
        JSON_OBJECT('row', 2, 'column', 6, 'value', 'Мария Сидорова'),
        JSON_OBJECT('row', 2, 'column', 7, 'value', '+7 999 833-04-80'),
        JSON_OBJECT('row', 2, 'column', 8, 'value', '15:00'),
        JSON_OBJECT('row', 2, 'column', 9, 'value', '05.01.2025'),
        JSON_OBJECT('row', 2, 'column', 10, 'value', '2'),
        JSON_OBJECT('row', 2, 'column', 11, 'value', '80 000'),
        JSON_OBJECT('row', 2, 'column', 12, 'value', '40 000'),
        JSON_OBJECT('row', 2, 'column', 13, 'value', '40 000'),
        JSON_OBJECT('row', 2, 'column', 14, 'value', '80к/40п доплата 40.000'),
        JSON_OBJECT('row', 2, 'column', 15, 'value', 'До 12 гостей, собака допускается')
    ),
    'columnWidths', JSON_OBJECT(
        '0', 120, '1', 120, '2', 150, '3', 130, '4', 200, '5', 120, 
        '6', 150, '7', 130, '8', 120, '9', 120, '10', 100, '11', 120, 
        '12', 120, '13', 120, '14', 200, '15', 250
    )
), 30, 16); 