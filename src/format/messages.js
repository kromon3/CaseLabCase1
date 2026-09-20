// Все тексты для пользователя в одном месте, чтобы формулировки были единообразными.
export const messages = {
  usage: 'Использование: node src/index.js --city "Город[,Город2]" [--days 1..7] [--no-cache]',

  cityRequired: 'Не указан обязательный параметр --city.',
  daysOutOfRange: (min, max) => `Параметр --days должен быть целым числом от ${min} до ${max}.`,
  unknownOption: (option) => `Неизвестный параметр: ${option}.`,
  badArguments: 'Некорректные аргументы командной строки.',
};
