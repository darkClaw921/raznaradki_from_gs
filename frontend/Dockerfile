# Базовый образ для всех стадий
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./

# Стадия разработки
FROM base as development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Стадия сборки
FROM base as build
RUN npm ci --silent
COPY . ./
RUN npm run build

# Продакшн образ с nginx
FROM nginx:alpine as production
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"] 