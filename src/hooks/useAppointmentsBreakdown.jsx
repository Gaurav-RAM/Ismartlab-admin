// src/hooks/useAppointmentsBreakdown.js
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

function toTs(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (endOfDay) d.setHours(23,59,59,999);
  return Timestamp.fromDate(d);
}

function getDocDate(a) {
  const cands = [a.createdAt, a.date, a.paidAt, a.updatedAt];
  for (const v of cands) {
    if (!v) continue;
    const d = v.toDate ? v.toDate() : new Date(v);
    if (d instanceof Date && !isNaN(d)) return d;
  }
  return null;
}

function classify(appt) {
  const t = String(appt.type || appt.appointmentType || appt.serviceType || '').toLowerCase();
  if (t.includes('package')) return 'package';
  if (t.includes('test')) return 'test';
  if ('packageId' in appt || 'package' in appt) return 'package';
  if (Array.isArray(appt.items) && appt.items.some(i => String(i?.type || '').toLowerCase() === 'package')) return 'package';
  return 'test';
}

export function useAppointmentsBreakdown(db, range) {
  const [data, setData] = useState([
    { name: 'Test', value: 0 },
    { name: 'Packages', value: 0 },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const startTs = toTs(range?.start, false);
        const endTs = toTs(range?.end, true);

        const filters = [];
        if (startTs) filters.push(where('createdAt', '>=', startTs));
        if (endTs) filters.push(where('createdAt', '<=', endTs));

        const q = query(collection(db, 'appointments'), ...filters);
        const snap = await getDocs(q);

        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fallback: include docs missing createdAt by fetching broadly, then filter client-side
        if (docs.length === 0) {
          const broad = await getDocs(collection(db, 'appointments'));
          docs = broad.docs.map(d => ({ id: d.id, ...d.data() }));
          if (startTs && endTs) {
            const s = startTs.toDate();
            const e = endTs.toDate();
            docs = docs.filter(a => {
              const d = getDocDate(a);
              return d && d >= s && d <= e;
            });
          }
        }

        let tests = 0, packages = 0;
        for (const a of docs) (classify(a) === 'package' ? (packages += 1) : (tests += 1));

        if (!cancelled) setData([{ name: 'Test', value: tests }, { name: 'Packages', value: packages }]);
      } catch {
        if (!cancelled) setData([{ name: 'Test', value: 0 }, { name: 'Packages', value: 0 }]);
      }
    })();
    return () => { cancelled = true; };
  }, [db, range?.start, range?.end]);

  return { data };
}
