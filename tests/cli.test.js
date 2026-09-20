// Тесты разбора и валидации аргументов. Запуск: npm test (node:test, без сторонних фреймворков).
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs, buildHelpText } from '../src/cli/args.js';
import { validateArgs } from '../src/cli/validate.js';
import { ValidationError } from '../src/errors/AppError.js';

// «Окружение» для тестов, чтобы не зависеть от реального process.env
const DEFAULTS = { defaultCity: '', defaultDays: 3 };

test('parseArgs: один город и число дней', () => {
  const args = parseArgs(['--city', 'Казань', '--days', '5'], DEFAULTS);

  assert.deepEqual(args, { cities: ['Казань'], days: 5, noCache: false, help: false });
});

test('parseArgs: список городов через запятую, пробелы и пустые элементы убираются', () => {
  const args = parseArgs(['--city', ' Казань , Нижний Новгород ,, '], DEFAULTS);

  assert.deepEqual(args.cities, ['Казань', 'Нижний Новгород']);
});

test('parseArgs: число дней по умолчанию', () => {
  assert.equal(parseArgs(['--city', 'Казань'], { ...DEFAULTS, defaultDays: 4 }).days, 4);
});

test('parseArgs: флаги --no-cache и --help', () => {
  assert.equal(parseArgs(['--city', 'Казань', '--no-cache'], DEFAULTS).noCache, true);
  assert.equal(parseArgs(['--help'], DEFAULTS).help, true);
  assert.equal(parseArgs(['-h'], DEFAULTS).help, true);
});

test('parseArgs: город из окружения (CITY), если --city не передан', () => {
  const args = parseArgs([], { ...DEFAULTS, defaultCity: 'Самара,Уфа' });

  assert.deepEqual(args.cities, ['Самара', 'Уфа']);
});

test('parseArgs: неизвестная опция -> ValidationError с именем опции', () => {
  assert.throws(
    () => parseArgs(['--city', 'Казань', '--foo'], DEFAULTS),
    (error) => error instanceof ValidationError && /--foo/.test(error.message),
  );
});

test('parseArgs: опция без значения и лишний аргумент -> ValidationError', () => {
  assert.throws(() => parseArgs(['--city'], DEFAULTS), ValidationError);
  assert.throws(() => parseArgs(['Казань'], DEFAULTS), ValidationError);
});

test('validateArgs: пропускает корректные аргументы и убирает дубликаты городов', () => {
  const args = validateArgs({ cities: ['Казань', 'казань', 'Самара'], days: 3, noCache: false });

  assert.deepEqual(args.cities, ['Казань', 'Самара']);
  assert.equal(args.days, 3);
});

test('validateArgs: отсутствующий --city', () => {
  assert.throws(() => validateArgs({ cities: [], days: 3 }), ValidationError);
});

test('validateArgs: --days вне диапазона 1..7 или не число', () => {
  for (const days of [0, 8, -1, 2.5, Number.NaN]) {
    assert.throws(
      () => validateArgs({ cities: ['Казань'], days }),
      ValidationError,
      `days=${days}`,
    );
  }
});

test('validateArgs: граничные значения --days проходят', () => {
  assert.equal(validateArgs({ cities: ['Казань'], days: 1 }).days, 1);
  assert.equal(validateArgs({ cities: ['Казань'], days: 7 }).days, 7);
});

test('buildHelpText: перечислены все параметры', () => {
  const help = buildHelpText();
  for (const option of ['--city', '--days', '--no-cache', '--help']) {
    assert.ok(help.includes(option), option);
  }
});
