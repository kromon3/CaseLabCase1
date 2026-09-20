// Обёртка над встроенным fetch: URL, таймаут, проверка статуса, разбор JSON.
// Про погоду и города модуль ничего не знает.
import { config } from '../config.js';
import { AppError, ApiError, NetworkError, ParseError, TimeoutError } from '../errors/AppError.js';
import { messages } from '../format/messages.js';

export function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

// Open-Meteo при ошибке отвечает { error: true, reason: '...' } — причину покажем пользователю
async function readReason(response) {
  try {
    return (await response.json()).reason;
  } catch {
    return undefined;
  }
}

// GET-запрос с таймаутом. Любой сбой превращается в одну из ошибок из errors/AppError.js.
export async function fetchJson(url, timeoutMs = config.requestTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (response.status >= 500) {
      throw new ApiError(messages.serverError(response.status), response.status);
    }
    if (!response.ok) {
      const reason = await readReason(response);
      throw new ApiError(messages.clientError(response.status, reason), response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.name === 'AbortError')
      throw new TimeoutError(messages.timeoutError(timeoutMs), error);
    if (error instanceof SyntaxError) throw new ParseError(messages.invalidJson, error);
    // fetch бросает TypeError('fetch failed'), когда нет сети / DNS / соединения
    throw new NetworkError(messages.networkError, error);
  } finally {
    clearTimeout(timer);
  }
}
