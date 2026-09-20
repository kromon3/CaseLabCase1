// Точка входа: разобрать аргументы, запустить сценарий, вернуть код выхода.
import { parseArgs, buildHelpText } from './cli/args.js';
import { validateArgs } from './cli/validate.js';
import { AppError } from './errors/AppError.js';
import { messages } from './format/messages.js';

const EXIT_OK = 0;
const EXIT_ERROR = 1;

async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    console.log(buildHelpText());
    return EXIT_OK;
  }

  const args = validateArgs(parsed);

  // TODO(feat/api-client): запросить прогноз по каждому городу и вывести отчёты
  console.log(`Города: ${args.cities.join(', ')}; дней: ${args.days}; без кэша: ${args.noCache}`);
  return EXIT_OK;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    // TODO(feat/error-handling): вынести в единый обработчик ошибок
    const text = error instanceof AppError ? error.message : 'Непредвиденная ошибка.';
    console.error(`Ошибка: ${text}`);
    if (error instanceof AppError) console.error(messages.usage);
    process.exitCode = EXIT_ERROR;
  });
