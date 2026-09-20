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
