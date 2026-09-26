/* ═══════════════════════════════════════════════════════════
   Admin Reports — report catalog + derivations
   Pure module: no React, no Firestore. Every report takes the
   already-fetched Firestore slices and returns { columns, rows }.
   ═══════════════════════════════════════════════════════════ */

const PESO = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Back-office date: Jun 10, 2026 */
export function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** ISO calendar date (YYYY-MM-DD) for exports, so spreadsheets and SQL
    imports sort and compare it as a real date instead of guessing at
    "30-Sep-26" vs "Sep 30, 2026". Empty when there is no usable date. */
export function isoDate(value) {
  const ts = toTimestamp(value);
  if (ts === null) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Unformatted number for exports: no currency symbol, no thousands
    separators, so the cell aggregates as a number instead of text.
    Money keeps 2dp; quantities stay integral. Absent values stay empty
    rather than becoming a misleading 0. */
export function plainNumber(value, kind) {
  const n = Number(value);
  if (!value || isNaN(n)) return '';
  if (kind === 'money') return n.toFixed(2);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)));
}

export function fmtMoney(value) {
  const n = Number(value);
  if (!value || isNaN(n)) return '';
  return '₱' + PESO.format(n);
}

export function fmtQty(value) {
  const n = Number(value);
  if (!value || isNaN(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function fmtInt(value) {
  const n = Number(value);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/** Normalises Firestore Timestamp | Date | {seconds} | ISO string | epoch to ms. */
export function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof value === 'object' && value !== null) {
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value.toDate === 'function') return value.toDate().getTime();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d)) return d.getTime();
  }
  return null;
}

export const STATUS_GROUPS = {
  active: ['Quote Requested', 'Quoted', 'Confirmed', 'Pending Payment', 'In Transit'],
  cancelled: ['Cancelled', 'Declined'],
};

export const STATUS_TONE = {
  Completed: 'ok',
  Confirmed: 'ok',
  'In Transit': 'ok',
  Sold: 'ok',
  Cancelled: 'bad',
  Declined: 'bad',
  'Quote Requested': 'info',
  Quoted: 'info',
  'Pending Payment': 'warn',
  Pending: 'warn',
  'Pending Approval': 'warn',
};

/* Column presets. `sum: true` renders the Σ glyph and feeds the pinned
   total row. `width` is a min-width so the grid scrolls horizontally
   instead of crushing columns. */
const col = {
  text: (key, label, get, opts = {}) => ({ key, label, type: 'text', get, ...opts }),
  center: (key, label, get, opts = {}) => ({ key, label, type: 'center', get, ...opts }),
  num: (key, label, get, opts = {}) => ({ key, label, type: 'num', get, sum: true, ...opts }),
  money: (key, label, get, opts = {}) => ({ key, label, type: 'money', get, sum: true, ...opts }),
  date: (key, label, get, opts = {}) => ({ key, label, type: 'date', get, ...opts }),
};

export const REPORT_CATALOG = [
  {
    group: 'Logistics & Bookings',
    reports: [
      {
        id: 'booking-revenue',
        name: 'Booking Revenue & Volume',
        short: 'Booking Revenue',
        icon: 'bar',
        scope: 'bookings',
        blurb: 'Every booking with quoted amount, quantity and settlement status.',
        build: ({ bookings }) => ({
          columns: [
            col.text('ref', 'Ref #', r => r.ref, { width: 120, mono: true }),
            col.date('date', 'Date', r => r.date, { width: 118 }),
            col.text('customer', 'Customer', r => r.customer, { width: 170 }),
            col.text('route', 'Route', r => r.route, { width: 220 }),
            col.text('vehicle', 'Vehicle Type', r => r.vehicle, { width: 140 }),
            col.num('qty', 'Trucks', r => r.qty, { width: 78 }),
            col.money('amount', 'Quoted Amount', r => r.amount, { width: 138 }),
            col.text('payment', 'Payment', r => r.payment, { width: 104, align: 'center' }),
            col.text('status', 'Status', r => r.status, { width: 132, align: 'center' }),
          ],
          rows: bookings.map(b => ({
            id: b.id,
            ref: b.refNumber || 'Legacy',
            date: b.date,
            ts: toTimestamp(b.date),
            customer: b.userName || 'Guest',
            route: [b.pickup, b.delivery].filter(Boolean).join(' → ') || '—',
            vehicle: b.truckRoute || '—',
            qty: Number(b.truckQuantity) || 1,
            amount: Number(b.quotedAmount) || 0,
            payment: b.paymentMethod === 'stripe' ? 'Stripe' : b.paymentMethod ? 'COD' : 'Pending',
            status: b.status || 'Unknown',
          })),
        }),
      },
      {
        id: 'route-breakdown',
        name: 'Route & City Breakdown',
        short: 'Route Breakdown',
        icon: 'layers',
        scope: 'bookings',
        blurb: 'Bookings, trucks and revenue grouped by pickup → delivery lane.',
        build: ({ bookings }) => {
          const map = new Map();
          bookings.forEach(b => {
            const key = [b.pickup, b.delivery].filter(Boolean).join(' → ') || 'Unassigned';
            if (!map.has(key)) {
              map.set(key, {
                id: key, route: key,
                pickup: b.pickup || '—', delivery: b.delivery || '—',
                bookings: 0, trucks: 0, amount: 0, latest: null,
              });
            }
            const r = map.get(key);
            r.bookings += 1;
            r.trucks += Number(b.truckQuantity) || 1;
            r.amount += Number(b.quotedAmount) || 0;
            const ts = toTimestamp(b.date);
            if (ts && (!r.latest || ts > r.latest)) r.latest = ts;
          });
          return {
            columns: [
              col.text('route', 'Route', r => r.route, { width: 260 }),
              col.text('pickup', 'Pickup City', r => r.pickup, { width: 150 }),
              col.text('delivery', 'Delivery City', r => r.delivery, { width: 150 }),
              col.num('bookings', 'Bookings', r => r.bookings, { width: 92 }),
              col.num('trucks', 'Trucks', r => r.trucks, { width: 88 }),
              col.money('amount', 'Quoted Amount', r => r.amount, { width: 138 }),
              col.date('latest', 'Latest Booking', r => (r.latest ? new Date(r.latest).toISOString() : ''), { width: 130 }),
            ],
            rows: [...map.values()],
          };
        },
      },
      {
        id: 'vehicle-utilization',
        name: 'Vehicle Type Utilization',
        short: 'Vehicle Utilization',
        icon: 'truck',
        scope: 'bookings',
        blurb: 'Demand mix per truck class, with share of total volume.',
        build: ({ bookings }) => {
          const map = new Map();
          const total = bookings.reduce((s, b) => s + (Number(b.truckQuantity) || 1), 0);
          bookings.forEach(b => {
            const key = b.truckRoute || 'Unspecified';
            if (!map.has(key)) map.set(key, { id: key, vehicle: key, bookings: 0, trucks: 0, amount: 0 });
            const r = map.get(key);
            r.bookings += 1;
            r.trucks += Number(b.truckQuantity) || 1;
            r.amount += Number(b.quotedAmount) || 0;
          });
          return {
            columns: [
              col.text('vehicle', 'Vehicle Type', r => r.vehicle, { width: 200 }),
              col.num('bookings', 'Bookings', r => r.bookings, { width: 96 }),
              col.num('trucks', 'Trucks', r => r.trucks, { width: 88 }),
              col.center('avg', 'Avg / Booking', r => (r.bookings ? r.trucks / r.bookings : 0).toFixed(2), { width: 110 }),
              col.money('amount', 'Quoted Amount', r => r.amount, { width: 138 }),
              col.center('share', 'Volume Share', r => (total ? ((r.trucks / total) * 100).toFixed(1) + '%' : '0.0%'), { width: 116 }),
            ],
            rows: [...map.values()],
          };
        },
      },
      {
        id: 'cancel-audit',
        name: 'Cancellation & Decline Audit',
        short: 'Cancel Audit',
        icon: 'ban',
        scope: 'bookings',
        blurb: 'Lost and cancelled bookings, with the quoted value on the line.',
        build: ({ bookings }) => {
          const lost = bookings.filter(b => STATUS_GROUPS.cancelled.includes(b.status));
          return {
            columns: [
              col.text('ref', 'Ref #', r => r.ref, { width: 120, mono: true }),
              col.date('date', 'Date', r => r.date, { width: 118 }),
              col.text('customer', 'Customer', r => r.customer, { width: 170 }),
              col.text('route', 'Route', r => r.route, { width: 220 }),
              col.center('status', 'Outcome', r => r.status, { width: 118 }),
              col.text('reason', 'Notes / Reason', r => r.reason, { width: 260 }),
              col.money('amount', 'Lost Amount', r => r.amount, { width: 132 }),
            ],
            rows: lost.map(b => ({
              id: b.id,
              ref: b.refNumber || 'Legacy',
              date: b.date,
              ts: toTimestamp(b.date),
              customer: b.userName || 'Guest',
              route: [b.pickup, b.delivery].filter(Boolean).join(' → ') || '—',
              status: b.status,
              reason: b.notes || b.declineReason || '—',
              amount: Number(b.quotedAmount) || 0,
            })),
          };
        },
      },
      {
        id: 'payment-breakdown',
        name: 'Payment Method Breakdown',
        short: 'Payment Split',
        icon: 'card',
        scope: 'bookings',
        blurb: 'COD vs Stripe settlement mix by count and value.',
        build: ({ bookings }) => {
          const map = new Map();
          bookings.forEach(b => {
            const key = b.paymentMethod === 'stripe' ? 'Stripe' : b.paymentMethod ? 'Cash on Delivery' : 'Unassigned';
            if (!map.has(key)) map.set(key, { id: key, method: key, bookings: 0, trucks: 0, amount: 0 });
            const r = map.get(key);
            r.bookings += 1;
            r.trucks += Number(b.truckQuantity) || 1;
            r.amount += Number(b.quotedAmount) || 0;
          });
          const totalBookings = bookings.length || 1;
          return {
            columns: [
              col.text('method', 'Payment Method', r => r.method, { width: 200 }),
              col.num('bookings', 'Bookings', r => r.bookings, { width: 96 }),
              col.num('trucks', 'Trucks', r => r.trucks, { width: 88 }),
              col.money('amount', 'Quoted Amount', r => r.amount, { width: 138 }),
              col.center('share', 'Booking Share', r => ((r.bookings / totalBookings) * 100).toFixed(1) + '%', { width: 122 }),
            ],
            rows: [...map.values()],
          };
        },
      },
    ],
  },
  {
    group: 'Truck Marketplace',
    reports: [
      {
        id: 'truck-sales',
        name: 'Truck Sales & Inquiries',
        short: 'Truck Sales',
        icon: 'cart',
        scope: 'trucks',
        blurb: 'Marketplace listings with sale value and viewing-appraisal demand.',
        build: ({ trucks, appointments }) => {
          const demand = new Map();
          (appointments || []).forEach(a => {
            const key = (a.truck || '').trim().toLowerCase();
            if (key) demand.set(key, (demand.get(key) || 0) + 1);
          });
          return {
            columns: [
              col.text('truck', 'Truck', r => r.truck, { width: 220 }),
              col.text('type', 'Type', r => r.type, { width: 130 }),
              col.center('year', 'Year', r => r.year, { width: 78 }),
              col.money('price', 'Listed Price', r => r.price, { width: 138 }),
              col.text('status', 'Status', r => r.status, { width: 116, align: 'center' }),
              col.text('location', 'Location', r => r.location, { width: 160 }),
              col.num('inquiries', 'Inquiries', r => r.inquiries, { width: 100 }),
              col.date('listed', 'Listed On', r => r.listed, { width: 122 }),
            ],
            rows: (trucks || []).map(t => ({
              id: t.id,
              truck: t.name || 'Untitled listing',
              type: t.type || '—',
              year: t.year || '—',
              price: Number(t.price) || 0,
              status: t.status || 'Available',
              location: t.location || '—',
              inquiries: demand.get((t.name || '').trim().toLowerCase()) || 0,
              listed: t.createdAt ? new Date(toTimestamp(t.createdAt) || t.createdAt).toISOString() : '',
            })),
          };
        },
      },
      {
        id: 'viewing-log',
        name: 'Viewing Appointments Log',
        short: 'Viewing Log',
        icon: 'eye',
        scope: 'appointments',
        blurb: 'Every scheduled fleet viewing and its confirmation state.',
        build: ({ appointments }) => ({
          columns: [
            col.text('customer', 'Customer', r => r.customer, { width: 180 }),
            col.text('truck', 'Truck', r => r.truck, { width: 210 }),
            col.text('location', 'Location', r => r.location, { width: 170 }),
            col.date('date', 'Date', r => r.date, { width: 122 }),
            col.center('time', 'Time', r => r.time, { width: 96 }),
            col.text('status', 'Status', r => r.status, { width: 116, align: 'center' }),
            col.date('created', 'Requested', r => r.created, { width: 122 }),
          ],
          rows: (appointments || []).map(a => {
            const ts = toTimestamp(a.createdAt);
            return {
              id: a.id,
              customer: a.customerName || a.customer || 'Guest',
              truck: a.truck || '—',
              location: a.location || '—',
              date: a.date,
              ts: toTimestamp(a.date),
              time: a.time || '—',
              status: a.status || 'Pending',
              created: ts ? new Date(ts).toISOString() : '',
            };
          }),
        }),
      },
    ],
  },
  {
    group: 'Customer Accounts',
    reports: [
      {
        id: 'customer-activity',
        name: 'Customer Booking Activity',
        short: 'Customer Activity',
        icon: 'users',
        scope: 'bookings',
        blurb: 'Per-customer volume, lifetime quoted value and recency.',
        build: ({ bookings, users }) => {
          const emails = new Map();
          (users || []).forEach(u => { if (u.id) emails.set(u.id, u.email || ''); });
          const map = new Map();
          bookings.forEach(b => {
            const name = b.userName || 'Guest';
            const key = b.userId || `name:${name}`;
            if (!map.has(key)) {
              map.set(key, {
                id: key, customer: name,
                email: emails.get(b.userId) || '—',
                bookings: 0, trucks: 0, amount: 0, latest: null,
              });
            }
            const r = map.get(key);
            r.bookings += 1;
            r.trucks += Number(b.truckQuantity) || 1;
            r.amount += Number(b.quotedAmount) || 0;
            const ts = toTimestamp(b.date);
            if (ts && (!r.latest || ts > r.latest)) r.latest = ts;
          });
          return {
            columns: [
              col.text('customer', 'Customer', r => r.customer, { width: 180 }),
              col.text('email', 'Account Email', r => r.email, { width: 210 }),
              col.num('bookings', 'Bookings', r => r.bookings, { width: 96 }),
              col.num('trucks', 'Trucks', r => r.trucks, { width: 88 }),
              col.money('amount', 'Quoted Value', r => r.amount, { width: 138 }),
              col.date('latest', 'Last Booking', r => (r.latest ? new Date(r.latest).toISOString() : ''), { width: 130 }),
            ],
            rows: [...map.values()],
          };
        },
      },
    ],
  },
];

export const ALL_REPORTS = REPORT_CATALOG.flatMap(g => g.reports);
export const REPORT_BY_ID = Object.fromEntries(ALL_REPORTS.map(r => [r.id, r]));
export const EMPTY_FILTERS = { from: '', to: '', route: '', status: 'all', payment: 'all' };

/** Row-level filter shared by every bookings-scoped report. */
export function applyRowFilters(bookings, filters) {
  const q = (filters.route || '').trim().toLowerCase();
  const { status, payment } = filters;
  if (!q && status === 'all' && payment === 'all') return bookings;
  return bookings.filter(b => {
    if (q) {
      const hay = [b.pickup, b.delivery, b.truckRoute, b.userName].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (status === 'active' && !STATUS_GROUPS.active.includes(b.status)) return false;
    if (status === 'completed' && b.status !== 'Completed') return false;
    if (status === 'cancelled' && !STATUS_GROUPS.cancelled.includes(b.status)) return false;
    if (payment === 'stripe' && b.paymentMethod !== 'stripe') return false;
    // Match COD explicitly: a booking with no paymentMethod yet is reported
    // as "Unassigned" by the payment breakdown, so it must not count as COD.
    if (payment === 'cod' && b.paymentMethod !== 'cod') return false;
    return true;
  });
}

/** Sorts + totals live in one place so exports and the grid agree.
    Reads values through the column getter, not the raw row field: computed
    columns ("Avg / Booking", "Volume Share") only exist inside `get`, so
    reading row[c.key] would yield undefined and silently no-op the sort. */
export function sortRows(rows, columns, sort) {
  if (!sort || !sort.key) return rows;
  const c = columns.find(x => x.key === sort.key);
  if (!c) return rows;
  const dir = sort.dir === 'asc' ? 1 : -1;
  const val = row => (typeof c.get === 'function' ? c.get(row) : row[c.key]);
  return [...rows].sort((a, b) => {
    let av = val(a), bv = val(b);
    if (c.type === 'num' || c.type === 'money') {
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
    }
    if (c.type === 'date') {
      return ((a.ts ?? toTimestamp(av) ?? 0) - (b.ts ?? toTimestamp(bv) ?? 0)) * dir;
    }
    // numeric collation so "9.00" sorts before "10.00"
    return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * dir;
  });
}

export function totalFor(rows, columns) {
  const map = {};
  columns.forEach(c => {
    if (!c.sum) return;
    const val = row => (typeof c.get === 'function' ? c.get(row) : row[c.key]);
    map[c.key] = rows.reduce((s, r) => s + (Number(val(r)) || 0), 0);
  });
  return map;
}

/* ── Exports ──
   Shaping an export lives here rather than in the page so both formats are
   built from one description of each cell. That is what stops the CSV and
   the workbook from drifting apart: they differ only in serialisation, not
   in what a value means.

   Values are machine-readable: dates are ISO (2026-09-30) and money is a
   bare number, so SUM(), pivot tables, Google Sheets and pandas all work on
   the file without stripping currency symbols first. The pretty peso
   formatting belongs to the grid, where a human is reading it. */
export function buildExport({
  rows, columns, report, totals = {}, terms = [], filters = [], generated = new Date(),
}) {
  /* One cell, described once, carrying both representations:
       value -> typed, for Excel (Number, Date)
       plain -> string, for the CSV
     Describing a cell once is what stops the two files from disagreeing.
     `blank` marks "no value here" so the CSV leaves the cell empty instead of
     writing a misleading 0; Excel keeps a real 0 so its SUM() stays correct. */
  const describe = (raw, c) => {
    const numeric = c.type === 'num' || c.type === 'money';
    const align = c.align === 'center' ? 'center' : numeric ? 'right' : 'left';
    if (c.type === 'date') {
      const iso = isoDate(raw);
      return { value: iso ? new Date(iso) : '', plain: iso, iso, date: true, numeric: false, align, blank: iso === '' };
    }
    if (numeric) {
      const plain = plainNumber(raw, c.type);
      return { value: Number(raw) || 0, plain, numeric: true, align, blank: plain === '' };
    }
    const plain = String(raw ?? '');
    return { value: plain, plain, numeric: false, align, blank: plain === '' };
  };

  const cells = rows.map(r => columns.map(c => describe(c.get(r), c)));

  /* Without a preamble a downloaded file cannot be traced back to the report,
     the moment, or the filters and search that produced it. */
  const preamble = [
    ['Report', report ? (report.name || report.short || report.id) : 'Report'],
    ['Generated', generated.toISOString()],
    ['Filters', filters.length ? filters.join(' | ') : 'None'],
    ['Search', terms.length ? terms.join(' ') : 'None'],
    ['Rows', String(rows.length)],
    ['Columns', String(columns.length)],
  ];

  /* Totals mirror the pinned Σ row so the file agrees with the screen. */
  const label = (value, align = 'left') => ({ value, plain: value, numeric: false, align, blank: value === '' });
  const totalCells = columns.map((c, i) => {
    if (c.sum) return describe(totals[c.key], c);
    return label(i === 0 ? 'Total' : '');
  });

  const headers = columns.map(c => (c.sum ? `${c.label} ∑` : c.label));
  const toPlain = cell => (cell.blank ? '' : cell.plain);

  return {
    generated,
    headers,
    cells,
    preamble,
    totals: totalCells,
    csvRows: cells.map(row => row.map(toPlain)),
    csvTotals: totalCells.map(toPlain),
  };
}

/* ── Row search ──
   Searches the *displayed* value of every visible column, so searching
   "olongapo" or "47,500" both work: raw field values would miss formatted
   pesos, and money columns are the main thing people look up.

   Terms are space separated and combined with AND, which is what makes
   narrowing work the way people expect ("olongapo completed" = both).
   Quoted phrases keep their spaces: "quote requested". Tokens that differ
   only by case/accents are folded so "Olongapo" finds "olongapo city". */
function fold(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .toLowerCase();
}

/* People look up money by typing plain digits, but the grid shows grouped
   and prefixed values: "47500" must find "₱47,500.50". Stripping separators
   lets that work. Only applied when a term actually carries formatting, so
   ordinary words don't get a looser match than intended. */
function looseFold(folded) {
  return folded.replace(/[,\s\u20b1]/g, '');
}
/* A term needs the loose comparison when it is numeric ("47500") or already
   carries formatting ("47,500", "₱47,500.50") — i.e. when the user is
   transcribing a displayed value. Plain words keep an exact match so
   "ana" never starts matching "manila" by some looser rule. */
function needsLoose(term) {
  return /^[0-9.,\s\u20b1]+$/.test(term) && /\d/.test(term);
}

export function searchTerms(query) {
  const out = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m;
  while ((m = re.exec(String(query ?? ''))) !== null) {
    const raw = (m[1] ?? m[2] ?? '').trim();
    if (raw) out.push(fold(raw));
  }
  return out;
}

/** Display string for a cell, matching what the grid renders. */
export function cellText(c, row) {
  const raw = c.get ? c.get(row) : row[c.key];
  if (raw == null) return '';
  if (c.type === 'money') return fmtMoney(raw);
  if (c.type === 'num') return fmtQty(raw);
  if (c.type === 'date') return fmtDate(raw);
  return String(raw);
}

export function searchRows(rows, columns, query) {
  const terms = searchTerms(query);
  if (!terms.length) return rows;
  const useLoose = terms.some(needsLoose);
  return rows.filter(row => {
    const haystack = fold(columns.map(c => cellText(c, row)).join('  '));
    const loose = useLoose ? looseFold(haystack) : null;
    return terms.every(t => {
      if (haystack.includes(t)) return true;
      if (loose === null) return false;
      const lt = needsLoose(t) ? looseFold(t) : t;
      return lt.length > 0 && loose.includes(lt);
    });
  });
}

/* Range finding for highlighting.

   This deliberately shares fold/looseFold/needsLoose with searchRows, because
   a match the filter finds but the highlighter misses (or vice versa) is far
   worse than no highlight at all — it reads as a broken search.

   Offsets must be tracked explicitly: NFD normalization expands "ë" into two
   code units and accent stripping then deletes one, so folded positions are
   NOT 1:1 with the original string. Every folded character therefore carries
   the span of the original character that produced it. */
function foldMap(value) {
  const str = String(value);
  let folded = '';
  const start = [];
  const end = [];
  let orig = 0;
  for (const ch of str) {                    // code points: keeps surrogate pairs intact
    const expanded = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let i = 0; i < expanded.length; i += 1) {
      folded += expanded[i];
      start.push(orig);
    }
    // Span of this original character; empty when it folded away entirely.
    if (expanded.length) end[start.length - 1] = orig + ch.length;
    orig += ch.length;
  }
  return { folded, start, end };
}

function looseMap(folded, start, end) {
  let loose = '';
  const toStart = [];
  const toEnd = [];
  const skipBack = [];
  let prevKept = -1;
  for (let i = 0; i < folded.length; i += 1) {
    if (/[,\s\u20b1]/.test(folded[i])) continue;
    loose += folded[i];
    toStart.push(start[i]);
    toEnd.push(end[i]);
    // Separators dropped immediately before this character. Tracking them lets
    // a digit-only hit still highlight the "₱" and "," the user typed around
    // it, so "₱47500" marks "₱47,500" rather than just "47,500".
    skipBack.push(prevKept === -1 ? i : i - prevKept - 1);
    prevKept = i;
  }
  return { loose, toStart, toEnd, skipBack };
}

/** Merged, sorted [start, end) ranges of `text` matching any term,
    expressed as offsets into the ORIGINAL string. */
export function matchRanges(text, terms) {
  if (!text || !terms.length) return [];
  const { folded, start, end } = foldMap(text);
  const { loose, toStart, toEnd, skipBack } = looseMap(folded, start, end);

  const ranges = [];
  const push = (from, to) => {
    if (from < 0 || to <= from) return;
    ranges.push([from, to]);
  };

  terms.forEach(rawTerm => {
    // Terms normally arrive pre-folded from searchTerms, but folding again is
    // idempotent and makes this safe to call with a raw query.
    const term = fold(rawTerm);
    if (!term) return;
    let from = 0;
    while (from <= folded.length) {
      const i = folded.indexOf(term, from);
      if (i === -1) break;
      push(start[i], end[i + term.length - 1]);
      from = i + term.length;
    }
    if (needsLoose(term)) {
      const lt = looseFold(term);
      if (!lt) return;
      let lf = 0;
      while (lf <= loose.length) {
        const j = loose.indexOf(lt, lf);
        if (j === -1) break;
        const last = j + lt.length - 1;
        push(Math.max(0, toStart[j] - skipBack[j]), toEnd[last]);
        lf = j + lt.length;
      }
    }
  });

  if (!ranges.length) return [];
  // Merge overlaps so adjacent/overlapping terms render as one mark.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i += 1) {
    const last = merged[merged.length - 1];
    if (ranges[i][0] <= last[1]) last[1] = Math.max(last[1], ranges[i][1]);
    else merged.push(ranges[i]);
  }
  return merged;
}
