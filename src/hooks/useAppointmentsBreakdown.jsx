// src/hooks/useAppointmentsBreakdown.js
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

// Local helpers (isolated from Dashboard)
function toTs(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return Timestamp.fromDate(d);
}

function pickAmount(a) {
  const candidates = [a.amount, a.totalAmount, a.price, a.total, a.grandTotal];
  for (const v of candidates) {
    const n = Number(v);
    if (!isNaN(n) && isFinite(n)) return n;
  }
  return 0;
}

// Try to count items within a doc for both tests and packages
function countItems(a) {
  // Possible shapes:
  // - a.items: [{type:'test'|'package'|'tests'|'packages'|...}]
  // - a.tests: array of tests
  // - a.packages: array of packages
  // - a.type/category/isPackage: single classification
  let tests = 0;
  let packages = 0;

  // Array shapes:
  if (Array.isArray(a.tests)) tests += a.tests.length;
  if (Array.isArray(a.packages)) packages += a.packages.length;

  if (Array.isArray(a.items)) {
    for (const it of a.items) {
      const t = (it?.type || it?.kind || it?.category || '').toString().toLowerCase();
      if (t.includes('package')) packages += 1;
      else if (t.includes('test')) tests += 1;
    }
  }

  // Single-value shapes (fallback if arrays didn’t produce counts)
  if (tests === 0 && packages === 0) {
    const flag = a.isPackage ?? a.package ?? a.isPackageOrder;
    const typeLike = (a.type || a.category || '').toString().toLowerCase();
    if (flag === true || typeLike.includes('package')) packages += 1;
    else tests += 1; // default to test if nothing else is conclusive
  }

  return { tests, packages };
}

export function useAppointmentsBreakdown(db, range, opts = { mode: 'count' }) {
  const [data, setData] = useState([
    { name: 'Test', value: 0 },
    { name: 'Packages', value: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bounds = useMemo(() => {
    const startTs = toTs(range?.start, false);
    const endTs = toTs(range?.end, true);
    return { startTs, endTs };
  }, [range]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const apptCol = collection(db, 'appointments');
        const filters = [];
        if (bounds.startTs) filters.push(where('createdAt', '>=', bounds.startTs));
        if (bounds.endTs) filters.push(where('createdAt', '<=', bounds.endTs));
        const q = query(apptCol, ...filters);

        // Fetch docs in range, then aggregate locally for a 2-slice pie
        const snap = await getDocs(q);

        let testsVal = 0;
        let packagesVal = 0;

        for (const d of snap.docs) {
          const a = d.data() || {};
          if (opts.mode === 'revenue') {
            // Attribute revenue to the dominant category in the doc
            const { tests, packages } = countItems(a);
            const amt = pickAmount(a);
            if (packages > tests) packagesVal += amt;
            else if (tests > packages) testsVal += amt;
            else {
              // tie or unknown: split evenly
              testsVal += amt / 2;
              packagesVal += amt / 2;
            }
          } else {
            // Count-based split (default)
            const { tests, packages } = countItems(a);
            testsVal += tests;
            packagesVal += packages;
          }
        }

        if (!cancelled) {
          setData([
            { name: 'Test', value: Number(testsVal) || 0 },
            { name: 'Packages', value: Number(packagesVal) || 0 },
          ]);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [db, bounds, opts.mode]);

  return { data, loading, error };
}
