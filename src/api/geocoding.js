// Запрос 1: название города -> координаты.
// GET {geocodingUrl}?name={город}&count=1&language=ru&format=json
import { config } from '../config.js';
import { NotFoundError, ParseError } from '../errors/AppError.js';
import { messages } from '../format/messages.js';
import { buildUrl, fetchJson } from './httpClient.js';

export async function geocodeCity(city) {
  const url = buildUrl(config.geocodingUrl, {
    name: city,
    count: 1,
    language: config.language,
    format: 'json',
  });
  const data = await fetchJson(url);

  // Если город не найден, API отвечает 200, но без поля results
  const place = data?.results?.[0];
  if (!place) {
    throw new NotFoundError(messages.cityNotFound(city));
  }
  if (typeof place.latitude !== 'number' || typeof place.longitude !== 'number') {
    throw new ParseError(messages.unexpectedShape);
  }

  return {
    name: place.name,
    country: place.country ?? place.country_code ?? '',
    region: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}
