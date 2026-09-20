// Запрос 2: координаты -> прогноз по дням.
// GET {forecastUrl}?latitude=..&longitude=..&daily=..&forecast_days=..&timezone=auto
import { config } from '../config.js';
import { ParseError } from '../errors/AppError.js';
import { messages } from '../format/messages.js';
import { buildUrl, fetchJson } from './httpClient.js';

const DAILY_FIELDS = 'temperature_2m_max,temperature_2m_min,precipitation_sum';

export async function fetchForecast({ latitude, longitude }, days) {
  const url = buildUrl(config.forecastUrl, {
    latitude,
    longitude,
    daily: DAILY_FIELDS,
    forecast_days: days,
    timezone: config.timezone,
    temperature_unit: config.temperatureUnit,
    precipitation_unit: config.precipitationUnit,
  });
  const data = await fetchJson(url);

  if (!data?.daily) {
    throw new ParseError(messages.unexpectedShape);
  }

  return {
    days: mapDailyResponse(data.daily),
    units: {
      temperature: data.daily_units?.temperature_2m_max ?? '°C',
      precipitation: data.daily_units?.precipitation_sum ?? config.precipitationUnit,
    },
  };
}

// API отдаёт данные «колонками»: daily.time[], daily.temperature_2m_max[], ...
// Разворачиваем их в массив объектов по дням. Отсутствующие значения API отдаёт как null.
export function mapDailyResponse(daily) {
  if (!Array.isArray(daily?.time)) {
    throw new ParseError(messages.unexpectedShape);
  }

  const {
    time,
    temperature_2m_max: max = [],
    temperature_2m_min: min = [],
    precipitation_sum: rain = [],
  } = daily;

  return time.map((date, i) => ({
    date,
    tempMin: min[i] ?? null,
    tempMax: max[i] ?? null,
    precipitation: rain[i] ?? null,
  }));
}
