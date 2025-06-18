"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const models_1 = require("./models");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const sheetRoutes_1 = __importDefault(require("./routes/sheetRoutes"));
const cellRoutes_1 = __importDefault(require("./routes/cellRoutes"));
const groupRoutes_1 = __importDefault(require("./routes/groupRoutes"));
const socketHandlers_1 = require("./websocket/socketHandlers");
const auth_1 = require("./middleware/auth");
const initAdmin_1 = require("./utils/initAdmin");
dotenv_1.default.config();
if (!process.env.ADMIN_EMAIL) {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
}
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.set('trust proxy', true);
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost",
    "http://localhost:3000",
    "http://localhost",
    /^https?:\/\/.*\.orb\.local(:\d+)?$/,
    /^https:\/\/nginx\.raznaradki-from-gs\.orb\.local$/
];
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});
exports.io = io;
app.use((0, helmet_1.default)());
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Слишком много запросов, попробуйте позже'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', auth_1.authenticateToken, userRoutes_1.default);
app.use('/api/roles', auth_1.authenticateToken, roleRoutes_1.default);
app.use('/api/groups', auth_1.authenticateToken, groupRoutes_1.default);
app.use('/api/sheets', auth_1.authenticateToken, sheetRoutes_1.default);
app.use('/api/cells', auth_1.authenticateToken, cellRoutes_1.default);
(0, socketHandlers_1.initializeSocketHandlers)(io);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Что-то пошло не так!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});
const PORT = process.env.PORT || 3001;
models_1.sequelize.authenticate()
    .then(() => {
    console.log('✅ Подключение к базе данных установлено');
    return models_1.sequelize.sync();
})
    .then(() => {
    return (0, initAdmin_1.initializeAdmin)();
})
    .then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
})
    .catch((error) => {
    console.error('❌ Ошибка при запуске сервера:', error);
});
//# sourceMappingURL=app.js.map