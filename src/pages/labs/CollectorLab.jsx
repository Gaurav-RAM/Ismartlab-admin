// src/pages/labs/CollectorLab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { AdvancedFilterDrawer } from '../../components/AdvancedFilter';
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
  getCountFromServer,
} from 'firebase/firestore';

// helpers
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
const norm = (s) => (s ?? '').toString().trim().toLowerCase();

// sortable header
function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  const iconCls = sortBy === path ? (sortDir === 'asc' ? 'clu-sort asc' : 'clu-sort desc') : 'clu-sort';
  return (
    <button className="clu-thbtn" onClick={next} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <span className={iconCls} aria-hidden="true" />
    </button>
  );
}

// map lab doc -> row
const mapDocToRow = (snap, counts) => {
  const d = snap.data();
  const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : null;
  const labName = d.labName ?? d.name ?? '';
  const agg = counts[snap.id] || { tests: '', bookings: '', collectors: '' };
  return {
    id: snap.id,
    name: labName,
    testCaseCounter: d.testsCount ?? d.testCount ?? agg.tests ?? '',
    bookings: d.bookingCount ?? agg.bookings ?? '',
    collectors: d.collectorsCount ?? agg.collectors ?? '',
    status: typeof d.active === 'boolean' ? (d.active ? 'active' : 'inactive') : (d.status ?? ''),
    _createdAt: createdAt,
    _labName: labName,
    _accreditationType: d.accreditation?.type ?? d.type ?? '',
    _taxId: d.taxId ?? d.tax ?? '',
    _paymentMode: d.paymentMode ?? d.defaultPaymentMode ?? '',
  };
};

export default function CollectorLab() {
  const navigate = useNavigate();

  // header state
  const [action, setAction] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(id);
  }, [searchText]);

  // advanced drawer
  const [openAdv, setOpenAdv] = useState(false);
  const [advValues, setAdvValues] = useState({ lab:'', collector:'', tax:'', accreditationType:'', paymentMode:'' });
  const [appliedAdv, setAppliedAdv] = useState({});
  const onApplyAdv = () => { setAppliedAdv(advValues); setOpenAdv(false); };
  const onResetAdv = () => { setAdvValues({}); setAppliedAdv({}); };

  // data
  const [labDocs, setLabDocs] = useState([]);
  const [countsMap, setCountsMap] = useState({}); // { [labId]: {tests, bookings, collectors} }

  // equality filters (use only fields that exist)
  const equalityWhere = () => {
    const parts = [];
    if (quickFilter === 'active') parts.push(where('active','==',true));
    if (quickFilter === 'inactive') parts.push(where('active','==',false));
    if (appliedAdv.tax) parts.push(where('taxId','==', appliedAdv.tax));
    if (appliedAdv.accreditationType) parts.push(where('accreditation.type','==', appliedAdv.accreditationType));
    if (appliedAdv.paymentMode) parts.push(where('paymentMode','==', appliedAdv.paymentMode));
    if (appliedAdv.lab) parts.push(where('__name__','==', appliedAdv.lab));
    return parts;
  };

  // fetch counts from related collections
  const fetchCountsForLabs = async (docs) => {
    const out = {};
    const countFor = async (coll, field, labId) => {
      const q = fsQuery(collection(db, coll), where(field, '==', labId));
      const snap = await getCountFromServer(q);
      return snap.data().count || 0;
    };
    for (const s of docs) {
      const id = s.id;
      let tests = await countFor('collector_test_cases', 'lab.id', id);
      if (!tests) tests = await countFor('collector_test_cases', 'labId', id);
      let bookings = await countFor('appointments', 'lab.id', id);
      if (!bookings) bookings = await countFor('appointments', 'labId', id);
      let collectors = await countFor('collectors', 'lab.id', id);
      if (!collectors) collectors = await countFor('collectors', 'labId', id);
      out[id] = { tests, bookings, collectors };
    }
    setCountsMap(out);
  };

  // subscribe to labs + search
  useEffect(() => {
    const col = collection(db, 'labs');

    if (!debouncedSearch) {
      const q = fsQuery(col, ...equalityWhere(), orderBy('createdAt','desc'));
      const unsub = onSnapshot(q, async (snap) => {
        setLabDocs(snap.docs);
        await fetchCountsForLabs(snap.docs);
      });
      return () => unsub();
    }

    const term = norm(debouncedSearch);
    const merged = new Map();
    const build = (field) => fsQuery(
      col,
      ...equalityWhere(),
      orderBy(field),
      where(field, '>=', term),
      where(field, '<=', term + '\uf8ff')
    );
    const u1 = onSnapshot(build('labName'), (snap) => { snap.docs.forEach(d => merged.set(d.id, d)); const docs = Array.from(merged.values()); setLabDocs(docs); fetchCountsForLabs(docs); });
    const u2 = onSnapshot(build('accreditation.type'), (snap) => { snap.docs.forEach(d => merged.set(d.id, d)); const docs = Array.from(merged.values()); setLabDocs(docs); fetchCountsForLabs(docs); });
    const u3 = onSnapshot(build('taxId'), (snap) => { snap.docs.forEach(d => merged.set(d.id, d)); const docs = Array.from(merged.values()); setLabDocs(docs); fetchCountsForLabs(docs); });
    return () => { u1 && u1(); u2 && u2(); u3 && u3(); };
  }, [quickFilter, appliedAdv, debouncedSearch]);

  // rows from docs + counts
  const rowsFromDb = useMemo(() => labDocs.map(s => mapDocToRow(s, countsMap)), [labDocs, countsMap]);

  // options for drawer
  const filterOptions = useMemo(() => {
    const uniq = (arr) => Array.from(new Map(arr.filter(Boolean).map(x => [x.value, x])).values());
    const labs = uniq(rowsFromDb.map(r => ({ value: r.id, label: r.name })).filter(Boolean));
    const taxes = uniq(rowsFromDb.map(r => r._taxId ? ({ value: r._taxId, label: r._taxId }) : null));
    const accreditations = uniq(rowsFromDb.map(r => r._accreditationType ? ({ value: r._accreditationType, label: r._accreditationType }) : null));
    const paymentModes = uniq([
      ...rowsFromDb.map(r => r._paymentMode ? ({ value: r._paymentMode, label: r._paymentMode }) : null),
      { value:'cash', label:'Cash' }, { value:'card', label:'Card' }, { value:'upi', label:'UPI' }, { value:'netbanking', label:'Net Banking' },
    ]);
    return { labs, collectors: [], taxes, accreditations, paymentModes };
  }, [rowsFromDb]);

  // SORTING: single state pair (fixes “already been declared”)
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => { setSortBy(path); setSortDir(dir); };

  const rows = useMemo(() => {
    const list = rowsFromDb.slice();
    if (!sortBy || !sortDir) return list;
    list.sort((a, b) => {
      const A = getByPath(a, sortBy) ?? '';
      const B = getByPath(b, sortBy) ?? '';
      return sortDir === 'asc' ? (A > B ? 1 : A < B ? -1 : 0) : (A < B ? 1 : A > B ? -1 : 0);
    });
    return list;
  }, [rowsFromDb, sortBy, sortDir]);

  // selection and bulk apply
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const allOnPageSelected = rows.length > 0 && rows.every(r => selectedIds.has(r.id));
  const toggleOne = (id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };
  const toggleAllOnPage = (checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) rows.forEach(r => next.add(r.id));
      else rows.forEach(r => next.delete(r.id));
      return next;
    });
  };
  const BULK_UPDATES = { enable: { active: true }, disable: { active: false } };
  const handleApply = async () => {
    if (!action) return alert('Select an action first.');
    const updates = BULK_UPDATES[action];
    if (!updates) return alert('Unknown action.');
    try {
      const batch = writeBatch(db);
      rows.forEach(r => { if (selectedIds.has(r.id)) batch.update(doc(db, 'labs', r.id), updates); });
      await batch.commit();
      setAction(''); setSelectedIds(new Set());
      alert('Bulk update applied.');
    } catch (e) {
      console.error(e);
      alert('Failed to apply bulk update.');
    }
  };

  // CSV export
  const handleExport = () => {
    const headers = ['Name','Tests','Bookings','Collectors','Status','Created'];
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        (r.name ?? '').replace(/,/g,' '),
        (r.testCaseCounter ?? '').toString().replace(/,/g,' '),
        (r.bookings ?? '').toString().replace(/,/g,' '),
        (r.collectors ?? '').toString().replace(/,/g,' '),
        (r.status ?? '').replace(/,/g,' '),
        (r._createdAt ? r._createdAt.toLocaleString() : '').replace(/,/g,' ')
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `labs_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // header UI
  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Labs' }];
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
              <MenuItem value="enable">Enable</MenuItem>
              <MenuItem value="disable">Disable</MenuItem>
            </Select>
          </FormControl>
          <Button style={{height:"40px"}} variant="contained" size="small" disabled={!action || selectedIds.size === 0} onClick={handleApply}>
            Apply
          </Button>
          <Button style={{height:"40px"}} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              style={{ height:"40px" }}
              displayEmpty
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              renderValue={(val) => (!val ? 'All statuses' : val[0].toUpperCase() + val.slice(1))}
              aria-label="Quick status filter"
            >
              <MenuItem value=""><em>All statuses</em></MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <TextField
            style={{height:"40px"}}
            size="small"
            placeholder="Search by lab/tax/accreditation…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ minWidth: 320 }}
            aria-label="Search"
          />

          <Button style={{height:"40px"}} onClick={() => navigate("form")} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>

          <Button style={{height:"40px"}} startIcon={<FilterListIcon />} variant="contained" color="error" size="small" onClick={() => setOpenAdv(true)}>
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // table head
  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th"><SortHeader label="Name" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Tests" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Bookings" path="bookings" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Collectors" path="collectors" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <CollectorListUnified
        variant=""
        title="Labs"
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onSearch={() => {}}
        onOpenAdvancedFilter={() => setOpenAdv(true)}
        onExport={handleExport}
        headerSlot={renderHeader}
        renderHead={renderHead}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>
              <input
                type="checkbox"
                checked={selectedIds.has(r.id)}
                onChange={(e) => toggleOne(r.id, e.target.checked)}
              />
            </td>
            <td>{r.name}</td>
            <td>{r.testCaseCounter}</td>
            <td>{r.bookings}</td>
            <td>{r.collectors}</td>
            <td>{r.status}</td>
            <td>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="View">
                  <IconButton size="small" color="primary" aria-label="view" onClick={() => navigate(`/labs/view/${r.id}`)}>
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" color="primary" aria-label="edit" onClick={() => navigate(`/labs/edit/${r.id}`)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" aria-label="delete" onClick={async () => {
                    if (!window.confirm('Delete this lab?')) return;
                    await deleteDoc(doc(db, 'labs', r.id));
                  }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </td>
          </tr>
        )}
      />

      <AdvancedFilterDrawer
        open={openAdv}
        onClose={() => setOpenAdv(false)}
        preset="lab"
        title="Advanced Filter"
        values={advValues}
        setValues={setAdvValues}
        options={{
          labs: filterOptions.labs,
          collectors: [],
          taxes: filterOptions.taxes,
          accreditations: filterOptions.accreditations,
          paymentModes: filterOptions.paymentModes,
        }}
        onApply={onApplyAdv}
        onReset={onResetAdv}
      />
    </Box>
  );
}
