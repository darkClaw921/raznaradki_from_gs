-- Миграция 005: Добавление таблицы report_sources для связи отчетов с несколькими журналами
-- Дата: 28.01.2025

-- Создаем таблицу для связи отчетов с множественными журналами
CREATE TABLE IF NOT EXISTS report_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reportSheetId INT NOT NULL,
  sourceSheetId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reportSheetId) REFERENCES sheets(id) ON DELETE CASCADE,
  FOREIGN KEY (sourceSheetId) REFERENCES sheets(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_report_source (reportSheetId, sourceSheetId),
  INDEX idx_report_sheet (reportSheetId),
  INDEX idx_source_sheet (sourceSheetId)
);

-- Мигрируем существующие связи из поля sourceSheetId в новую таблицу
INSERT INTO report_sources (reportSheetId, sourceSheetId, createdAt, updatedAt)
SELECT id, sourceSheetId, NOW(), NOW()
FROM sheets 
WHERE sourceSheetId IS NOT NULL;

-- Примечание: поле sourceSheetId оставляем для обратной совместимости
-- Оно будет использоваться как primary source, но основная логика переходит на report_sources 