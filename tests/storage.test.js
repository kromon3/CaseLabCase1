// Тесты хранилища: имена файлов, запись и чтение кэша. Каталог отчётов — временный.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weather-digest-'));
process.env.REPORTS_DIR = tmpDir;

// Динамический импорт — config читает process.env при загрузке модуля
const { normalizeCityName, buildReportPath, formatDateStamp } =
  await import('../src/storage/paths.js');
const { readCachedReport, saveReport } = await import('../src/storage/reportStore.js');

const REPORT = {
  query: 'Казань',
  place: { name: 'Казань', country: 'Россия', latitude: 55.78874, longitude: 49.12214 },
  units: { temperature: '°C', precipitation: 'mm' },
  days: [{ date: '2026-09-20', tempMin: 11.2, tempMax: 19.8, precipitation: 0 }],
};

test.after(() => fs.rm(tmpDir, { recursive: true, force: true }));

test('formatDateStamp: ГГГГ-ММ-ДД', () => {
  assert.equal(formatDateStamp(new Date(2026, 0, 5)), '2026-01-05');
});

test('normalizeCityName: безопасное имя файла', () => {
  assert.equal(normalizeCityName('  Нижний Новгород '), 'нижний-новгород');
  assert.equal(normalizeCityName('a/b\\c:d*e?f"g<h>i|j'), 'abcdefghij');
  assert.equal(normalizeCityName('***'), 'city');
});

test('buildReportPath: reports/{город}-{дата}.json', () => {
  const file = buildReportPath('Нижний Новгород', new Date(2026, 8, 20));

  assert.equal(file, path.join(tmpDir, 'нижний-новгород-2026-09-20.json'));
});

test('readCachedReport: нет файла -> null', async () => {
  assert.equal(await readCachedReport('Несуществующий'), null);
});

test('saveReport + readCachedReport: отчёт сохраняется и читается обратно', async () => {
  const date = new Date(2026, 8, 20);

  const file = await saveReport('Казань', REPORT, date);
  const cached = await readCachedReport('казань', date);

  assert.equal(file, path.join(tmpDir, 'казань-2026-09-20.json'));
  assert.deepEqual(cached, { file, report: REPORT });
});

test('readCachedReport: повреждённый JSON и чужая структура -> null', async () => {
  const date = new Date(2026, 8, 21);
  await fs.writeFile(buildReportPath('Битый', date), '{ not json');
  await fs.writeFile(buildReportPath('Чужой', date), JSON.stringify({ foo: 1 }));

  assert.equal(await readCachedReport('Битый', date), null);
  assert.equal(await readCachedReport('Чужой', date), null);
});
