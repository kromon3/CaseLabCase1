// Свои типы ошибок: по классу понятно, что случилось, а message уже готов для показа пользователю.
// Исходное исключение (если было) сохраняется в cause.

export class AppError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = this.constructor.name;
  }
}

// Некорректные аргументы командной строки
export class ValidationError extends AppError {}

// Геокодинг ничего не нашёл
export class NotFoundError extends AppError {}

// API ответил кодом 4xx или 5xx
export class ApiError extends AppError {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Нет сети, DNS, отказ соединения
export class NetworkError extends AppError {}

// Сработал таймаут (AbortController)
export class TimeoutError extends AppError {}

// Ответ не разобрать: не JSON или неожиданная структура
export class ParseError extends AppError {}
