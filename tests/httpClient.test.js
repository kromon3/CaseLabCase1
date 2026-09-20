// Тесты HTTP-клиента: сборка URL и все ошибочные сценарии.
// Сеть не используется — глобальный fetch подменяется через node:test mock.
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildUrl, fetchJson } from '../src/api/httpClient.js';
import { ApiError, NetworkError, ParseError, TimeoutError } from '../src/errors/AppError.js';

const URL_UNDER_TEST = 'https://api.example.test/v1/forecast?latitude=1&longitude=2';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('buildUrl: добавляет query-параметры, кириллица кодируется', () => {
  const url = new URL(
    buildUrl('https://geo.example.test/v1/search', { name: 'Нижний Новгород', count: 1 }),
  );

  assert.equal(url.origin + url.pathname, 'https://geo.example.test/v1/search');
  assert.equal(url.searchParams.get('name'), 'Нижний Новгород');
  assert.equal(url.searchParams.get('count'), '1');
});

test('fetchJson: статус 200 -> разобранный JSON', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => jsonResponse({ ok: true }));

  assert.deepEqual(await fetchJson(URL_UNDER_TEST), { ok: true });
  assert.equal(fetchMock.mock.calls[0].arguments[0], URL_UNDER_TEST);
  assert.ok(fetchMock.mock.calls[0].arguments[1].signal instanceof AbortSignal, 'передан signal');
});

test('fetchJson: статус 4xx -> ApiError с причиной из тела ответа', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({ error: true, reason: 'Forecast days is invalid' }, 400),
  );

  await assert.rejects(fetchJson(URL_UNDER_TEST), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.match(error.message, /400.*Forecast days is invalid/);
    return true;
  });
});

test('fetchJson: статус 5xx -> ApiError «временно недоступен»', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('Service Unavailable', { status: 503 }),
  );

  await assert.rejects(fetchJson(URL_UNDER_TEST), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 503);
    assert.match(error.message, /503/);
    return true;
  });
});

test('fetchJson: некорректный JSON -> ParseError', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>not json</html>'));

  await assert.rejects(fetchJson(URL_UNDER_TEST), ParseError);
});

test('fetchJson: нет сети (TypeError от fetch) -> NetworkError', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('fetch failed');
  });

  await assert.rejects(fetchJson(URL_UNDER_TEST), NetworkError);
});

test('fetchJson: таймаут (AbortController) -> TimeoutError', async (t) => {
  // fetch «зависает» и завершается только по сигналу отмены
  t.mock.method(
    globalThis,
    'fetch',
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      }),
  );

  await assert.rejects(fetchJson(URL_UNDER_TEST, 10), (error) => {
    assert.ok(error instanceof TimeoutError);
    assert.match(error.message, /10 мс/);
    return true;
  });
});
