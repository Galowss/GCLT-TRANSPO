// Shared CSV helpers.
// Adds a UTF-8 BOM so the peso sign (₱) and accented characters render
// correctly when opened in Excel, and escapes every cell consistently.
//
// Exports are built to be machine-readable first: dates are ISO
// (YYYY-MM-DD) and money is a bare number with no currency symbol or
// thousands separator, so a pivot table, SUM() or pandas read_csv works
// without any cleanup. The pretty peso formatting lives in the .xls export
// and in the on-screen grid, where a human is the consumer.

export function csvCell(value) {
  const v = value === null || value === undefined ? '' : String(value);
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * Serialises a table, optionally wrapped in a self-describing preamble and
 * a totals footer so a downloaded file says what produced it.
 *
 * Layout: preamble rows, a blank line, the header row, the data, a blank
 * line, then the totals row. Both blank lines make the boundaries trivial to
 * skip (pandas: skiprows=N, or comment=None + slice) while staying legible
 * when the file is opened in a text editor.
 *
 * @param {string[]} headers
 * @param {Array<Array<*>>} rows
 * @param {{preamble?: Array<[string,string]>, totals?: Array<*>, totalsLabel?: string}} [opts]
 */
export function toCsv(headers, rows, opts = {}) {
  const { preamble = [], totals = null, totalsLabel = 'Total' } = opts;
  const blocks = [];

  if (preamble.length) {
    blocks.push(preamble.map(([k, v]) => [k, v].map(csvCell).join(',')).join('\r\n'));
  }
  blocks.push([headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n'));
  if (totals) {
    const cells = totals.length ? totals : [totalsLabel];
    blocks.push([cells].map(row => row.map(csvCell).join(',')).join('\r\n'));
  }
  return blocks.join('\r\n\r\n');
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(filename, headers, rows, opts) {
  const csv = '\uFEFF' + toCsv(headers, rows, opts);
  download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

function escapeXml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Excel export without the SheetJS dependency.
 *
 * Emits a SpreadsheetML 2003 (.xls) workbook: a single XML file that Excel,
 * LibreOffice and Google Sheets all open natively, keeping the header
 * styling, per-column alignment and the bold total row. Numbers stay
 * numeric (right-aligned, 2dp) rather than becoming text, so the sheet can
 * still be summed in Excel, and dates are emitted as real DateTime cells so
 * they sort chronologically instead of alphabetically.
 *
 * @param {string} filename
 * @param {string[]} headers
 * @param {Array<Array<{value:*, numeric?:boolean, date?:boolean, align?:string}>>} rows
 *        Cell objects drive type + alignment; plain values also work.
 * @param {{preamble?: Array<[string,string]>, totals?: Array<*>, sheetName?: string}} [opts]
 */
export function toExcelXml(headers, rows, opts = {}) {
  const { preamble = [], totals = null, sheetName = 'Report' } = opts;

  const cell = (raw) => {
    const isObj = raw && typeof raw === 'object' && !Array.isArray(raw) && 'value' in raw;
    const value = isObj ? raw.value : raw;
    const numeric = isObj ? !!raw.numeric : typeof value === 'number';
    const align = isObj && raw.align ? raw.align : null;
    const isDate = isObj && !!raw.date;
    const styleId = isDate ? 's_date' : align ? `s_${align}` : null;
    const style = styleId ? ` ss:StyleID="${styleId}"` : '';

    if (isDate) {
      // SpreadsheetML wants a full ISO timestamp; Date objects serialise
      // themselves into exactly that.
      const d = value instanceof Date ? value : new Date(value);
      if (!isNaN(d)) {
        return `<Cell${style}><Data ss:Type="DateTime">${d.toISOString()}</Data></Cell>`;
      }
      return `<Cell${style}><Data ss:Type="String"></Data></Cell>`;
    }
    if (numeric && value !== '' && value !== null && value !== undefined && !isNaN(value)) {
      const n = Number(value);
      // Number cells still honour alignment, otherwise the peso/quantity
      // columns lose their right alignment as soon as they stay numeric.
      const safe = isFinite(n) ? n : 0;
      return `<Cell${style}><Data ss:Type="Number">${safe}</Data></Cell>`;
    }
    return `<Cell${style}><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
  };

  const row = (cells, styleId) => {
    const rs = styleId ? ` ss:StyleID="${styleId}"` : '';
    return `<Row${rs}>${cells.map(cell).join('')}</Row>`;
  };

  const titleRows = preamble.map(([k, v]) =>
    `<Row><Cell ss:StyleID="s_meta"><Data ss:Type="String">${escapeXml(k)}</Data></Cell>` +
    `<Cell ss:StyleID="s_meta"><Data ss:Type="String">${escapeXml(v)}</Data></Cell></Row>`
  ).join('\n');

  const headerCells = headers.map(() => '<Cell ss:StyleID="s_head"><Data ss:Type="String">Header</Data></Cell>').join('');
  const body = rows.map(r => row(r)).join('\n');
  const totalRow = totals
    ? row(totals.map(t => (t && typeof t === 'object' && 'value' in t ? t : { value: t })), 's_total')
    : '';

  const xml =
    '<?xml version="1.0"?>\n' +
    '<?mso-application progid="Excel.Sheet"?>\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' +
    ' xmlns:o="urn:schemas-microsoft-com:office:office"' +
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"' +
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
    ' <Styles>\n' +
    '  <Style ss:ID="s_head"><Font ss:Bold="1" ss:Color="#FFFFFF"/>' +
    '<Interior ss:Color="#343A40" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>\n' +
    '  <Style ss:ID="s_meta"><Font ss:Color="#5A6B5F"/></Style>\n' +
    '  <Style ss:ID="s_total"><Font ss:Bold="1"/>' +
    '<Borders><Border ss:Position="Top" ss:LineStyle="Continuous"/></Borders></Style>\n' +
    '  <Style ss:ID="s_left"><Alignment ss:Horizontal="Left"/></Style>\n' +
    '  <Style ss:ID="s_center"><Alignment ss:Horizontal="Center"/></Style>\n' +
    '  <Style ss:ID="s_right"><Alignment ss:Horizontal="Right"/></Style>\n' +
    '  <Style ss:ID="s_date"><NumberFormat ss:Format="yyyy\\-mm\\-dd"/>' +
    '<Alignment ss:Horizontal="Left"/></Style>\n' +
    ' </Styles>\n' +
    ` <Worksheet ss:Name="${escapeXml(sheetName)}">\n  <Table>\n` +
    (titleRows ? `${titleRows}\n` : '') +
    `   <Row>${headerCells}</Row>\n${body}\n` +
    (totalRow ? `${totalRow}\n` : '') +
    '  </Table>\n </Worksheet>\n' +
    '</Workbook>\n';

  return xml;
}

export function exportExcel(filename, headers, rows, opts) {
  const xml = toExcelXml(headers, rows, opts);
  download(
    new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' }),
    filename
  );
}