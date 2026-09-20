// Тесты разбора ответов API: геокодинг и прогноз. fetch подменяется, сеть не нужна.
import test from 'node:test';
import assert from 'node:assert/strict';

import { mapDailyResponse, fetchForecast } from '../src/api/forecast.js';
import { geocodeCity } from '../src/api/geocoding.js';
import { NotFoundError, ParseError } from '../src/errors/AppError.js';

const DAILY = {
  time: ['2026-09-20', '2026-09-21'],
  temperature_2m_max: [18.4, 16.1],
  temperature_2m_min: [9.2, 8.0],
  precipitation_sum: [0, 2.4],
};

const PLACE = {
  id: 520555,
  name: 'Нижний Новгород',
  latitude: 56.32867,
  longitude: 44.00205,
  country_code: 'RU',
  country: 'Россия',
  admin1: 'Нижегородская Область',
  timezone: 'Europe/Moscow',
};

function jsonResponse(body) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
}

test('mapDailyResponse: колонки ответа разворачиваются в массив дней', () => {
  assert.deepEqual(mapDailyResponse(DAILY), [
    { date: '2026-09-20', tempMin: 9.2, tempMax: 18.4, precipitation: 0 },
    { date: '2026-09-21', tempMin: 8.0, tempMax: 16.1, precipitation: 2.4 },
  ]);
});

test('mapDailyResponse: пустой ответ -> пустой массив', () => {
  assert.deepEqual(mapDailyResponse({ time: [] }), []);
});

test('mapDailyResponse: отсутствующие значения остаются null', () => {
  const days = mapDailyResponse({ ...DAILY, precipitation_sum: [null, 2.4] });

  assert.equal(days[0].precipitation, null);
  assert.equal(days[1].precipitation, 2.4);
});

test('mapDailyResponse: нет массива дат -> ParseError', () => {
  assert.throws(() => mapDailyResponse(undefined), ParseError);
  assert.throws(() => mapDailyResponse({}), ParseError);
});

test('geocodeCity: пустой результат -> NotFoundError', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ generationtime_ms: 0.1 }));

  await assert.rejects(geocodeCity('Qwertyuiopville'), (error) => {
    assert.ok(error instanceof NotFoundError);
    assert.match(error.message, /Qwertyuiopville/);
    return true;
  });
});

test('geocodeCity: запрос с name и count=1, из ответа берутся нужные поля', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({ results: [PLACE] }),
  );

  const place = await geocodeCity('Нижний Новгород');

  assert.deepEqual(place, {
    name: 'Нижний Новгород',
    country: 'Россия',
    region: 'Нижегородская Область',
    latitude: 56.32867,
    longitude: 44.00205,
    timezone: 'Europe/Moscow',
  });
  const requested = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(requested.searchParams.get('name'), 'Нижний Новгород');
  assert.equal(requested.searchParams.get('count'), '1');
});

test('geocodeCity: запись без координат -> ParseError', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ results: [{ name: 'Где-то' }] }));

  await assert.rejects(geocodeCity('Где-то'), ParseError);
});

test('fetchForecast: запрос по координатам, ответ разворачивается в дни и единицы', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      daily_units: { temperature_2m_max: '°C', precipitation_sum: 'mm' },
      daily: DAILY,
    }),
  );

  const forecast = await fetchForecast({ latitude: 56.32867, longitude: 44.00205 }, 2);

  assert.equal(forecast.days.length, 2);
  assert.deepEqual(forecast.units, { temperature: '°C', precipitation: 'mm' });

  const requested = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(requested.searchParams.get('latitude'), '56.32867');
  assert.equal(requested.searchParams.get('longitude'), '44.00205');
  assert.equal(requested.searchParams.get('forecast_days'), '2');
  assert.equal(
    requested.searchParams.get('daily'),
    'temperature_2m_max,temperature_2m_min,precipitation_sum',
  );
});

test('fetchForecast: ответ без поля daily -> ParseError', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ slideshow: {} }));

  await assert.rejects(fetchForecast({ latitude: 1, longitude: 2 }, 3), ParseError);
});
