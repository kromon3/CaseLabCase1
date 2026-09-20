// Бизнес-логика: город -> готовый отчёт. Решает, брать данные из кэша или из сети,
// и обрабатывает список городов. В консоль ничего не печатает.
import { geocodeCity } from '../api/geocoding.js';
import { fetchForecast } from '../api/forecast.js';
import { readCachedReport, saveReport } from '../storage/reportStore.js';

export async function buildCityReport(city, { days, noCache }) {
  if (!noCache) {
    const cached = await readCachedReport(city);
    // Кэш подходит, если в нём не меньше дней, чем запрошено; лишние дни отрезаем
    if (cached && cached.report.days.length >= days) {
      const report = { ...cached.report, days: cached.report.days.slice(0, days) };
      return { city, report, fromCache: true, file: cached.file };
    }
  }

  // Сначала координаты, потом прогноз — второй запрос зависит от первого
  const place = await geocodeCity(city);
  const forecast = await fetchForecast(place, days);

  const report = {
    query: city,
    generatedAt: new Date().toISOString(),
    place,
    units: forecast.units,
    days: forecast.days,
  };
  const file = await saveReport(city, report);

  return { city, report, fromCache: false, file };
}

// Города обрабатываются параллельно. Promise.allSettled вместо Promise.all,
// чтобы ошибка по одному городу не прерывала остальные. Порядок результатов = порядок городов.
// Успех: { city, report, fromCache, file }; ошибка: { city, error }.
export async function buildReports(cities, options) {
  const settled = await Promise.allSettled(cities.map((city) => buildCityReport(city, options)));

  return settled.map((result, i) =>
    result.status === 'fulfilled' ? result.value : { city: cities[i], error: result.reason },
  );
}
