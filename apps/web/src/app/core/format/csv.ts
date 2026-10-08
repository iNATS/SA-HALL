export type CsvCell = string | number;

/**
 * Text cells are quoted and neutralised against spreadsheet formula injection
 * (values beginning with =, +, -, @, tab or CR). Numbers are written as numbers.
 */
function encodeCell(value: CsvCell): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(encodeCell).join(',')).join('\r\n');
}

/** Triggers a client-side download; the UTF-8 BOM keeps Arabic readable in Excel. */
export function downloadCsv(filename: string, rows: readonly (readonly CsvCell[])[]): void {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
