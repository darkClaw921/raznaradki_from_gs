-- Миграция: Добавление поля report_date в таблицу sheets  
-- Дата: 2025-01-28

-- Добавление поля report_date для хранения даты отчета
ALTER TABLE sheets ADD COLUMN report_date DATE DEFAULT NULL COMMENT 'Дата отчета для фильтрации связанных данных';
ALTER TABLE sheets ADD INDEX idx_sheets_report_date (report_date); 