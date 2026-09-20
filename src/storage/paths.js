// Имена файлов отчётов: reports/{город}-{ГГГГ-ММ-ДД}.json
import path from 'node:path';
import { config } from '../config.js';

// Дата по локальному времени в формате ГГГГ-ММ-ДД
export function formatDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// «Нижний Новгород» -> «нижний-новгород». Символы, запрещённые в именах файлов Windows, убираем.
export function normalizeCityName(city) {
  const name = city
    .trim()
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-');
  return name || 'city';
}

export function buildReportPath(city, date = new Date()) {
  return path.join(config.reportsDir, `${normalizeCityName(city)}-${formatDateStamp(date)}.json`);
}
