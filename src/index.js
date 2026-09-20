// Точка входа: разобрать аргументы, построить отчёты, вывести их, вернуть код выхода.
import { parseArgs, buildHelpText } from './cli/args.js';
import { validateArgs } from './cli/validate.js';
import { buildReports } from './services/weatherService.js';
import { formatReport } from './format/table.js';
import { AppError } from './errors/AppError.js';
import { messages } from './format/messages.js';

const EXIT_OK = 0;
const EXIT_ERROR = 1;

// TODO(feat/error-handling): вынести в единый обработчик ошибок
function toUserMessage(error) {
  return error instanceof AppError ? error.message : 'Непредвиденная ошибка.';
}

async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    console.log(buildHelpText());
    return EXIT_OK;
  }

  const args = validateArgs(parsed);
  const results = await buildReports(args.cities, { days: args.days, noCache: args.noCache });

  // Отчёты — в stdout, ошибки по отдельным городам — в stderr
  let failed = 0;
  for (const result of results) {
    if (result.error) {
      failed += 1;
      console.error(`✖ ${result.city}: ${toUserMessage(result.error)}`);
    } else {
      console.log(`${formatReport(result)}\n`);
    }
  }

  return failed === 0 ? EXIT_OK : EXIT_ERROR;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Ошибка: ${toUserMessage(error)}`);
    if (error instanceof AppError) console.error(messages.usage);
    process.exitCode = EXIT_ERROR;
  });
