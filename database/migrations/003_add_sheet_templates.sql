-- Миграция: Добавление таблицы шаблонов таблиц
-- Дата: 2024-12-18

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
        JSON_OBJECT('row', 0, 'column', 11, 'value', 'Комментарий по оплате и проживанию', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
        JSON_OBJECT('row', 0, 'column', 12, 'value', 'Комментарии по оплате и проживанию в день заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd'))
    ),
   
    'columnWidths', JSON_OBJECT(
        '0', 120, '1', 120, '2', 100, '3', 120, '4', 150, '5', 130, 
        '6', 180, '7', 180, '8', 200, '9', 120, '10', 100, '11', 300, '12', 250
    )
), 50, 13);

-- Вставка шаблона "Отчет заселения/выселения"
INSERT INTO sheet_templates (name, description, category, structure, row_count, column_count) VALUES
('Отчет заселения/выселения DMD Cottage', 'Ежедневный отчет о заселениях и выселениях на конкретную дату', 'hotel', 
JSON_OBJECT(
    'headers', JSON_ARRAY(
        JSON_OBJECT('row', 0, 'column', 0, 'value', '30.03.2025', 'format', JSON_OBJECT('fontWeight', 'bold', 'fontSize', '16px', 'textAlign', 'center')),
        JSON_OBJECT('row', 0, 'column', 2, 'value', 'Выселение', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee', 'textAlign', 'center')),
        JSON_OBJECT('row', 0, 'column', 6, 'value', 'Заселение', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8', 'textAlign', 'center')),
        JSON_OBJECT('row', 1, 'column', 0, 'value', 'Адрес', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#f5f5f5')),
        JSON_OBJECT('row', 1, 'column', 1, 'value', 'Статус дома', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#f5f5f5')),
        JSON_OBJECT('row', 1, 'column', 2, 'value', 'ФИО', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 3, 'value', 'Телефон', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 4, 'value', 'Комментарий из журнала заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 5, 'value', 'Время выселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#ffebee')),
        JSON_OBJECT('row', 1, 'column', 6, 'value', 'ФИО', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 7, 'value', 'Телефон', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 8, 'value', 'Время заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 9, 'value', 'Дата выселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 10, 'value', 'Кол-во дней', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 11, 'value', 'Общая сумма проживания', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 12, 'value', 'Предоплата (сумма аванса)', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 13, 'value', 'Доплата\nза проживание\nв день заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 14, 'value', 'Комментарий из журнала заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 15, 'value', 'Комментарии по оплате и проживанию в день заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8')),
        JSON_OBJECT('row', 1, 'column', 16, 'value', 'Комментарии по оплате и проживанию в день заселения', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e8f5e8'))
    ),
   
    'columnWidths', JSON_OBJECT(
        '0', 80, '1', 120, '2', 150, '3', 130, '4', 250, '5', 120, 
        '6', 150, '7', 130, '8', 120, '9', 120, '10', 100, '11', 150, 
        '12', 150, '13', 180, '14', 250, '15', 300, '16', 280
    )
), 30, 17); 