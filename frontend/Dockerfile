# Базовый образ для сборки
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./

# Стадия сборки
FROM base as build
RUN npm install --silent --legacy-peer-deps
COPY . ./
RUN npm run build

# Production образ с nginx - единственная стадия по умолчанию
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=build /app/build /usr/share/nginx/html

# Устанавливаем переменные окружения для production
ENV NODE_ENV=production

# Создаем custom nginx.conf для SPA
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"] 