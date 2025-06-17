# DMD Cottage Sheets

## 🔧 Быстрое решение проблем WebSocket/API

Если вы видите ошибки типа:
- `WebSocket connection to 'wss://nginx.raznaradki-from-gs.orb.local:3000/ws' failed`
- `[blocked] The page at https://... requested insecure content from http://localhost/api/...`
- `XMLHttpRequest cannot load http://localhost/api/... due to access control checks`

### Решение:

1. **Пересоберите и перезапустите контейнеры**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

2. **Если проблемы с HTTPS, создайте SSL сертификаты**:
   ```bash
   # Создать папку для сертификатов
   mkdir -p nginx/ssl
   
   # Создать самоподписанный сертификат (для тестирования)
   openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=RU/ST=Moscow/L=Moscow/O=DMD/CN=nginx.raznaradki-from-gs.orb.local"
   ```

3. **Обновите .env файл**:
   ```bash
   cp env.example .env
   # Отредактируйте .env если нужно
   ```

4. **Перезапустите с новой конфигурацией**:
   ```bash
   docker-compose up -d --build
   ```

### Что исправлено:
- ✅ API и WebSocket теперь используют относительные URL в продакшене
- ✅ CORS настроен для поддержки orb.local доменов
- ✅ nginx правильно проксирует WebSocket через HTTPS
- ✅ Добавлены security headers

---

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