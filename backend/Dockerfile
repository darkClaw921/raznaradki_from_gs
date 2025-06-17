# Базовая стадия для production сборки
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./

# Стадия сборки для production
FROM base as build
RUN npm ci --include=dev && npm cache clean --force
COPY . .
RUN npm run build

# Production зависимости
FROM base as production-deps
RUN npm ci --only=production && npm cache clean --force

# Финальная production стадия - единственная стадия по умолчанию
FROM node:18-alpine
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package*.json ./

# Устанавливаем переменные окружения для production
ENV NODE_ENV=production

USER node
EXPOSE 3001
CMD ["node", "dist/app.js"] 