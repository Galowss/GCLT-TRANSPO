'use client';

import './reports.css';
import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import {
  subscribeToAllBookings,
  subscribeToTrucksForSale,
  subscribeToAppointments,
  subscribeToAllUsers,
} from '@/lib/firebaseService';
import { exportCsv, exportExcel } from '@/lib/csvUtils';
import {
  REPORT_CATALOG, REPORT_BY_ID, ALL_REPORTS, EMPTY_FILTERS,
  STATUS_TONE, fmtDate, fmtMoney, fmtQty, fmtInt, toTimestamp,
  applyRowFilters, sortRows, totalFor, searchRows, searchTerms, matchRanges,
  isoDate, buildExport,
} from './reportDefs';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BarChart2, Truck, Users, CreditCard, Eye, ShoppingCart, Ban,
  FileText, FileSpreadsheet, Download, Filter, RefreshCw, X, Sigma,
  ChevronLeft, ChevronRight, Layers, Search,
} from 'lucide-react';

const ICONS = {
  bar: BarChart2,
  truck: Truck,
  users: Users,
  card: CreditCard,
  eye: Eye,
  cart: ShoppingCart,
  ban: Ban,
  layers: Layers,
};

/* Wraps every match in <mark>.
   Range detection lives in reportDefs so it stays in step with searchRows —
   if the two disagreed, rows would filter in without highlighting. */
function highlightParts(text, terms) {
  if (!text || !terms.length) return { parts: text, matched: false };
  const ranges = matchRanges(text, terms);
  if (!ranges.length) return { parts: text, matched: false };

  const out = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) out.push(text.slice(cursor, start));
    out.push(<mark className="rv-hit" key={`${start}-${end}-${i}`}>{text.slice(start, end)}</mark>);
    cursor = end;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return { parts: out, matched: true };
}

export default function AdminReports() {
  /* Refresh bumps this key, which re-subscribes every listener. */
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [runId, setRunId] = useState(0);
  const [lastRun, setLastRun] = useState(null);

  const { data: bookings, loading: lBookings } = useRealtimeFirestore(
    cb => subscribeToAllBookings(cb), [refreshKey]
  );
  const { data: trucks, loading: lTrucks } = useRealtimeFirestore(
    cb => subscribeToTrucksForSale(cb), [refreshKey]
  );
  const { data: appointments, loading: lAppts } = useRealtimeFirestore(
    cb => subscribeToAppointments(null, cb), [refreshKey]
  );
  const { data: users, loading: lUsers } = useRealtimeFirestore(
    cb => subscribeToAllUsers(cb), [refreshKey]
  );

  const loading = lBookings || lTrucks || lAppts || lUsers;

  /* ── Viewer state ── */
  const [openTabs, setOpenTabs] = useState(['booking-revenue']);
  const [activeId, setActiveId] = useState('booking-revenue');
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [activeCol, setActiveCol] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  /* ── Row search ──
     `query` is the controlled input; `search` is the debounced value that
     actually filters, so typing stays smooth over thousands of rows. */
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [showAllTerms, setShowAllTerms] = useState(false);
  const searchRef = useRef(null);

  const report = REPORT_BY_ID[activeId] || ALL_REPORTS[0];

  /* Debounce the search box so each keystroke doesn't re-scan every cell. */
  useEffect(() => {
    if (query === search) return undefined;
    const t = setTimeout(() => setSearch(query), 180);
    return () => clearTimeout(t);
  }, [query, search]);

  /* "/" focuses search from anywhere, Escape clears it — standard for
     data tables, and saves reaching for the mouse. */
  useEffect(() => {
    const onKey = e => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowAllTerms(true);
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        e.preventDefault();
        setQuery('');
        setSearch('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Switching reports keeps the query: the same term usually means the same
     thing across reports (a ref, a route, a customer). */
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearch('');
    searchRef.current?.focus();
  }, []);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
  }, []);
  useEffect(() => {
    if (!refreshing || loading) return;
    setRefreshing(false);
    setLastRun(new Date());
  }, [refreshing, loading]);

  /* ── Date-range gate ── */
  const inRange = useCallback((value, from, to) => {
    const ts = toTimestamp(value);
    if (ts === null) return false;
    if (from && ts < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && ts > new Date(`${to}T23:59:59`).getTime()) return false;
    return true;
  }, []);

  const gate = useCallback((list, field, from, to) => {
    if (!list) return [];
    if (!from && !to) return list;
    return list.filter(item => inRange(item[field], from, to));
  }, [inRange]);

  const { from, to } = filters;
  const rangedBookings = useMemo(
    () => gate(bookings, 'date', from, to),
    [gate, bookings, from, to]
  );
  const rangedTrucks = useMemo(
    () => gate(trucks, 'createdAt', from, to),
    [gate, trucks, from, to]
  );
  const rangedAppointments = useMemo(
    () => gate(appointments, 'date', from, to),
    [gate, appointments, from, to]
  );

  /* Row filters (route / status / payment) apply to bookings-scoped
     reports, so every logistics report honours them, not just one. */
  const scopedBookings = useMemo(
    () => applyRowFilters(rangedBookings, filters),
    [rangedBookings, filters]
  );

  const scoped = useMemo(() => ({
    bookings: scopedBookings,
    trucks: rangedTrucks,
    appointments: rangedAppointments,
    users,
  }), [scopedBookings, rangedTrucks, rangedAppointments, users]);

  /* ── Build + order the active report ──
     runId forces a fresh derivation when "Run Report" is pressed. */
  const { columns, rows } = useMemo(
    () => report.build(scoped),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report, scoped, runId]
  );

  const sortedAll = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);

  /* Search applies after sorting, so results respect the active sort order and
     the pinned totals then reflect exactly what is on screen. */
  const terms = useMemo(() => searchTerms(search), [search]);
  const sorted = useMemo(
    () => (terms.length ? searchRows(sortedAll, columns, search) : sortedAll),
    [sortedAll, columns, search, terms]
  );
  const totals = useMemo(() => totalFor(sorted, columns), [sorted, columns]);
  const hiddenCount = sortedAll.length - sorted.length;

  const toggleSort = useCallback(key => {
    setSort(s => (s.key === key
      ? { key: s.dir === 'asc' ? key : null, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }));
  }, []);

  const resetView = useCallback(() => {
    setSort({ key: null, dir: 'asc' });
    setActiveCol(null);
    setSelectedRow(null);
  }, []);

  /* ── Tabs ── */
  const openReport = useCallback(id => {
    setOpenTabs(t => (t.includes(id) ? t : [...t, id]));
    setActiveId(id);
    resetView();
  }, [resetView]);

  const closeTab = useCallback((e, id) => {
    e.stopPropagation();
    setOpenTabs(t => {
      if (t.length === 1) return t;
      const next = t.filter(x => x !== id);
      if (id === activeId) {
        setActiveId(next[next.length - 1]);
        resetView();
      }
      return next;
    });
  }, [activeId, resetView]);

  const handleRun = useCallback(() => {
    setRunId(n => n + 1);
    setLastRun(new Date());
    setSort({ key: null, dir: 'asc' });
  }, []);

  /* ── Filter chips ── */
  const chips = useMemo(() => {
    const out = [];
    if (filters.from) out.push({ key: 'from', label: `From ${fmtDate(filters.from)}` });
    if (filters.to) out.push({ key: 'to', label: `To ${fmtDate(filters.to)}` });
    if (filters.route) out.push({ key: 'route', label: `Match "${filters.route}"` });
    if (filters.status !== 'all') out.push({ key: 'status', label: `Status: ${filters.status}` });
    if (filters.payment !== 'all') out.push({ key: 'payment', label: `Payment: ${filters.payment.toUpperCase()}` });
    return out;
  }, [filters]);

  /* ── Exports ──
     The shaping lives in buildExport (pure, testable); this only decides
     which serialiser to hand it to. */
  const handleExport = useCallback(excel => {
    const built = buildExport({
      rows: sorted,
      columns,
      report,
      totals,
      terms,
      filters: chips.map(c => c.label),
      generated: new Date(),
    });
    const name = `gclt-${report.id}-${isoDate(built.generated)}`;
    if (excel) {
      // The (₱) suffix only belongs on the Excel header, where the cell is a
      // real number; the CSV column now holds plain numbers.
      const headers = built.headers.map((h, i) => (
        columns[i].type === 'money' && !/₱/.test(h) ? `${h} (₱)` : h
      ));
      exportExcel(`${name}.xls`, headers, built.cells, {
        preamble: built.preamble,
        totals: built.totals,
        sheetName: report.short || 'Report',
      });
    } else {
      exportCsv(`${name}.csv`, built.headers, built.csvRows, {
        preamble: built.preamble,
        totals: built.csvTotals,
        totalsLabel: 'Total',
      });
    }
  }, [columns, sorted, report, totals, terms, chips]);

  const hasFilters = chips.length > 0;
  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const clearChip = key => setFilter(key, key === 'status' || key === 'payment' ? 'all' : '');

  const countFor = useCallback(id => {
    const r = REPORT_BY_ID[id];
    if (!r) return 0;
    if (r.scope === 'trucks') return rangedTrucks.length;
    if (r.scope === 'appointments') return rangedAppointments.length;
    return scopedBookings.length;
  }, [rangedTrucks, rangedAppointments, scopedBookings]);

  const hasData = sorted.length > 0;
  const moneyCol = columns.find(c => c.type === 'money');
  const qtyCol = columns.find(c => c.type === 'num');

  return (
    <AdminLayout>
      <div className="rv-shell">
        {/* ── Header + open-report tabs ── */}
        <div className="rv-head no-print">
          <span className="rv-head-title">
            <BarChart2 size={17} /> Report Viewer
          </span>
          <span className="rv-head-sub">GCLT Transport · Back-Office</span>
          <div className="rv-tabs" role="tablist" aria-label="Open reports">
            {openTabs.map(id => {
              const r = REPORT_BY_ID[id];
              if (!r) return null;
              const Icon = ICONS[r.icon] || FileText;
              return (
                <div
                  key={id}
                  role="tab"
                  aria-selected={id === activeId}
                  tabIndex={0}
                  className={`rv-tab${id === activeId ? ' is-active' : ''}`}
                  onClick={() => openReport(id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReport(id); }
                  }}
                >
                  <Icon size={12} />
                  {r.short}
                  {openTabs.length > 1 && (
                    <button className="rv-tab-x" aria-label={`Close ${r.name}`} onClick={e => closeTab(e, id)}>
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rv-body">
          {/* ── Report catalog ── */}
          <nav className={`rv-catalog no-print${catalogOpen ? '' : ' is-collapsed'}`} aria-label="Report catalog">
            <div className="rv-catalog-bar">
              {catalogOpen && <><FileText size={12} /><span>Reports</span></>}
              <button
                className="rv-catalog-toggle"
                onClick={() => setCatalogOpen(o => !o)}
                aria-label={catalogOpen ? 'Collapse catalog' : 'Expand catalog'}
                title={catalogOpen ? 'Collapse catalog' : 'Expand catalog'}
              >
                {catalogOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>
            </div>
            {catalogOpen && (
              <div className="rv-catalog-list">
                {REPORT_CATALOG.map(group => (
                  <div key={group.group}>
                    <div className="rv-cat-group">{group.group}</div>
                    {group.reports.map(r => {
                      const Icon = ICONS[r.icon] || FileText;
                      return (
                        <button
                          key={r.id}
                          className={`rv-cat-item${r.id === activeId ? ' is-active' : ''}`}
                          onClick={() => openReport(r.id)}
                          title={r.blurb}
                          aria-current={r.id === activeId}
                        >
                          <Icon size={13} />
                          <span>{r.name}</span>
                          <span className="rv-cat-count">{fmtInt(countFor(r.id))}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </nav>

          {/* ── Viewer ── */}
          <section className="rv-viewer">
            <div className="rv-toolbar no-print">
              <button className="rv-btn" onClick={handleRun} disabled={loading}>
                <FileText size={13} /> Run Report
              </button>
              <button className="rv-btn rv-btn-ghost" onClick={() => handleExport(true)} disabled={!hasData}>
                <FileSpreadsheet size={13} /> Export Excel
              </button>
              <button className="rv-btn rv-btn-ghost" onClick={() => handleExport(false)} disabled={!hasData}>
                <Download size={13} /> Export CSV
              </button>

              <div className="rv-toolbar-right">
                <div className={`rv-search${query ? ' is-set' : ''}`}>
                  <Search size={13} className="rv-search-icon" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    id="rv-search"
                    type="search"
                    className="rv-search-input"
                    placeholder={showAllTerms ? 'Search rows…' : 'Search rows ( / )'}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setShowAllTerms(true)}
                    aria-label={`Search ${report.short || report.name} rows`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {query && (
                    <button
                      className="rv-search-clear"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      title="Clear (Esc)"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <span className="rv-meta">
                  {terms.length
                    ? <><strong>{fmtInt(sorted.length)}</strong> of {fmtInt(sortedAll.length)} rows</>
                    : <><strong>{fmtInt(sorted.length)}</strong> rows</>}
                  {' · '}
                  <strong>{columns.length}</strong> columns
                </span>
                <button
                  className={`rv-btn rv-btn-ghost${filtersOpen ? ' is-on' : ''}`}
                  onClick={() => setFiltersOpen(o => !o)}
                  aria-expanded={filtersOpen}
                >
                  <Filter size={13} /> Filters{hasFilters ? ` (${chips.length})` : ''}
                </button>
                <button className="rv-btn rv-btn-ghost" onClick={doRefresh} disabled={refreshing}>
                  {refreshing ? <span className="rv-spin" /> : <RefreshCw size={13} />} Refresh
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="rv-filters no-print">
                <div className="rv-filters-grid">
                  <div className="rv-field">
                    <label htmlFor="rv-from">Date from</label>
                    <input id="rv-from" type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} />
                  </div>
                  <div className="rv-field">
                    <label htmlFor="rv-to">Date to</label>
                    <input id="rv-to" type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)} />
                  </div>
                  {report.scope === 'bookings' && (
                    <>
                      <div className="rv-field">
                        <label htmlFor="rv-route">Route / customer</label>
                        <input
                          id="rv-route"
                          type="text"
                          placeholder="e.g. Olongapo"
                          value={filters.route}
                          onChange={e => setFilter('route', e.target.value)}
                        />
                      </div>
                      <div className="rv-field">
                        <label htmlFor="rv-status">Status</label>
                        <select id="rv-status" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                          <option value="all">All statuses</option>
                          <option value="active">Active pipeline</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled / declined</option>
                        </select>
                      </div>
                      <div className="rv-field">
                        <label htmlFor="rv-payment">Payment</label>
                        <select id="rv-payment" value={filters.payment} onChange={e => setFilter('payment', e.target.value)}>
                          <option value="all">All methods</option>
                          <option value="cod">Cash on delivery</option>
                          <option value="stripe">Stripe</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className="rv-field">
                    <label>&nbsp;</label>
                    <div className="rv-filter-actions">
                      <button className="rv-btn rv-btn-ghost" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters}>
                        <X size={13} /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(hasFilters || terms.length > 0) && (
              <div className="rv-active-filters no-print">
                <Filter size={11} />
                <span>Active filters</span>
                {chips.map(c => (
                  <span className="rv-chip" key={c.key}>
                    {c.label}
                    <button onClick={() => clearChip(c.key)} aria-label={`Remove ${c.label}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {terms.length > 0 && (
                  <span className="rv-chip">
                    Search &ldquo;{query}&rdquo;
                    <button onClick={clearSearch} aria-label={`Remove search ${query}`}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                <button
                  className="rv-btn rv-btn-ghost"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => { setFilters(EMPTY_FILTERS); setQuery(''); setSearch(''); }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── Enterprise grid ── */}
            <div className="rv-grid-wrap">
              {loading ? (
                <div className="rv-empty"><span className="rv-spin" /> Loading report data…</div>
              ) : !hasData ? (
                <div className="rv-empty">
                  {terms.length
                    ? <>
                      <strong>No rows match &ldquo;{query}&rdquo;</strong>
                      {fmtInt(hiddenCount)} of {fmtInt(sortedAll.length)} rows hidden.{' '}
                      <button className="rv-link" onClick={clearSearch}>Clear search</button>
                    </>
                    : <>
                      <strong>No records to display</strong>
                      {hasFilters
                        ? 'No rows match the current filters. Try widening the date range or clearing filters.'
                        : 'Once records are created they will appear here in real time.'}
                    </>}
                </div>
              ) : (
                <table className="rv-grid">
                  <thead>
                    <tr>
                      {columns.map(c => {
                        const isSorted = sort.key === c.key;
                        return (
                          <th
                            key={c.key}
                            style={c.width ? { minWidth: c.width } : undefined}
                            className={[
                              c.align === 'center' ? 'rv-a-center' : (c.type === 'num' || c.type === 'money') ? 'rv-a-right' : '',
                              activeCol === c.key ? 'is-active-col' : '',
                              isSorted ? 'is-sorted' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => setActiveCol(k => (k === c.key ? null : c.key))}
                            title={`${c.label} — click to ${activeCol === c.key ? 'clear highlight' : 'highlight column'}`}
                            aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          >
                            <span className="rv-th-inner">
                              {c.sum && <Sigma size={11} className="rv-th-sigma" />}
                              <span>{c.label}</span>
                              <button
                                className="rv-sort"
                                onClick={e => { e.stopPropagation(); toggleSort(c.key); }}
                                aria-label={`Sort by ${c.label}`}
                                title="Sort"
                              >
                                <span>▲</span><span>▼</span>
                              </button>
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(r => (
                      <tr
                        key={r.id}
                        className={selectedRow === r.id ? 'is-selected' : undefined}
                        onClick={() => setSelectedRow(k => (k === r.id ? null : r.id))}
                      >
                        {columns.map(c => {
                          const raw = c.get(r);
                          const isMoney = c.type === 'money';
                          const isNum = c.type === 'num';
                          const isDate = c.type === 'date';
                          const text = isMoney ? fmtMoney(raw)
                            : isNum ? fmtQty(raw)
                            : isDate ? fmtDate(raw)
                            : String(raw ?? '');
                          const alignCls = c.align === 'center' ? 'rv-a-center'
                            : (isMoney || isNum) ? 'rv-a-right' : 'rv-a-left';
                          const isBadge = c.key === 'status' || c.key === 'payment' || c.key === 'method';
                          /* Badges render as a styled pill, so wrapping their
                             text in <mark> would break the pill. Everything
                             else reports matched=true only when a range was
                             actually found, not merely because a search is
                             active, so the class stays honest. */
                          const { parts, matched } = isBadge
                            ? { parts: null, matched: false }
                            : highlightParts(text, terms);
                          return (
                            <td
                              key={c.key}
                              className={[
                                alignCls,
                                c.mono ? 'rv-mono' : '',
                                (isMoney || isNum) ? 'rv-num' : '',
                                activeCol === c.key ? 'is-active-col' : '',
                                !text ? 'rv-muted' : '',
                                matched ? 'is-hit' : '',
                              ].filter(Boolean).join(' ')}
                            >
                              {isBadge && text
                                ? <span className={`rv-badge rv-badge-${STATUS_TONE[text] || 'mute'}`}>{text}</span>
                                : parts ?? (text || '\u2014')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      {columns.map((c, i) => {
                        const alignCls = c.align === 'center' ? 'rv-a-center'
                          : (c.type === 'num' || c.type === 'money') ? 'rv-a-right' : 'rv-a-left';
                        return (
                          <td key={c.key} className={[alignCls, activeCol === c.key ? 'is-active-col' : ''].filter(Boolean).join(' ')}>
                            {c.sum
                              ? (c.type === 'money' ? fmtMoney(totals[c.key]) : fmtInt(totals[c.key]))
                              : (i === 0 ? <><Sigma size={11} /> Total</> : '')}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className={`rv-statusbar no-print ${loading ? 'rv-loading' : 'rv-live'}`}>
              <span><span className="rv-dot" />{loading ? 'Syncing' : 'Live'}</span>
              <span>Rows <b>{fmtInt(sorted.length)}</b></span>
              {hiddenCount > 0 && <span>Hidden <b>{fmtInt(hiddenCount)}</b></span>}
              {qtyCol && <span>{qtyCol.label} <b>{fmtInt(totals[qtyCol.key] || 0)}</b></span>}
              {moneyCol && <span>Value <b>{fmtMoney(totals[moneyCol.key] || 0)}</b></span>}
              {activeCol && <span>Highlight <b>{columns.find(c => c.key === activeCol)?.label}</b></span>}
              <span style={{ marginLeft: 'auto' }}>
                {lastRun ? `Last run ${lastRun.toLocaleTimeString()}` : 'Not run yet'}
              </span>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
