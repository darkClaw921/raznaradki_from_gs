-- Миграция 007: Добавление поля booking_id в таблицу cells для связи с внешними бронированиями
-- Дата: 30.01.2025

-- Добавляем поле booking_id для связи ячеек с внешними бронированиями
ALTER TABLE cells 
ADD COLUMN booking_id BIGINT NULL COMMENT 'ID внешнего бронирования для связи с webhook данными';

-- Создаем индекс для быстрого поиска по booking_id
CREATE INDEX idx_cells_booking_id ON cells(booking_id);

-- Создаем составной индекс для поиска ячеек конкретного бронирования в конкретной таблице
CREATE INDEX idx_cells_sheet_booking ON cells(sheet_id, booking_id); 