'use client';

import { useEffect, useRef } from 'react';

// flowbite-datepicker (~35 kB) is intentionally NOT statically imported:
// it is fetched lazily only when a picker actually mounts, so filter-heavy
// pages (bookings, purchases, appointments, reports) don't carry the lib
// in their initial route chunk.

function toDateOption(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (typeof v === 'string' && v) return new Date(v);
  return null;
}

/**
 * React wrapper around the Flowbite (vanilla js) datepicker.
 * Controlled via value/onChange, min/max limit the selectable range.
 * The underlying <input> is uncontrolled so the picker and React stay in sync.
 */
export default function DatePickerInput({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  format = 'yyyy-mm-dd',
  className = 'form-input',
  placeholder = 'Select date',
  title,
  style,
  required,
}) {
  const inputRef = useRef(null);
  const dpRef = useRef(null);
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!inputRef.current || dpRef.current) return undefined;

    let disposed = false;
    let dp = null;
    const onPick = (e) => {
      if (onChange) onChange(e.target.value);
    };

    import('flowbite-datepicker').then((mod) => {
      if (disposed || !inputRef.current) return;
      const { Datepicker } = mod;
      dp = new Datepicker(inputRef.current, {
        format,
        autohide: true,
        todayBtn: true,
        todayHighlight: true,
        clearBtn: true,
        ...(toDateOption(minDate) ? { minDate: toDateOption(minDate) } : {}),
        ...(toDateOption(maxDate) ? { maxDate: toDateOption(maxDate) } : {}),
      });
      dpRef.current = dp;
      inputRef.current.addEventListener('changeDate', onPick);
      inputRef.current.addEventListener('change', onPick);
      listenersRef.current = [onPick, onPick];
    }).catch((err) => {
      console.error('[DatePickerInput] Failed to load datepicker lib:', err.message);
    });

    return () => {
      disposed = true;
      const [a, b] = listenersRef.current;
      if (a) inputRef.current?.removeEventListener('changeDate', a);
      if (b) inputRef.current?.removeEventListener('change', b);
      listenersRef.current = [];
      if (dp) {
        try {
          dp.destroy();
        } catch (err) {
          /* ignore */
        }
        dp = null;
        dpRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  // Keep the picker's min/max in sync as the counterpart input changes.
  useEffect(() => {
    if (!dpRef.current) return;
    dpRef.current.setOptions({
      minDate: toDateOption(minDate),
      maxDate: toDateOption(maxDate),
    });
  }, [minDate, maxDate]);

  // Reflect external value changes (clear filters, reset, etc.)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (value || '')) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      placeholder={placeholder}
      title={title}
      style={style}
      defaultValue={value || ''}
      required={required}
    />
  );
}