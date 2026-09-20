// Проверка уже разобранных аргументов. Ни сети, ни файлов — только правила.
import { DAYS_MIN, DAYS_MAX } from '../config.js';
import { ValidationError } from '../errors/AppError.js';
import { messages } from '../format/messages.js';

export function validateArgs(args) {
  if (args.cities.length === 0) {
    throw new ValidationError(messages.cityRequired);
  }

  const { days } = args;
  if (!Number.isInteger(days) || days < DAYS_MIN || days > DAYS_MAX) {
    throw new ValidationError(messages.daysOutOfRange(DAYS_MIN, DAYS_MAX));
  }

  // Один и тот же город второй раз не запрашиваем (регистр не важен)
  const cities = [];
  for (const city of args.cities) {
    if (!cities.some((known) => known.toLowerCase() === city.toLowerCase())) {
      cities.push(city);
    }
  }

  return { ...args, cities };
}
