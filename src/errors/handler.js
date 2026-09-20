// Единая обработка ошибок: понятное сообщение без стек-трейса и код выхода 1.
import { messages } from '../format/messages.js';
import { AppError, ValidationError } from './AppError.js';

export const EXIT_OK = 0;
export const EXIT_ERROR = 1;

// Свои ошибки уже содержат готовый текст; всё остальное — «непредвиденная ошибка» без подробностей
export function toUserMessage(error) {
  return error instanceof AppError ? error.message : messages.unexpectedError;
}

// Печатает причину в stderr и выставляет код выхода.
// process.exit() не вызываем, чтобы вывод успел записаться.
export function fail(error) {
  console.error(`Ошибка: ${toUserMessage(error)}`);
  if (error instanceof ValidationError) {
    console.error(`${messages.usage}\n${messages.helpHint}`);
  }
  process.exitCode = EXIT_ERROR;
}

// Страховка от ошибок, не пойманных в основном сценарии
export function registerGlobalHandlers() {
  process.on('unhandledRejection', fail);
  process.on('uncaughtException', fail);
}
