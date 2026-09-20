// Разбор аргументов командной строки штатным node:util.parseArgs (без сторонних библиотек).
import { parseArgs as nodeParseArgs } from 'node:util';
import { config, DAYS_MIN, DAYS_MAX } from '../config.js';
import { ValidationError } from '../errors/AppError.js';
import { messages } from '../format/messages.js';

const OPTIONS = {
  city: { type: 'string' },
  days: { type: 'string' },
  'no-cache': { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

// argv -> { cities, days, noCache, help }. Проверка значений — в validate.js.
export function parseArgs(argv, defaults = config) {
  let values;
  try {
    ({ values } = nodeParseArgs({ args: argv, options: OPTIONS, strict: true }));
  } catch (error) {
    // parseArgs пишет имя опции в кавычках: Unknown option '--foo'
    const option = error.message.match(/'([^']+)'/)?.[1];
    const text =
      error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION'
        ? messages.unknownOption(option)
        : messages.badArguments;
    throw new ValidationError(text, error);
  }

  const cities = (values.city ?? defaults.defaultCity)
    .split(',')
    .map((city) => city.trim())
    .filter(Boolean);

  const days = values.days === undefined ? defaults.defaultDays : Number(values.days);

  return { cities, days, noCache: values['no-cache'], help: values.help };
}

export function buildHelpText() {
  return [
    'Погодный дайджест — прогноз погоды по городам (Open-Meteo).',
    '',
    messages.usage,
    '',
    'Параметры:',
    '  --city <список>   обязательный; один город или несколько через запятую',
    `  --days <n>        число дней прогноза, ${DAYS_MIN}..${DAYS_MAX} (по умолчанию ${config.defaultDays})`,
    '  --no-cache        не использовать сохранённый отчёт за сегодня, запросить заново',
    '  -h, --help        показать эту справку',
    '',
    'Примеры:',
    '  node src/index.js --city "Нижний Новгород" --days 3',
    '  node src/index.js --city "Казань,Самара" --no-cache',
    '',
    'Настройки (URL API, таймаут, каталог отчётов, единицы измерения) задаются',
    'переменными окружения — см. .env.example.',
  ].join('\n');
}
