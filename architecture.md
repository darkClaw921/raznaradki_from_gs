# Архитектура DMD Cottage Sheets

## Обзор проекта
Веб-сервис для совместной работы с таблицами, аналог Google Sheets для компании DMD cottage.

## Структура проекта

```
raznaradki_from_gs/
├── backend/                    # Backend API на Node.js + Express
│   ├── src/
│   │   ├── controllers/        # Контроллеры API
│   │   ├── models/            # Модели базы данных (Sequelize)
│   │   ├── routes/            # Маршруты API
│   │   ├── middleware/        # Middleware для аутентификации и авторизации
│   │   ├── services/          # Бизнес-логика
│   │   ├── utils/             # Утилиты и хелперы
│   │   │   └── initAdmin.ts  # Автоматическая инициализация администратора
│   │   ├── websocket/         # WebSocket для real-time
│   │   └── app.ts            # Основной файл приложения
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/                   # Frontend на React + TypeScript
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   ├── pages/            # Страницы приложения
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API сервисы
│   │   ├── store/            # State management (Redux Toolkit)
│   │   ├── types/            # TypeScript типы
│   │   └── utils/            # Утилиты
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── database/                   # Скрипты и схемы БД
│   ├── migrations/           # Миграции базы данных
│   ├── seeds/               # Начальные данные
│   └── schema.sql           # Схема базы данных
├── docker-compose.yml         # Конфигурация Docker Compose
├── .env.example              # Пример переменных окружения
└── README.md                 # Документация проекта

## Основные компоненты

### Backend (/backend)
- **app.ts**: Точка входа, настройка Express сервера, middleware, Socket.io, инициализация админа
- **controllers/**: Обработчики HTTP запросов
  - authController.ts - аутентификация, регистрация и приглашения пользователей
  - userController.ts - управление пользователями (CRUD, деактивация)
  - roleController.ts - управление ролями и разрешениями
  - sheetController.ts - работа с таблицами (создание, редактирование, доступ)
  - cellController.ts - операции с ячейками (обновление, формулы)
- **models/**: Модели данных для Sequelize ORM
  - index.ts - конфигурация Sequelize и настройка ассоциаций
  - User.ts - модель пользователя с аутентификацией
  - Role.ts - модель роли (системные и пользовательские)
  - Permission.ts - модель разрешений (resource + action)
  - Sheet.ts - модель таблицы с настройками и метаданными
  - Cell.ts - модель ячейки с поддержкой формул и форматирования
  - UserSheet.ts - связь пользователя с таблицей + разрешения на строки/столбцы
  - RolePermission.ts - связь ролей с разрешениями
- **routes/**: API маршруты
  - authRoutes.ts - маршруты аутентификации (/api/auth)
  - userRoutes.ts - маршруты пользователей (/api/users)
  - roleRoutes.ts - маршруты ролей (/api/roles)
  - sheetRoutes.ts - маршруты таблиц (/api/sheets)
  - cellRoutes.ts - маршруты ячеек (/api/cells)
- **middleware/**: Промежуточное ПО
  - auth.ts - аутентификация JWT, проверка ролей и разрешений
- **websocket/**: Real-time функционал
  - socketHandlers.ts - обработчики WebSocket для совместной работы

### Frontend (/frontend)
- **components/**: React компоненты
  - PrivateRoute.tsx - защищенные маршруты
  - Spreadsheet/ - компоненты таблицы
    - Spreadsheet.tsx - основной компонент таблицы с grid
    - Cell.tsx - компонент отдельной ячейки с редактированием
- **pages/**: Страницы приложения
  - Login.tsx - страница входа с формами логина/регистрации
  - Dashboard.tsx - главная страница со списком таблиц
  - Sheet.tsx - страница работы с таблицей
- **store/**: Redux store (Redux Toolkit)
  - index.ts - конфигурация store
  - authSlice.ts - состояние аутентификации и async thunks
  - sheetSlice.ts - состояние таблиц
  - userSlice.ts - состояние пользователей
- **services/**: API и WebSocket сервисы
  - api.ts - HTTP клиент с interceptors для всех API endpoints
  - websocket.ts - WebSocket сервис для real-time функций
- **types/**: TypeScript типы
  - index.ts - общие типы данных и API responses
- **public/**: Статические файлы
  - index.html - HTML шаблон приложения

### База данных
- **MySQL**: Основное хранилище данных
- **Таблицы**:
  - users - пользователи
  - roles - роли
  - permissions - разрешения
  - sheets - таблицы
  - cells - ячейки
  - user_sheets - связи пользователей с таблицами
  - role_permissions - связи ролей с разрешениями

## Технологический стек

### Backend
- Node.js + Express + TypeScript
- Sequelize ORM для работы с MySQL
- Socket.io для real-time
- JWT для аутентификации
- bcrypt для хеширования паролей

### Frontend  
- React + TypeScript
- Redux Toolkit для state management
- Material-UI для UI компонентов
- Socket.io-client для real-time
- Axios для HTTP запросов

### DevOps
- Docker + Docker Compose
- MySQL 8.0
- Nginx для reverse proxy

## Основные функции

### 1. Аутентификация и авторизация
- Регистрация/вход пользователей
- JWT токены
- Приглашения пользователей
- Система ролей и разрешений
- **Автоматическое создание администратора при запуске сервера**

### 2. Управление таблицами
- Создание, редактирование, удаление таблиц
- Формулы в ячейках
- Объединение ячеек
- Форматирование

### 3. Совместная работа
- Real-time синхронизация изменений
- Отображение активных пользователей
- Блокировка ячеек при редактировании

### 4. Система разрешений
- Создание пользовательских ролей
- Назначение разрешений на уровне столбцов/строк
- Контроль доступа к функциям

## Статус проекта

✅ **Completed**: Проект полностью настроен и готов к запуску
- Backend API с полным функционалом (Node.js + Express + TypeScript)
- Frontend с основными компонентами (React + Material-UI)
- База данных со схемой и начальными данными (MySQL 8.0)
- **Docker Compose конфигурация для разработки и продакшена**
- WebSocket для real-time совместной работы
- Nginx reverse proxy для маршрутизации
- Автоматические скрипты запуска

🚀 **Проект готов к использованию!**

## Запуск проекта

### Быстрый запуск через Docker Compose

1. **Автоматический запуск**:
   ```bash
   ./start.sh
   ```

2. **Ручной запуск**:
   ```bash
   # Создать .env файл (если нет)
   cp env.example .env
   
   # Настроить данные администратора в .env (опционально)
   # ADMIN_EMAIL=admin@dmdcottage.com
   # ADMIN_PASSWORD=admin123456
   # ADMIN_FIRST_NAME=Администратор
   # ADMIN_LAST_NAME=Системы
   
   # Запустить все сервисы
   docker-compose up -d
   
   # Проверить статус
   docker-compose ps
   ```

3. **Адреса сервисов**:
   - 🌐 **Приложение**: http://localhost
   - 🔧 **Backend API**: http://localhost:3001  
   - ⚛️ **Frontend**: http://localhost:3000
   - 🗄️ **Adminer (БД)**: http://localhost:8080

### Управление Docker Compose

```bash
# Просмотр логов
docker-compose logs -f

# Остановка сервисов
docker-compose down

# Пересборка контейнеров
docker-compose up -d --build

# Подключение к контейнеру
docker-compose exec backend sh
docker-compose exec frontend sh

# Пересборка и запуск
docker-compose up -d --build

# Запуск с Adminer для управления БД
docker-compose --profile admin up -d
```

### Разработка без Docker

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (в другом терминале)  
cd frontend && npm install && npm start
```

## Дополнительные возможности для развития

- Расширенная система формул (как в Excel)
- Импорт/экспорт файлов (XLSX, CSV)
- Комментарии к ячейкам
- История изменений и версионирование
- Уведомления пользователей
- Мобильное приложение
- Интеграция с внешними сервисами

## Исправленные проблемы
- **Backend TypeScript ошибки**: Исправлена типизация `jwt.sign()` и добавлено обязательное поле `isActive: true` при создании пользователей
- **Frontend совместимость**: Понижена версия TypeScript с ^5.3.3 до ^4.9.5 для совместимости с react-scripts 5.0.1
- **Автоматическое создание администратора**: Добавлена система автоматической инициализации администратора из переменных окружения при первом запуске сервера
- **CORS настройки**: Исправлены настройки CORS в backend для поддержки множественных origins (localhost, localhost:3000)
- **Docker Nginx конфигурация**: Создана правильная конфигурация nginx для проксирования запросов к API и frontend
- **React proxy конфликт**: Удалена конфликтующая настройка proxy из package.json frontend

## Новые функции
- **Инициализация администратора**: При запуске сервера автоматически создается пользователь-администратор на основе данных из файла `.env` и переменных окружения Docker Compose
- **Переменные окружения для админа**: 
  - `ADMIN_EMAIL` - email администратора (по умолчанию: admin@dmdcottage.com)
  - `ADMIN_PASSWORD` - пароль администратора (по умолчанию: admin123456)
  - `ADMIN_FIRST_NAME` - имя администратора (по умолчанию: Администратор)
  - `ADMIN_LAST_NAME` - фамилия администратора (по умолчанию: Системы)
- **Docker Compose поддержка**: Переменные администратора автоматически передаются в контейнер backend через docker-compose.yml