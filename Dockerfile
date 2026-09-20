# Образ утилиты «Погодный дайджест».
#
# Сборка:   docker build -t weather-digest .
# Запуск:   docker run --rm -v "$PWD/reports:/app/reports" weather-digest --city "Казань" --days 3
#
# Параметры передаются переменными окружения (см. .env.example), например:
#   docker run --rm -e CITY="Казань,Самара" -e DEFAULT_FORECAST_DAYS=5 -e REQUEST_TIMEOUT_MS=8000 \
#     -v "$PWD/reports:/app/reports" weather-digest
#   docker run --rm --env-file .env -v "$PWD/reports:/app/reports" weather-digest --city "Уфа"

FROM node:20-alpine

WORKDIR /app

# У утилиты нет runtime-зависимостей: используется только встроенный fetch,
# поэтому npm install на этапе сборки не нужен — копируем манифест и исходники.
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production \
    REPORTS_DIR=/app/reports

# Каталог отчётов принадлежит непривилегированному пользователю node,
# чтобы его можно было смонтировать томом и писать в него без root.
RUN mkdir -p /app/reports && chown -R node:node /app
USER node
VOLUME ["/app/reports"]

ENTRYPOINT ["node", "src/index.js"]
