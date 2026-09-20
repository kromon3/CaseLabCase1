// Все тексты для пользователя в одном месте, чтобы формулировки были единообразными.
export const messages = {
  usage: 'Использование: node src/index.js --city "Город[,Город2]" [--days 1..7] [--no-cache]',

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
};
