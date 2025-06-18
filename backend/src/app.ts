import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { sequelize } from './models';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import sheetRoutes from './routes/sheetRoutes';
import cellRoutes from './routes/cellRoutes';
import groupRoutes from './routes/groupRoutes';
import { initializeSocketHandlers } from './websocket/socketHandlers';
import { authenticateToken } from './middleware/auth';
import { initializeAdmin } from './utils/initAdmin';

// Загружаем переменные окружения
dotenv.config();
// Для Docker - также пробуем загрузить из корня проекта
if (!process.env.ADMIN_EMAIL) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const app = express();
const server = createServer(app);

// Настройка доверия к прокси для работы с nginx
app.set('trust proxy', true);

// Разрешенные origins для CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost",
  "http://localhost:3000",
  "http://localhost",
  // Поддержка продакшен доменов
  /^https?:\/\/.*\.orb\.local(:\d+)?$/,
  /^https:\/\/nginx\.raznaradki-from-gs\.orb\.local$/
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Middleware
app.use(helmet());

// Отладочный middleware для CORS
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов, попробуйте позже'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/roles', authenticateToken, roleRoutes);
app.use('/api/groups', authenticateToken, groupRoutes);
app.use('/api/sheets', authenticateToken, sheetRoutes);
app.use('/api/cells', authenticateToken, cellRoutes);

// Инициализация WebSocket обработчиков
initializeSocketHandlers(io);

// Обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 обработчик
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

const PORT = process.env.PORT || 3001;

// Подключение к базе данных и запуск сервера
sequelize.authenticate()
  .then(() => {
    console.log('✅ Подключение к базе данных установлено');
    return sequelize.sync();
  })
  .then(() => {
    // Инициализируем администратора после синхронизации БД
    return initializeAdmin();
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((error: any) => {
    console.error('❌ Ошибка при запуске сервера:', error);
  });

export { io }; 