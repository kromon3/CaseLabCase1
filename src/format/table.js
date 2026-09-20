// Сборка строк для вывода в терминал. Модуль ничего не печатает сам — только возвращает текст.
import { messages } from './messages.js';

const UNIT_LABELS = { mm: 'мм', inch: 'дюйм' };

function formatNumber(value) {
  return typeof value === 'number' ? value.toFixed(1) : '—';
}

// «Нижний Новгород, Нижегородская Область, Россия (56.3287, 44.0020)»
export function formatCityHeader(place) {
  const title = [place.name, place.region, place.country].filter(Boolean).join(', ');
  return `${title} (${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)})`;
}

export function formatForecastTable(days, units = { temperature: '°C', precipitation: 'mm' }) {
  const header = [
    'Дата',
    `t min, ${units.temperature}`,
    `t max, ${units.temperature}`,
    `Осадки, ${UNIT_LABELS[units.precipitation] ?? units.precipitation}`,
  ];
  const rows = days.map((day) => [
    day.date,
    formatNumber(day.tempMin),
    formatNumber(day.tempMax),
    formatNumber(day.precipitation),
  ]);

  // Ширина колонки — по самой длинной ячейке; даты прижимаем влево, числа — вправо
  const widths = header.map((title, col) =>
    Math.max(title.length, ...rows.map((row) => row[col].length)),
  );
  const line = (cells) =>
    '  ' +
    cells
      .map((cell, col) => (col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col])))
      .join('   ');
  const separator = widths.map((width) => '-'.repeat(width));

  return [header, separator, ...rows].map(line).join('\n');
}

// Полный блок по городу: шапка, таблица и откуда взяты данные (сеть или кэш)
export function formatReport({ report, fromCache, file }) {
  const source = fromCache ? messages.cacheHit(file) : messages.reportSaved(file);
  return [
    formatCityHeader(report.place),
    '',
    formatForecastTable(report.days, report.units),
    '',
    source,
  ].join('\n');
}
