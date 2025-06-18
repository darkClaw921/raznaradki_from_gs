-- Миграция: Добавление таблицы истории изменений ячеек
-- Дата: 2025-06-18

-- Добавляем таблицу истории изменений ячеек
CREATE TABLE IF NOT EXISTS cell_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cell_id INT NOT NULL,
    sheet_id INT NOT NULL,
    row INT NOT NULL,
    column INT NOT NULL,
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
    INDEX idx_cell_history_sheet_position (sheet_id, row, column),
    INDEX idx_cell_history_user (changed_by),
    INDEX idx_cell_history_created (created_at)
);

-- Исправляем названия ролей на английские
UPDATE roles SET name = 'admin' WHERE name = 'Администратор';
UPDATE roles SET name = 'editor' WHERE name = 'Редактор';
UPDATE roles SET name = 'user' WHERE name = 'Пользователь'; 