# DMD Cottage Sheets

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

### Установка

1. Клонируйте репозиторий
2. Скопируйте `.env.example` в `.env` и настройте переменные
3. Запустите сервисы:

```bash
docker-compose up -d
```

4. Откройте http://localhost в браузере

### Переменные окружения

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dmd_cottage_sheets
DB_USER=dmd_user
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

## Архитектура

Детальная архитектура проекта описана в [architecture.md](./architecture.md)

## Разработка

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
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