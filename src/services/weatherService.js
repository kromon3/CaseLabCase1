// Бизнес-логика: город -> готовый отчёт и обработка списка городов. В консоль ничего не печатает.
import { geocodeCity } from '../api/geocoding.js';
import { fetchForecast } from '../api/forecast.js';

export async function buildCityReport(city, { days }) {
  // Сначала координаты, потом прогноз — второй запрос зависит от первого
  const place = await geocodeCity(city);
  const forecast = await fetchForecast(place, days);

  return {
    query: city,
    generatedAt: new Date().toISOString(),
    place,
    units: forecast.units,
    days: forecast.days,
  };
}

// Города обрабатываются параллельно. Promise.allSettled вместо Promise.all,
// чтобы ошибка по одному городу не прерывала остальные. Порядок результатов = порядок городов.
// Успех: { city, report }; ошибка: { city, error }.
export async function buildReports(cities, options) {
  const settled = await Promise.allSettled(cities.map((city) => buildCityReport(city, options)));

  return settled.map((result, i) =>
    result.status === 'fulfilled'
      ? { city: cities[i], report: result.value }
      : { city: cities[i], error: result.reason },
  );
}
