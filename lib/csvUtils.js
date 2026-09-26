// Shared CSV helpers.
// Adds a UTF-8 BOM so the peso sign (₱) and accented characters render
// correctly when opened in Excel, and escapes every cell consistently.

export function csvCell(value) {
  const v = value === null || value === undefined ? '' : String(value);
  return `"${v.replace(/"/g, '""')}"`;
}

export function toCsv(headers, rows) {
  return [headers, ...rows]
    .map(row => row.map(csvCell).join(','))
    .join('\r\n');
}

export function exportCsv(filename, headers, rows) {
  const csv = '\uFEFF' + toCsv(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}