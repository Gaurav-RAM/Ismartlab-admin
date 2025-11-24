// src/pages/collectors/TestCases.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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
} from 'firebase/firestore';

// helpers
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
const norm = (s) => (s ?? '').toString().trim().toLowerCase();
const resolveName = (embedded, flat, id, byId) => embedded?.name ?? flat ?? (id && byId?.[id]?.name) ?? '';

// doc -> row
const mapDocToRow = (snap, joins) => {
  const d = snap.data();
  const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : null;

  const testName = d.test?.name ?? d.testName ?? d.test_title ?? '';
  const categoryName = d.category?.name ?? d.categoryName ?? ''; // optional category display
  const labName = resolveName(d.lab, d.labName, d.labId, joins.labs);
  const price = d.price ?? d.amount ?? ''; // price display if available
  const status = d.status ?? d.currentStatus ?? '';

  return {
    id: snap.id,
    name: testName,
    testCaseCounter: categoryName, // column label updated below to "Test Category"
    bookings: labName,             // "Labs"
    collectors: price,             // "Price"
    status,
    _createdAt: createdAt,
  };
};

export default function TestCases() {
  const navigate = useNavigate();

  // topbar
  const [action, setAction] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => { const id = setTimeout(() => setDebouncedSearch(searchText.trim()), 300); return () => clearTimeout(id); }, [searchText]); // debounced server queries [web:41]

  // advanced filter (Category, Test, Lab)
  const [openAdv, setOpenAdv] = useState(false);
    const [onOpen, setOpen] = useState(false);
  const [advValues, setAdvValues] = useState({ category:'', test:'', lab:'', status:'' });
  const [appliedAdv, setAppliedAdv] = useState({});
  const onApplyAdv = () => { setAppliedAdv(advValues); setOpenAdv(false); };
  const onResetAdv = () => { setAdvValues({}); setAppliedAdv({}); };

  // join caches for lab/collector/patient names (if you later need collector/patient columns, this is ready)
  const labsRef = useRef({});
  useEffect(() => {
    const u = onSnapshot(collection(db, 'labs'), snap => {
      const m = {}; snap.forEach(d => m[d.id] = { name: d.data().name ?? d.data().labName ?? '' });
      labsRef.current = m;
    });
    return () => u();
  }, []); // client-side join workaround for ID-only docs [web:423]

  // build filter options (categories/tests/labs) — simple example from lookup collections
  const [drawerOptions, setDrawerOptions] = useState({ categories: [], tests: [], labs: [] });
  useEffect(() => {
    const unsubs = [];
    unsubs.push(onSnapshot(collection(db, 'test_categories'), snap => {
      const opts = []; snap.forEach(d => opts.push({ value:d.id, label:d.data().name ?? d.id }));
      setDrawerOptions(prev => ({ ...prev, categories: opts }));
    }));
    unsubs.push(onSnapshot(collection(db, 'tests'), snap => {
      const opts = []; snap.forEach(d => opts.push({ value:d.id, label:d.data().name ?? d.id }));
      setDrawerOptions(prev => ({ ...prev, tests: opts }));
    }));
    unsubs.push(onSnapshot(collection(db, 'labs'), snap => {
      const opts = []; snap.forEach(d => opts.push({ value:d.id, label:d.data().name ?? d.id }));
      setDrawerOptions(prev => ({ ...prev, labs: opts }));
    }));
    return () => unsubs.forEach(u => u());
  }, []); // load select lists once [web:41]

  // data
  const [rowsFromDb, setRowsFromDb] = useState([]);

  // equality filters (status/category/test/lab)
  const equalityWhere = () => {
    const parts = [];
    if (quickFilter) parts.push(where('status','==', quickFilter));
    if (appliedAdv.status) parts.push(where('status','==', appliedAdv.status));
    if (appliedAdv.category) {
      parts.push(where('category.id','==', appliedAdv.category));
      // or: parts.push(where('categoryId','==', appliedAdv.category));
    }
    if (appliedAdv.test) {
      parts.push(where('test.id','==', appliedAdv.test));
      // or: parts.push(where('testId','==', appliedAdv.test));
    }
    if (appliedAdv.lab) {
      parts.push(where('lab.id','==', appliedAdv.lab));
      // or: parts.push(where('labId','==', appliedAdv.lab));
    }
    return parts;
  };



  // subscribe + search
  useEffect(() => {
    const col = collection(db, 'collector_test_cases');

    if (!debouncedSearch) {
      const q = fsQuery(col, ...equalityWhere(), orderBy('createdAt','desc'));
      const unsub = onSnapshot(q, (snap) => {
        const joins = { labs: labsRef.current, collectors: {}, patients: {} };
        setRowsFromDb(snap.docs.map(d => mapDocToRow(d, joins)));
      });
      return () => unsub();
    }

    // per-field prefix search with merging: test.name OR lab.name (and optionally category.name)
    const term = norm(debouncedSearch);
    const merged = new Map();
    const fields = ['test.name','lab.name','category.name']; // ensure indexes when prompted [web:41]
    const unsubs = fields.map(field => {
      const q = fsQuery(
        col,
        ...equalityWhere(),
        orderBy(field),
        where(field, '>=', term),
        where(field, '<=', term + '\uf8ff')
      );
      return onSnapshot(q, (snap) => {
        snap.docs.forEach(d => merged.set(d.id, d));
        const joins = { labs: labsRef.current, collectors: {}, patients: {} };
        setRowsFromDb(Array.from(merged.values()).map(x => mapDocToRow(x, joins)));
      });
    });
    return () => unsubs.forEach(u => u && u());
  }, [quickFilter, appliedAdv, debouncedSearch]); // Firestore requires orderBy on same field as range; create composite index if asked [web:41][web:57]

  // sorting
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

  // selection + bulk updates
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const allOnPageSelected = rows.length > 0 && rows.every(r => selectedIds.has(r.id));
  const toggleOne = (id, checked) => setSelectedIds(prev => { const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next; });
  const toggleAllOnPage = (checked) => setSelectedIds(prev => { const next = new Set(prev); checked ? rows.forEach(r => next.add(r.id)) : rows.forEach(r => next.delete(r.id)); return next; });

  const BULK = { mark_done: { status: 'done' }, mark_pending: { status: 'pending' }, cancel: { status: 'cancelled' } };
  const handleApply = async () => {
    if (!action) return alert('Select an action first.');
    try {
      const batch = writeBatch(db);
      rows.forEach(r => { if (selectedIds.has(r.id)) batch.update(doc(db, 'collector_test_cases', r.id), BULK[action]); });
      await batch.commit();
      setAction(''); setSelectedIds(new Set());
      alert('Bulk action applied.');
    } catch (e) { console.error(e); alert('Failed to apply bulk action.'); }
  };

  // export
  const handleExport = () => {
    const headers = ['Test','Test Category','Labs','Price','Status','Created'];
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        (r.name ?? '').replace(/,/g,' '),
        (r.testCaseCounter ?? '').replace(/,/g,' '),
        (r.bookings ?? '').replace(/,/g,' '),
        (r.collectors ?? '').toString().replace(/,/g,' '),
        (r.status ?? '').replace(/,/g,' '),
        (r._createdAt ? r._createdAt.toLocaleString() : '').replace(/,/g,' ')
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `collector_test_cases_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // Sortable header button
  function SortHeader({ label, path, sortBy, sortDir, onChange }) {
    const next = () => {
      if (sortBy !== path) return onChange(path, 'asc');
      if (sortDir === 'asc') return onChange(path, 'desc');
      return onChange(null, null);
    };
    let icon = <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.7 }}/>;
    if (sortBy === path) icon = sortDir === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ color: '#fff' }}/> : <ArrowDownwardIcon fontSize="small" sx={{ color: '#fff' }}/>;
    return (
      <button className="clu-thbtn" onClick={next} aria-label={`Sort by ${label}`} style={{ display:'inline-flex', alignItems:'center', gap:10, background:'transparent', border:'none', padding:0, cursor:'pointer', color:'inherit' }}>
        <span>{label}</span>{icon}
      </button>
    );
  }

   const renderLabHeader = () => (
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
  
            <Button style={{ height:"40px" }} variant="contained" size="small" disabled={!action} onClick={handleApply}>
              Apply
            </Button>
  
            <Button style={{ height:"40px" }} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
              Export
            </Button>
          </Box>
  
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 73 }}>
              <Select
                style={{ height:"40px" }}
                displayEmpty
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                renderValue={(val) => (!val ? 'All' : (val === 'active' ? 'Active' : 'Inactive'))}
                aria-label="Quick filter"
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
  
            <TextField
              style={{ height:"40px" }}
              size="small"
              placeholder="search by name/username/email/lab..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
              sx={{ minWidth: 320 }}
              aria-label="Search"
            />
  
            <Button style={{ height:"40px" }} onClick={()=>navigate('testform')} startIcon={<AddIcon />} variant="contained" size="small">
              New
            </Button>
  
            <Button
              style={{ height:"40px" }}
              startIcon={<FilterListIcon />}
              variant="contained"
              color="error"
              size="small"
              onClick={onFilter}
            >
              Advanced Filter
            </Button>
          </Box>
        </Box>
      </Box>
    );

  // header UI
  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Test Case List' }];

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th"><SortHeader label="Test" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Test Category" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Labs" path="bookings" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Price" path="collectors" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

      const onFilter = () => setOpenAdv(true);

  return (
    <Box sx={{ width: '100%' }}>
      <CollectorListUnified
        variant=""
        title="Collector Test Cases"
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={10}
        onPageChange={()=>{}}
        onPageSizeChange={()=>{}}
        onSearch={()=>{}}
        onOpenAdvancedFilter={()=>setOpenAdv(true)}
        onExport={handleExport}
        headerSlot={renderLabHeader}
        renderHead={renderHead}
        renderRow={(r) => (
          <tr key={r.id}>
            <td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={(e)=>toggleOne(r.id, e.target.checked)} /></td>
            <td>{r.name}</td>
            <td>{r.testCaseCounter}</td>
            <td>{r.bookings}</td>
            <td>{r.collectors}</td>
            <td>{r.status}</td>
            <td>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton size="small" color="primary" aria-label="edit" onClick={()=>navigate(`/testcases/edit/${r.id}`)}><EditOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" aria-label="delete" onClick={async()=>{ if(!window.confirm('Delete this test case?')) return; await deleteDoc(doc(db,'collector_test_cases', r.id)); }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
            </td>
          </tr>
        )}
      />

      <AdvancedFilterDrawer
        open={openAdv}
        onClose={()=>setOpenAdv(false)}
        preset="testCase"
        title="Advanced Filter"
        values={advValues}
        setValues={setAdvValues}
        options={drawerOptions}
        onApply={onApplyAdv}
        onReset={onResetAdv}
      />
    </Box>
  );
}
