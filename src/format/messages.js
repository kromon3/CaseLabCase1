// Все тексты для пользователя в одном месте, чтобы формулировки были единообразными.
export const messages = {
  usage: 'Использование: node src/index.js --city "Город[,Город2]" [--days 1..7] [--no-cache]',
  helpHint: 'Справка по параметрам: node src/index.js --help',

  cityRequired: 'Не указан обязательный параметр --city.',
  daysOutOfRange: (min, max) => `Параметр --days должен быть целым числом от ${min} до ${max}.`,
  unknownOption: (option) => `Неизвестный параметр: ${option}.`,
  badArguments: 'Некорректные аргументы командной строки.',

  cityNotFound: (city) => `Город «${city}» не найден.`,
  networkError: 'Нет связи с сервисом погоды. Проверьте подключение к сети.',
  timeoutError: (ms) => `Превышено время ожидания ответа (${ms} мс).`,
  clientError: (status, reason) =>
    `Сервис отклонил запрос (код ${status})${reason ? `: ${reason}` : '.'}`,
  serverError: (status) =>
    `Сервис погоды временно недоступен (код ${status}). Повторите попытку позже.`,
  invalidJson: 'Сервис вернул некорректный ответ (ожидался JSON).',
  unexpectedShape: 'Сервис вернул ответ неожиданной структуры.',
  unexpectedError: 'Непредвиденная ошибка.',

  cacheHit: (file) => `Данные взяты из сохранённого отчёта: ${file}`,
  reportSaved: (file) => `Отчёт сохранён: ${file}`,
  cityFailed: (city, reason) => `✖ ${city}: ${reason}`,
  summary: (ok, failed) =>
    failed === 0
      ? `Готово: обработано городов — ${ok}.`
      : `Готово: успешно — ${ok}, с ошибками — ${failed}.`,
};
