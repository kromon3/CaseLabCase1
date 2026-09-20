// Единственное место, где читается process.env. Локальные значения — в .env (см. .env.example),
// подключается флагом: node --env-file=.env src/index.js
const env = process.env;

export const config = {
  geocodingUrl: env.GEOCODING_API_URL || 'https://geocoding-api.open-meteo.com/v1/search',
  forecastUrl: env.FORECAST_API_URL || 'https://api.open-meteo.com/v1/forecast',
  requestTimeoutMs: Number(env.REQUEST_TIMEOUT_MS) || 5000,
  reportsDir: env.REPORTS_DIR || 'reports',
  defaultDays: Number(env.DEFAULT_FORECAST_DAYS) || 3,
  temperatureUnit: env.TEMPERATURE_UNIT || 'celsius',
  precipitationUnit: env.PRECIPITATION_UNIT || 'mm',
  language: env.GEOCODING_LANGUAGE || 'ru',
  timezone: env.FORECAST_TIMEZONE || 'auto',
  // Города по умолчанию, если --city не передан (удобно для Docker): CITY=Казань,Самара
  defaultCity: env.CITY || '',
};

export const DAYS_MIN = 1;
export const DAYS_MAX = 7;
