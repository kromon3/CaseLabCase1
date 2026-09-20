// Тесты единой обработки ошибок: текст для пользователя, код выхода, подсказка по использованию.
import test from 'node:test';
import assert from 'node:assert/strict';

import { toUserMessage, fail, EXIT_ERROR } from '../src/errors/handler.js';
import {
  ValidationError,
  NotFoundError,
  ApiError,
  NetworkError,
  TimeoutError,
  ParseError,
} from '../src/errors/AppError.js';
import { messages } from '../src/format/messages.js';

// Перехватывает console.error и возвращает всё напечатанное одной строкой
function captureStderr(t) {
  const mock = t.mock.method(console, 'error', () => {});
  return () => mock.mock.calls.map((call) => call.arguments.join(' ')).join('\n');
}

test('toUserMessage: текст своих ошибок возвращается как есть', () => {
  const errors = [
    new ValidationError('Не указан обязательный параметр --city.'),
    new NotFoundError('Город «X» не найден.'),
    new ApiError('Сервис отклонил запрос (код 400).', 400),
    new NetworkError('Нет связи с сервисом погоды.'),
    new TimeoutError('Превышено время ожидания ответа (5000 мс).'),
    new ParseError('Сервис вернул некорректный ответ.'),
  ];
  for (const error of errors) {
    assert.equal(toUserMessage(error), error.message);
  }
});

test('toUserMessage: детали непредвиденных ошибок скрываются', () => {
  assert.equal(
    toUserMessage(new Error('ENOSPC: no space left on device')),
    messages.unexpectedError,
  );
  assert.equal(toUserMessage(undefined), messages.unexpectedError);
});

test('свои ошибки сохраняют имя класса, статус и cause', () => {
  const cause = new TypeError('fetch failed');
  const network = new NetworkError('Нет сети', cause);
  const api = new ApiError('Ошибка', 503);

  assert.equal(network.name, 'NetworkError');
  assert.equal(network.cause, cause);
  assert.equal(api.status, 503);
});

test('fail: печатает сообщение без стек-трейса и выставляет код выхода 1', (t) => {
  const previousExitCode = process.exitCode;
  t.after(() => {
    process.exitCode = previousExitCode;
  });
  const output = captureStderr(t);

  fail(new NotFoundError('Город «X» не найден.'));

  assert.equal(process.exitCode, EXIT_ERROR);
  assert.match(output(), /Город «X» не найден\./);
  assert.doesNotMatch(output(), /\n\s+at /, 'стек-трейса быть не должно');
});

test('fail: для ошибок аргументов добавляет строку использования', (t) => {
  const previousExitCode = process.exitCode;
  t.after(() => {
    process.exitCode = previousExitCode;
  });
  const output = captureStderr(t);

  fail(new ValidationError(messages.cityRequired));

  assert.ok(output().includes(messages.usage));
});
