-- Создание таблицы настроек системы
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description VARCHAR(255),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Создание таблицы привязки webhook к таблицам
CREATE TABLE IF NOT EXISTS webhook_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sheetId INT NOT NULL,
  apartmentTitles TEXT NOT NULL COMMENT 'JSON array of apartment titles',
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sheetId) REFERENCES sheets(id) ON DELETE CASCADE,
  INDEX idx_sheetId (sheetId),
  INDEX idx_isActive (isActive)
);

-- Добавление начальных настроек webhook
INSERT INTO system_settings (`key`, value, description) VALUES
('webhook_enabled', 'false', 'Включить обработку webhook запросов'),
('webhook_url', '', 'URL для webhook (генерируется автоматически)'),
('webhook_secret', '', 'Секрет для проверки webhook запросов'); 