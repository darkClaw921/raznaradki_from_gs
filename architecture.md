# Архитектура проекта DMD Cottage Sheets

## Обзор проекта
Веб-сервис для совместной работы с таблицами, аналог Google Sheets для компании DMD cottage.
Сервис работает в production на сервере с внешним nginx по адресу: **https://dmd-cottage.alteran-industries.ru**

## Структура проекта
- `backend/` - Серверная часть на Node.js + TypeScript + Express + Sequelize
- `frontend/` - Клиентская часть на React + TypeScript + Material-UI  
- `database/` - SQL схемы и миграции для MySQL
- `nginx/` - Конфигурация веб-сервера и SSL сертификаты
- `docker-compose.yml` - Оркестрация контейнеров

## Основные компоненты

### Backend (/backend)
- **app.ts**: Точка входа, настройка Express сервера, middleware, Socket.io, инициализация админа
- **controllers/**: Обработчики HTTP запросов
  - authController.ts - аутентификация, регистрация и приглашения пользователей
  - userController.ts - управление пользователями (CRUD, деактивация)
  - roleController.ts - управление ролями и разрешениями
  - sheetController.ts - работа с таблицами (создание, редактирование, доступ)
  - cellController.ts - операции с ячейками (обновление, формулы)
  - groupController.ts - управление группами пользователей (права доступа)
  - sheetTemplateController.ts - создание таблиц из шаблонов
  - systemController.ts - управление системными настройками webhook
  - webhookController.ts - обработка входящих webhook и настройка маппинга
    - **processWebhook** - основной обработчик webhook с поддержкой действий create/update/delete
    - **extractWebhookInfo** - извлечение типа действия и данных бронирования
    - **addBookingToSheet** - добавление/обновление бронирования в таблицу
    - **deleteBookingFromSheet** - удаление бронирования и сдвиг строк вверх
    - **findTargetSheets** - поиск таблиц по названию апартамента
- **models/**: Модели данных для Sequelize ORM
  - index.ts - конфигурация Sequelize и настройка ассоциаций
  - User.ts - модель пользователя с аутентификацией
  - Role.ts - модель роли (системные и пользовательские)
  - Permission.ts - модель разрешений (resource + action)
  - Sheet.ts - модель таблицы с настройками и метаданными
  - Cell.ts - модель ячейки с поддержкой формул и форматирования
  - UserSheet.ts - связь пользователя с таблицей + разрешения на строки/столбцы
  - RolePermission.ts - связь ролей с разрешениями
  - CellHistory.ts - история изменений ячеек
  - SheetTemplate.ts - модель шаблонов таблиц
  - SystemSettings.ts - системные настройки webhook
  - WebhookMapping.ts - привязка апартаментов к таблицам для webhook
- **routes/**: API маршруты
  - authRoutes.ts - маршруты аутентификации (/api/auth)
  - userRoutes.ts - маршруты пользователей (/api/users)
  - roleRoutes.ts - маршруты ролей (/api/roles)
  - sheetRoutes.ts - маршруты таблиц (/api/sheets)
  - cellRoutes.ts - маршруты ячеек (/api/cells)
  - groupRoutes.ts - маршруты групп (/api/groups)
  - sheetTemplateRoutes.ts - маршруты шаблонов (/api/templates)
  - systemRoutes.ts - системные настройки webhook (/api/system)
  - webhookRoutes.ts - обработка webhook и маппинг (/api/webhook)
- **middleware/**: Промежуточное ПО
  - auth.ts - аутентификация JWT, проверка ролей и разрешений
- **utils/**: Утилиты backend
  - initAdmin.ts - автоматическая инициализация администратора при запуске
  - migrations.ts - система автоматического выполнения SQL миграций при запуске сервера
- **websocket/**: Real-time функционал
  - socketHandlers.ts - обработчики WebSocket для совместной работы

### Frontend (/frontend)
- **components/**: React компоненты
  - PrivateRoute.tsx - защищенные маршруты
  - Admin/
    - WebhookSettings.tsx - управление настройками webhook в админской панели
  - Spreadsheet/ - компоненты таблицы
     - **✅ Spreadsheet.tsx - основной компонент таблицы с ВИРТУАЛИЗАЦИЕЙ для оптимизации производительности**
      - **Виртуализация строк: рендерит только видимые строки + буфер**
      - **Константы: ROW_HEIGHT_DEFAULT=30px, BUFFER_SIZE=5 строк**
      - **Функции виртуализации: getVisibleRows(), getTotalHeight(), getRowOffset()**
      - **Автоматическая прокрутка к выделенной ячейке при навигации с клавиатуры**
      - **Обработчик скролла с дебаунсингом для плавности**
       - **Значительное улучшение производительности для больших таблиц (300+ строк)**
       - **НОВОЕ: Для шаблонов "Отчет" первая строка (шапка) рендерится кастомно: A1:B1 объединены и содержат дату отчета, C1:F1 и G1:Q1 объединены и выравнены по центру. Текст "ДАТА ОТЧЕТА" убран из A1.**
       - **Экспорт**:
         - Excel (XLSX) — через ExcelJS: сохраняются ширины столбцов, высоты строк, объединения ячеек, границы (включая усиленную левую границу для столбцов C и G у шаблона DMD Cottage), заливки, шрифты, выравнивание и перенос текста. Шапка отчета объединяется (A1:B1, C1:F1, G1:Q1) и центрируется.
         - CSV — только данные (форматирование не поддерживается), разделитель `;`, добавляется `sep=;` и BOM для корректного открытия в Excel.
    - Cell.tsx - компонент отдельной ячейки с редактированием
    - WebhookConfigDialog.tsx - диалог настройки webhook маппинга для таблиц
- **pages/**: Страницы приложения
  - Login.tsx - страница входа с формами логина/регистрации
  - Dashboard.tsx ✅ ИСПРАВЛЕН - главная страница со списком таблиц
  - ✅ НОВОЕ: Функциональные кнопки действий с таблицами (редактирование/удаление)
  - ✅ НОВОЕ: Меню с тремя точками для каждой таблицы
  - ✅ НОВОЕ: Диалоги редактирования и подтверждения удаления
  - ✅ НОВОЕ: Валидация и права доступа при редактировании/удалении
  - Sheet.tsx - страница работы с таблицей
  - AdminPanel.tsx - панель администратора
  - SheetView.tsx - просмотр конкретной таблицы (user permissions)
- **store/**: Redux store (Redux Toolkit)
  - index.ts - конфигурация store
  - authSlice.ts - состояние аутентификации и async thunks
  - sheetSlice.ts - состояние таблиц
  - userSlice.ts - состояние пользователей
- **services/**: API и WebSocket сервисы
   - api.ts - HTTP клиент с interceptors для всех API endpoints
    - systemApi - управление системными настройками webhook
    - webhookApi - управление маппингом апартаментов для webhook
  - websocket.ts - WebSocket сервис для real-time функций
- **types/**: TypeScript типы
  - index.ts - общие типы данных и API responses
- **public/**: Статические файлы
  - index.html - HTML шаблон приложения

### База данных
- **MySQL**: Основное хранилище данных
- **Автоматические миграции**: SQL миграции выполняются автоматически при запуске сервера
  - 007_add_booking_id_to_cells.sql - добавление поля booking_id для связи с внешними бронированиями
- **Таблица миграций**: Автоматически создается таблица `migrations` для отслеживания выполненных миграций
- **Таблицы**:
  - users - пользователи
  - roles - роли
  - permissions - разрешения
  - sheets - таблицы
  - cells - ячейки
  - user_sheets - связи пользователей с таблицами
  - role_permissions - связи ролей с разрешениями
  - report_sources - связи many-to-many между отчетами и журналами

## Webhook система

### Поддерживаемые действия
- **create_or_update** (по умолчанию) - создание нового или обновление существующего бронирования
- **delete_booking** - удаление бронирования из таблицы

### Обработка webhook
1. **Валидация** - проверка включения webhook и корректности webhook ID
2. **Извлечение данных** - парсинг типа действия и данных бронирования
3. **Поиск таблиц** - определение целевых таблиц по названию апартамента
4. **Обработка действия**:
   - Для `delete_booking`: удаление ячеек и сдвиг строк вверх
   - Для других действий: добавление/обновление данных

### Функции webhook
- **extractWebhookInfo** - извлечение типа действия и данных из webhook
- **deleteBookingFromSheet** - удаление бронирования и сдвиг строк вверх
- **addBookingToSheet** - добавление/обновление бронирования в таблицу
- **findTargetSheets** - поиск таблиц по названию апартамента (для создания/обновления)
- **findSheetsByBookingId** - поиск таблиц по ID бронирования (для удаления)

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
- ExcelJS для экспорта XLSX с сохранением форматирования

### DevOps
- Docker + Docker Compose (без nginx)
- MySQL 8.0
- Внешний nginx для reverse proxy (на сервере)
- Production домен: https://dmd-cottage.alteran-industries.ru

## Основные функции

## Frontend компоненты

### Spreadsheet
- **Cell.tsx** - компонент ячейки таблицы. Отвечает за отображение и редактирование данных ячейки. Реализует специальные стили для отчетов заселения/выселения (толстые границы для колонок C и G на основе шаблона).
- **Spreadsheet.tsx** - основной компонент таблицы. Управляет отображением данных, экспортом в Excel с сохранением форматирования (включая толстые границы для отчетов). Передает информацию о шаблоне в компонент Cell.


### Production развертывание

**Адрес сервиса**: https://dmd-cottage.alteran-industries.ru

1. **Настройка .env файла**:
   ```bash
   cp env.example .env
   # Отредактируйте .env с production настройками
   ```

2. **Запуск сервисов через Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Настройка nginx на сервере** (требуется для проксирования):
   ```nginx
   # /etc/nginx/sites-available/dmd-cottage
   server {
       server_name dmd-cottage.alteran-industries.ru;
       
       # Frontend
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # API
       location /api/ {
           proxy_pass http://127.0.0.1:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # WebSocket
       location /socket.io/ {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
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
 -
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

### Запуск для разработки
```bash
docker-compose -f docker-compose-dev.yml up -d
```

### 13. Улучшения форматирования для шаблона "Отчет заселения/выселения DMD Cottage" (перенос текста и автонастройка)
- Добавлен перенос текста по умолчанию для всех ячеек отчета DMD Cottage на уровне `Cell.tsx` (whiteSpace: normal, wordWrap: break-word, overflow: visible), чтобы перенос не терялся после изменения даты и повторных автонастроек.
- Автонастройка размеров стала идемпотентной:
  - Ширина колонок рассчитывается через точное измерение текста (canvas) с учетом паддингов, что исключает колебания размеров при повторном запуске.
  - Высота строк перерассчитывается с учетом уже вычисленных новых ширин колонок, что предотвращает выезд текста за границы при повторном запуске автонастройки.
  - Безопасное сохранение `settings` с дефолтами исключает перезатирание настроек.
  - Автозапуск: при изменении `reportDate` для отчетов автоматически вызывается «автонастройка размеров строк и столбцов» после загрузки ячеек.


## Дополнительные возможности для развития

- Расширенная система формул (как в Excel)
- Импорт/экспорт файлов (XLSX, CSV)
- Комментарии к ячейкам
- История изменений и версионирование
- Уведомления пользователей
- Мобильное приложение
- Интеграция с внешними сервисами


