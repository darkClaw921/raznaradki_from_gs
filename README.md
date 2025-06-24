# DMD Cottage Sheets

**Production URL**: https://server.name.ru

Веб-сервис для совместной работы с таблицами, аналог Google Sheets для компании DMD cottage.

## Особенности

- 📊 Полнофункциональные таблицы с формулами
- 👥 Совместная работа в реальном времени
- 🔐 Система ролей и разрешений
- 🎯 Контроль доступа на уровне строк/столбцов
- 📧 Приглашения пользователей
- 🐳 Развертывание через Docker

## Быстрый запуск

### Предварительные требования
- Docker и Docker Compose
- Node.js 18+ (для разработки)

### Production развертывание

### Требования на сервере
- Docker и Docker Compose
- Nginx (для reverse proxy)
- SSL сертификаты (Let's Encrypt)

### Установка

1. Клонируйте репозиторий на сервер
2. Скопируйте `.env.example` в `.env` и настройте переменные для production:
   ```bash
   cp env.example .env
   # Отредактируйте .env с production настройками
   ```

3. Настройте nginx на сервере для проксирования (см. nginx-server-config.txt)

4. Запустите сервисы:
   ```bash
   docker-compose up -d
   ```
также добавте свой домен в файл backend/src/app.ts в переменную allowedOrigins



### Переменные окружения для production

```env
# MySQL база данных
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=dmd_cottage_sheets
MYSQL_USER=dmduser
MYSQL_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-256-bit-random-string
JWT_EXPIRES_IN=7d

# Окружение
NODE_ENV=production
PORT=3001

# Production URLs
FRONTEND_URL=https://server.name.ru
REACT_APP_API_URL=https://server.name.ru/api
REACT_APP_WS_URL=wss://server.name.ru

# Администратор (создается автоматически)
ADMIN_EMAIL=admin@dmdcottage.com
ADMIN_PASSWORD=admin123456
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы
```

## Архитектура

Детальная архитектура проекта описана в [architecture.md](./architecture.md)

## Разработка

### Миграции

Миграции выполняются автоматически при запуске контейнера backend.

Если необходимо выполнить миграции вручную, выполните следующие шаги:

```bash

# Подключитесь к контейнеру MySQL
docker-compose exec mysql mysql -u root -p

# Выберите базу данных
USE dmd_cottage_sheets;

# Выполните SQL команды из миграции
ALTER TABLE cells 
ADD COLUMN booking_id BIGINT NULL COMMENT 'ID внешнего бронирования для связи с webhook данными';

CREATE INDEX idx_cells_booking_id ON cells(booking_id);
CREATE INDEX idx_cells_sheet_booking ON cells(sheet_id, booking_id);

# Добавьте запись в таблицу миграций
INSERT INTO migrations (filename, executed_at) 
VALUES ('007_add_booking_id_to_cells.sql', NOW());
```




### Backend
```bash
docker-compose up -d --build backend

```

### Frontend
```bash
docker-compose up -d --build frontend
```

## API

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/invite` - Приглашение пользователя

### Таблицы
- `GET /api/sheets` - Список таблиц
- `POST /api/sheets` - Создание таблицы
- `GET /api/sheets/:id` - Получение таблицы
- `PUT /api/sheets/:id` - Обновление таблицы

### Ячейки
- `PUT /api/sheets/:id/cells/:cellId` - Обновление ячейки
- `POST /api/sheets/:id/merge` - Объединение ячеек

### Роли и разрешения
- `GET /api/roles` - Список ролей
- `POST /api/roles` - Создание роли
- `PUT /api/roles/:id/permissions` - Назначение разрешений 