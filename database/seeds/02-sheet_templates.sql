-- Заполнение таблицы шаблонов начальными данными
-- Используется в качестве бэкапа на случай если шаблоны не были созданы через schema.sql

-- Проверка существования таблицы шаблонов
CREATE TABLE IF NOT EXISTS sheet_templates (
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

-- Вставка шаблонов только если их еще нет
INSERT IGNORE INTO sheet_templates (id, name, description, category, structure, row_count, column_count) VALUES
(1, 'Журнал заселения DMD Cottage', 'Журнал учета заселения и выселения гостей коттеджа', 'hotel', 
JSON_OBJECT(
    'headers', JSON_ARRAY(
        JSON_OBJECT('cell_row', 0, 'cell_column', 0, 'value', 'Месяц', 'format', JSON_OBJECT('fontWeight', 'bold', 'backgroundColor', '#e3f2fd')),
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
        JSON_OBJECT('row', 1, 'column', 5, 'value', '+7 952 894-02-91'),
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
        JSON_OBJECT('row', 2, 'column', 5, 'value', '+7 999 833-04-75'),
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
), 50, 12),

(2, 'Отчет заселения/выселения DMD Cottage', 'Ежедневный отчет о заселениях и выселениях на конкретную дату', 'hotel', 
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
        JSON_OBJECT('row', 2, 'column', 3, 'value', '+7 952 894-02-91'),
        JSON_OBJECT('row', 2, 'column', 4, 'value', '100к/50п доплата 50.000'),
        JSON_OBJECT('row', 2, 'column', 5, 'value', '11:00'),
        JSON_OBJECT('row', 2, 'column', 6, 'value', 'Мария Сидорова'),
        JSON_OBJECT('row', 2, 'column', 7, 'value', '+7 999 833-04-75'),
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

-- Сообщение об успешной инициализации шаблонов
SELECT 'Шаблоны таблиц успешно инициализированы' AS message; 