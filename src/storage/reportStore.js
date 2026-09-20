// Чтение и запись отчётов на диск (fs/promises).
// Кэш устроен просто: имя файла содержит дату, поэтому отчёт за сегодня — это и есть кэш.
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildReportPath } from './paths.js';

// Возвращает { file, report } или null, если кэша нет
export async function readCachedReport(city, date = new Date()) {
  const file = buildReportPath(city, date);
  try {
    const report = JSON.parse(await fs.readFile(file, 'utf8'));
    return Array.isArray(report?.days) ? { file, report } : null;
  } catch {
    // Файла нет или он повреждён — считаем, что кэша нет, и запросим данные заново
    return null;
  }
}

// Сохраняет отчёт (каталог создаётся при необходимости), возвращает путь к файлу
export async function saveReport(city, report, date = new Date()) {
  const file = buildReportPath(city, date);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(report, null, 2));
  return file;
}
