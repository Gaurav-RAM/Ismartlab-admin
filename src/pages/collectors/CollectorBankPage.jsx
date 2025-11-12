// src/pages/collectors/CollectorBanks.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import { useNavigate,Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

import { db } from '../../firebase';
import {
  collection,
  onSnapshot,
  query as fsQuery,
  orderBy,
  where,
  writeBatch,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

// simple sort helper
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

// header sort button
function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  const cls = sortBy === path ? (sortDir === 'asc' ? 'clu-sort asc' : 'clu-sort desc') : 'clu-sort';
  return (
    <button className="clu-thbtn" onClick={next} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <span className={cls} aria-hidden="true" />
    </button>
  );
}

// toggle
function Toggle({ checked, onChange }) {
  return (
    <label className="clu-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="clu-slider" />
    </label>
  );
}

// compose a row from bank doc + optional collector join
const toRow = (snap, collector) => {
  const d = snap.data();
  return {
    id: snap.id,
    bankName: d.bankName ?? '',
    branchName: d.branchName ?? '',
    collectorId: d.collector ?? '',
    collectorName: collector?.name ?? (d.collector ?? ''),
    contactNumber: d.phone ?? '',
    isActive: !!d.active,
    // extras used by actions/export/search
    ifsc: d.ifsc ?? '',
    accountNumber: d.accountNumber ?? '',
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : null,
    _collectorEmail: collector?.email ?? '',
  };
};

export default function CollectorBankPage() {
  const navigate = useNavigate();
  const bankForm = () => { navigate('form'); };

  // header and table state
  const [searchText, setSearchText] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [debounced, setDebounced] = useState('');
  const [action, setAction] = useState('');
  const [statusQuick, setStatusQuick] = useState(''); // '', active, inactive
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  // raw Firestore docs and collector cache
  const [bankDocs, setBankDocs] = useState([]);
  const [collectorMap, setCollectorMap] = useState({});
  const cacheRef = useRef({});

  useEffect(() => {
    const id = setTimeout(() => setDebounced(searchText.trim()), 300);
    return () => clearTimeout(id);
  }, [searchText]);

  // equality filter parts from quick status
  const equalityWhere = () => {
    const parts = [];
    if (statusQuick === 'active') parts.push(where('active', '==', true));
    if (statusQuick === 'inactive') parts.push(where('active', '==', false));
    return parts;
  };

  // load collector details by id (join on client)
  const warmCollectors = async (ids) => {
    const missing = ids.filter(id => id && !cacheRef.current[id]);
    if (!missing.length) return;
    const entries = await Promise.all(missing.map(async (cid) => {
      try {
        const cs = await getDoc(doc(db, 'collectors', cid));
        if (cs.exists()) {
          const c = cs.data();
          return [cid, { name: c.name ?? '', email: c.email ?? '' }];
        }
      } catch {}
      return [cid, { name: '', email: '' }];
    }));
    const next = { ...cacheRef.current };
    entries.forEach(([k, v]) => { next[k] = v; });
    cacheRef.current = next;
    setCollectorMap(next);
  };

  // subscribe to collector_banks with server-side search when possible
  useEffect(() => {
    const col = collection(db, 'collector_banks');

    // no search: single ordered stream
    if (!debounced) {
      const q = fsQuery(col, ...equalityWhere(), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, async (snap) => {
        setBankDocs(snap.docs);
        const ids = Array.from(new Set(snap.docs.map(d => d.data().collector).filter(Boolean)));
        await warmCollectors(ids);
      });
      return () => unsub();
    }

    // with search: run per-field prefix queries and merge
    const term = debounced.toLowerCase();
    const fields = ['bankName', 'branchName', 'collector', 'phone'];
    const merged = new Map();
    const unsubs = fields.map((field) => {
      const q = fsQuery(
        col,
        ...equalityWhere(),
        orderBy(field),
        where(field, '>=', term),
        where(field, '<=', term + '\uf8ff')
      );
      return onSnapshot(q, async (snap) => {
        snap.docs.forEach(d => merged.set(d.id, d));
        const docs = Array.from(merged.values());
        setBankDocs(docs);
        const ids = Array.from(new Set(docs.map(d => d.data().collector).filter(Boolean)));
        await warmCollectors(ids);
      });
    });
    return () => unsubs.forEach(u => u && u());
  }, [statusQuick, debounced]);

  // compose rows with join
  const rows = useMemo(() => {
    return bankDocs.map(s => toRow(s, collectorMap[s.data().collector]));
  }, [bankDocs, collectorMap]);

  // client sorting
  const onSortChange = (key, dir) => { setSortBy(key); setSortDir(dir); setPage(1); };
  const sorted = useMemo(() => {
    if (!sortBy || !sortDir) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const va = getByPath(a, sortBy);
      const vb = getByPath(b, sortBy);
      const A = typeof va === 'string' ? va.toLowerCase() : va ?? '';
      const B = typeof vb === 'string' ? vb.toLowerCase() : vb ?? '';
      if (A < B) return sortDir === 'asc' ? -1 : 1;
      if (A > B) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  // pagination
  const start = (page - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const total = sorted.length;

  // selection helpers
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAllOnPage = (v) => {
    const next = new Set(selected);
    pageRows.forEach((r) => (v ? next.add(r.id) : next.delete(r.id)));
    setSelected(next);
  };

  // bulk apply actions
  const handleApply = async () => {
    if (!action) return alert('Select an action first.');
    try {
      if (action === 'delete') {
        const batch = writeBatch(db);
        Array.from(selected).forEach(id => batch.delete(doc(db, 'collector_banks', id)));
        await batch.commit();
      } else if (action === 'activate' || action === 'deactivate') {
        const nextActive = action === 'activate';
        const batch = writeBatch(db);
        Array.from(selected).forEach(id => batch.update(doc(db, 'collector_banks', id), { active: nextActive }));
        await batch.commit();
      }
      setAction('');
      setSelected(new Set());
      alert('Bulk action applied.');
    } catch (e) {
      console.error(e);
      alert('Failed to apply bulk action.');
    }
  };

  // row toggle update
  const onToggleActive = async (row, v) => {
    try { await updateDoc(doc(db, 'collector_banks', row.id), { active: v }); }
    catch (e) { console.error(e); alert('Failed to update status'); }
  };

  // CSV export of current view (all filtered/sorted rows, not only current page)
  const handleExport = () => {
    const headers = ['Bank Name','Branch Name','Collector','Contact','IFSC','Account No','Status','Created'];
    const lines = [
      headers.join(','),
      ...sorted.map(r => [
        (r.bankName ?? '').replace(/,/g,' '),
        (r.branchName ?? '').replace(/,/g,' '),
        (r.collectorName ?? '').replace(/,/g,' '),
        (r.contactNumber ?? '').replace(/,/g,' '),
        (r.ifsc ?? '').replace(/,/g,' '),
        (r.accountNumber ?? '').replace(/,/g,' '),
        r.isActive ? 'Active' : 'Inactive',
        (r.createdAt ? r.createdAt.toLocaleString() : '').replace(/,/g,' ')
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `collector_banks_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

    const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Unassigned Collector List' }];


  // header slot per design
  const renderHeader = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2.5 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((b, i) => b.to
            ? <Link key={i} component={RouterLink} underline="hover" to={b.to}>{b.label}</Link>
            : <Typography key={i}>{b.label}</Typography>
          )}
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              style={{ width: "90px", height:"40px" }}
              displayEmpty
              value={action}
              onChange={(e) => setAction(e.target.value)}
              renderValue={(val) => val ? (val === 'enable' ? 'Enable' : 'Disable') : 'No action'}
              aria-label="Bulk action"
            >
              <MenuItem value=""><em>No action</em></MenuItem>
              <MenuItem value="enable">active</MenuItem>
              <MenuItem value="disable">in active</MenuItem>
            </Select>
          </FormControl>
          <Button style={{ height: "40px" }} variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>
          <Button style={{ height: "40px" }} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        style={{ height:"40px" }}
                        displayEmpty
                        value={quickFilter}
                        onChange={(e) => setQuickFilter(e.target.value)}
                        renderValue={(val) => (!val ? 'All documents' : val[0].toUpperCase() + val.slice(1))}
                        aria-label="Quick filter"
                      >
                        <MenuItem value=""><em>All</em></MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="verified">Verified</MenuItem>
                        <MenuItem value="unverified">Unverified</MenuItem>
                      </Select>
                    </FormControl>
          <TextField
            style={{ height: "40px" }}
            size="small"
            placeholder="search by name/lab/phone..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ minWidth: 320 }}
            aria-label="Search"
          />
         <Button style={{ height:"40px" }} onClick={() => { navigate("form"); }} variant="contained" size="small">
            Add Bank
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th"><SortHeader label="Bank Name" path="bankName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Branch Name" path="branchName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Collector Name" path="collectorName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Contact Number" path="contactNumber" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="isActive" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

  const renderRow = (r) => (
    <tr key={r.id}>
      <td>
        <input
          type="checkbox"
          checked={selected.has(r.id)}
          onChange={(e) => {
            const next = new Set(selected);
            e.target.checked ? next.add(r.id) : next.delete(r.id);
            setSelected(next);
          }}
        />
      </td>
      <td>{r.bankName}</td>
      <td>{r.branchName}</td>
      <td>{r.collectorName}</td>
      <td>{r.contactNumber}</td>
      <td>
        <Toggle
          checked={!!r.isActive}
          onChange={(v) => onToggleActive(r, v)}
        />
      </td>
      <td>
        <div className="clu-btn-group">
          <button className="clu-btn small outline" onClick={() => navigate(`edit/${r.id}`)}>Edit</button>
          <button
            className="clu-btn small danger"
            onClick={async () => {
              if (!window.confirm('Delete this bank record?')) return;
              await deleteDoc(doc(db, 'collector_banks', r.id));
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <CollectorListUnified
      variant="pending"
      title="Collector Banks"
      rows={pageRows}
      headerSlot={renderHeader}
      renderHead={renderHead}
      renderRow={renderRow}
      hideActionsRow={true}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      onPageSizeChange={(s) => { setPage(1); setPageSize(s); }}
      search={searchText}
      onSearch={setSearchText}
      bulkActions={[]}
      selectedAction=""
      onActionChange={() => {}}
      onApply={() => {}}
      onExport={handleExport}
      onOpenAdvancedFilter={() => {}}
    />
  );
}
