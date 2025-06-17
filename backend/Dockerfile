# Стадия разработки - без компиляции
FROM node:18-alpine as development
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

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

# Финальная production стадия
FROM node:18-alpine as production
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package*.json ./
USER node
EXPOSE 3001
CMD ["node", "dist/app.js"] 