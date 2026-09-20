// Точка входа: разобрать аргументы, построить отчёты, вывести их, вернуть код выхода.
import { parseArgs, buildHelpText } from './cli/args.js';
import { validateArgs } from './cli/validate.js';
import { buildReports } from './services/weatherService.js';
import { formatReport } from './format/table.js';
import { messages } from './format/messages.js';
import {
  toUserMessage,
  fail,
  registerGlobalHandlers,
  EXIT_OK,
  EXIT_ERROR,
} from './errors/handler.js';

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
      console.error(messages.cityFailed(result.city, toUserMessage(result.error)));
    } else {
      console.log(`${formatReport(result)}\n`);
    }
  }

  console.log(messages.summary(results.length - failed, failed));
  return failed === 0 ? EXIT_OK : EXIT_ERROR;
}

registerGlobalHandlers();

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch(fail);
