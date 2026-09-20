// Тесты бизнес-логики: цепочка запросов, кэш, параллельная обработка городов.
// fetch подменяется имитацией Open-Meteo, каталог отчётов — временный.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weather-digest-'));
process.env.REPORTS_DIR = tmpDir;

const { buildCityReport, buildReports } = await import('../src/services/weatherService.js');
const { NotFoundError, ApiError } = await import('../src/errors/AppError.js');

const PLACES = {
  Казань: { name: 'Казань', country: 'Россия', latitude: 55.78874, longitude: 49.12214 },
  Самара: { name: 'Самара', country: 'Россия', latitude: 53.20007, longitude: 50.15 },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function daily(count) {
  return {
    time: Array.from({ length: count }, (_, i) => `2026-09-${20 + i}`),
    temperature_2m_max: Array.from({ length: count }, (_, i) => 20 + i),
    temperature_2m_min: Array.from({ length: count }, (_, i) => 10 + i),
    precipitation_sum: Array.from({ length: count }, () => 0),
  };
}

// Имитация Open-Meteo: геокодинг знает города из PLACES, прогноз отдаёт столько дней, сколько просят.
// forecastOverride позволяет подменить ответ прогноза в отдельном тесте.
function mockOpenMeteo(t, forecastOverride) {
  return t.mock.method(globalThis, 'fetch', async (rawUrl) => {
    const url = new URL(rawUrl);
    if (url.pathname.endsWith('/search')) {
      const place = PLACES[url.searchParams.get('name')];
      return jsonResponse(place ? { results: [place] } : {});
    }
    if (forecastOverride) return forecastOverride(url);
    return jsonResponse({ daily: daily(Number(url.searchParams.get('forecast_days'))) });
  });
}

test.after(() => fs.rm(tmpDir, { recursive: true, force: true }));

test('buildCityReport: сначала геокодинг, затем прогноз по полученным координатам', async (t) => {
  const fetchMock = mockOpenMeteo(t);

  const result = await buildCityReport('Казань', { days: 3, noCache: true });

  assert.equal(fetchMock.mock.callCount(), 2);
  const [first, second] = fetchMock.mock.calls.map((call) => new URL(call.arguments[0]));
  assert.match(first.pathname, /search$/);
  assert.equal(second.searchParams.get('latitude'), '55.78874');
  assert.equal(second.searchParams.get('longitude'), '49.12214');

  assert.equal(result.fromCache, false);
  assert.equal(result.report.place.name, 'Казань');
  assert.equal(result.report.days.length, 3);
  await fs.access(result.file); // файл действительно создан
});

test('buildCityReport: повторный запуск берёт данные из кэша без обращения к сети', async (t) => {
  const fetchMock = mockOpenMeteo(t);

  await buildCityReport('Самара', { days: 3, noCache: true });
  assert.equal(fetchMock.mock.callCount(), 2);

  const cached = await buildCityReport('Самара', { days: 3, noCache: false });
  assert.equal(fetchMock.mock.callCount(), 2, 'сеть не использовалась');
  assert.equal(cached.fromCache, true);
});

test('buildCityReport: --no-cache запрашивает заново, даже если файл есть', async (t) => {
  const fetchMock = mockOpenMeteo(t);

  const fresh = await buildCityReport('Самара', { days: 3, noCache: true });

  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(fresh.fromCache, false);
});

test('buildCityReport: если в кэше меньше дней, чем запрошено, данные запрашиваются заново', async (t) => {
  const fetchMock = mockOpenMeteo(t);

  const bigger = await buildCityReport('Самара', { days: 5, noCache: false });
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(bigger.fromCache, false);
  assert.equal(bigger.report.days.length, 5);

  // Теперь в кэше 5 дней — запрос на 2 дня обслуживается из файла и обрезается
  const smaller = await buildCityReport('Самара', { days: 2, noCache: false });
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(smaller.fromCache, true);
  assert.equal(smaller.report.days.length, 2);
});

test('buildReports: ошибка по одному городу не мешает остальным, порядок сохраняется', async (t) => {
  mockOpenMeteo(t);

  const results = await buildReports(['Казань', 'Qwertyuiopville', 'Самара'], {
    days: 2,
    noCache: true,
  });

  assert.deepEqual(
    results.map((r) => r.city),
    ['Казань', 'Qwertyuiopville', 'Самара'],
  );
  assert.equal(results[0].error, undefined);
  assert.ok(results[1].error instanceof NotFoundError);
  assert.equal(results[2].error, undefined);
});

test('buildReports: ошибка API возвращается как результат, а не исключение', async (t) => {
  mockOpenMeteo(t, (url) =>
    url.searchParams.get('latitude') === '55.78874'
      ? jsonResponse({ error: true, reason: 'boom' }, 500)
      : jsonResponse({ daily: daily(1) }),
  );

  const results = await buildReports(['Казань', 'Самара'], { days: 1, noCache: true });

  assert.ok(results[0].error instanceof ApiError);
  assert.equal(results[0].error.status, 500);
  assert.equal(results[1].error, undefined);
});
