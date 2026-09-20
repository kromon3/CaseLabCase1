#!/usr/bin/env node
/**
 * Точка входа утилиты «Погодный дайджест».
 *
 * Здесь нет ни сетевых запросов, ни работы с файлами, ни форматирования —
 * только оркестрация: разобрать аргументы, запустить сценарий, вернуть код выхода.
 *
 * Порядок сборки (модули появляются в соответствующих ветках feat/*):
 *   1. src/cli        — parseArgs + validateArgs
 *   2. src/api        — HTTP-клиент, геокодинг, прогноз
 *   3. src/services   — buildReports (параллельная обработка городов)
 *   4. src/storage    — сохранение отчёта и кэш
 *   5. src/errors     — единая обработка ошибок и код выхода 1
 */

const EXIT_OK = 0;
const EXIT_ERROR = 1;

async function main() {
  console.log('weather-digest: каркас проекта. Логика реализуется в ветках feat/*.');
  return EXIT_OK;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch(() => {
    process.exitCode = EXIT_ERROR;
  });
