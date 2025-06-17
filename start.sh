#!/bin/bash
# Скрипт для запуска DMD Cottage Sheets в режиме разработки

echo "🚀 Запуск DMD Cottage Sheets..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "📋 Создаю .env файл из примера..."
    cp env.example .env
    echo "✅ Файл .env создан. Отредактируйте его при необходимости."
fi

# Запускаем сервисы
echo "🐳 Запускаю Docker контейнеры..."
docker-compose up -d

# Ждем запуска MySQL
echo "⏳ Ожидаю запуска MySQL..."
sleep 10

echo ""
echo "✅ Проект запущен!"
echo ""
echo "🌐 Приложение доступно по адресу: http://localhost"
echo "🗄️  Adminer (БД): http://localhost:8080"
echo "🔧 Backend API: http://localhost:3001"
echo "⚛️  Frontend: http://localhost:3000"
echo ""
echo "📝 Логи: docker-compose logs -f"
echo "🛑 Остановка: docker-compose down"
echo ""

# Показываем статус контейнеров
docker-compose ps 