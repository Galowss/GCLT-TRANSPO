function formatBookingDate(dateStr, timeStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + (timeStr ? 'T' + timeStr : ''));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      + (timeStr ? ' — ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }) : '');
  } catch { return dateStr; }
}

console.log(formatBookingDate('2026-05-08', ''));
console.log(formatBookingDate('2026-05-08', null));
console.log(formatBookingDate('2026-05-08', 'null'));
console.log(formatBookingDate('05/08/2026', '12:00'));
console.log(formatBookingDate('2026-05-08', 'undefined'));
