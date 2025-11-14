// src/pages/labs/CollectorLab.jsx
import React, { useState, useMemo, useEffect } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import { useNavigate } from 'react-router-dom';
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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Chip from '@mui/material/Chip';

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
  updateDoc,
  documentId,
} from 'firebase/firestore';

import { AdvancedFilterDrawer } from "../../components/AdvancedFilter";

// helpers
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
const norm = (s) => (s ?? '').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

// visual helpers (chips)
const OnlineChip = ({ online }) => (
  <Chip
    size="small"
    label={online ? 'Online' : 'Offline'}
    color={online ? 'success' : 'error'}
    variant="filled"
    sx={{ fontWeight: 600, color: '#fff' }}
  />
);

const ActiveChip = ({ active }) => (
  <Chip
    size="small"
    label={active ? 'Active' : 'Inactive'}
    color={active ? 'success' : 'default'}
    variant="filled"
    sx={{ fontWeight: 600 }}
  />
);

// table sort header
function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  let icon = <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.7 }}/>;
  if (sortBy === path) {
    icon = sortDir === 'asc'
      ? <ArrowUpwardIcon fontSize="small" sx={{ color: '#fff' }}/>
      : <ArrowDownwardIcon fontSize="small" sx={{ color: '#fff' }}/>;
  }
  return (
    <button
      className="clu-thbtn"
      onClick={next}
      aria-label={`Sort by ${label}`}
      style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'transparent', border:'none', padding:0, cursor:'pointer', color:'inherit' }}
    >
      <span>{label}</span>
      {icon}
    </button>
  );
}

// map Firestore doc -> table row (aligned to your collectors schema)
const mapDocToRow = (snap) => {
  const d = snap.data();
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ').trim() || d.username || '';
  // If you have a separate presence field like d.isOnline, prefer that here; else mirror statusActive
  const isOnline = typeof d.isOnline === 'boolean' ? d.isOnline : !!d.statusActive;
  const isActive = !!d.statusActive;
  return {
    id: snap.id,
    name: fullName,
    testCaseCounter: d.lab ?? '',
    bookings: d.contactNumber ?? d.email ?? '',
    // for chip rendering
    _isOnline: isOnline,
    _isActive: isActive,
    // keep textual columns for search/sort fallbacks
    collectors: isOnline ? 'Online' : 'Offline',
    status: isActive ? 'active' : 'inactive',
    _gender: d.gender ?? null,
    _dateTime: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null),
  };
};

export default function CollectorList() {
  const navigate = useNavigate();

  // header state
  const [action, setAction] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText.trim()), 250);
    return () => clearTimeout(id);
  }, [searchText]);

  // drawer state
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  // data
  const [rowsFromDb, setRowsFromDb] = useState([]);
  const [options, setOptions] = useState({
    collectors: [],
    labs: [],
    tests: [],
    paymentStatus: [],
    status: [],
    submissionStatus: [],
    genders: [],
  });

  // equality filters for collectors list
  const equalityWhere = (f) => {
    const parts = [];
    if (f.collector) parts.push(where(documentId(), '==', f.collector));
    if (f.lab) parts.push(where('lab', '==', f.lab));
    if (f.gender) parts.push(where('gender', '==', f.gender));
    if (f.status) parts.push(where('status', '==', f.status));
    if (typeof f.statusActive === 'boolean') parts.push(where('statusActive', '==', f.statusActive));
    return parts;
  };

  // derive options helper (uses snapshots so we can access ids)
  const deriveOptionsFromDocs = (docs) => {
    const uniqByVal = (arr) => {
      const m = new Map();
      arr.forEach(x => { if (x.value && !m.has(x.value)) m.set(x.value, x); });
      return Array.from(m.values());
    };

    const collectors = uniqByVal(docs.map(s => {
      const d = s.data();
      const lbl = [d.firstName, d.lastName].filter(Boolean).join(' ').trim() || d.username || 'Unknown';
      return { value: s.id, label: lbl };
    })).filter(x => x.value);

    const labs = uniqByVal(docs.map(s => {
      const d = s.data();
      return { value: d.lab ?? '', label: d.lab ?? '' };
    })).filter(x => x.value);

    const genders = uniqByVal(docs.map(s => {
      const d = s.data();
      const g = d.gender ?? '';
      return { value: g, label: g ? g.replace(/\b\w/g, c => c.toUpperCase()) : '' };
    })).filter(x => x.value);

    return { collectors, labs, tests: [], paymentStatus: [], status: [], submissionStatus: [], genders };
  };

  // server-side subscriptions
  useEffect(() => {
    const colRef = collection(db, 'collectors');

    // No search: single ordered subscription
    if (!debouncedSearch) {
      const q = fsQuery(colRef, ...equalityWhere(appliedFilters), orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setRowsFromDb(snap.docs.map(mapDocToRow));
        setOptions(deriveOptionsFromDocs(snap.docs));
      });
      return () => unsub();
    }

    // With search: run per-field prefix queries and merge
    const s = debouncedSearch;
    const fields = [
      'firstName',
      'lastName',
      'username',
      'email',
      'lab',
      'city',
      'state',
    ];
    const merged = new Map();
    const unsubs = fields.map((field) => {
      const q = fsQuery(
        colRef,
        ...equalityWhere(appliedFilters),
        orderBy(field),
        where(field, '>=', s),
        where(field, '<=', s + '\uf8ff')
      );
      return onSnapshot(q, (snap) => {
        snap.docs.forEach((d) => merged.set(d.id, mapDocToRow(d)));
        setRowsFromDb(Array.from(merged.values()));
        setOptions((prev) => ({ ...prev, ...deriveOptionsFromDocs(snap.docs) }));
      });
    });
    return () => unsubs.forEach(u => u && u());
  }, [appliedFilters, debouncedSearch]);

  // quick filter (client)
  const afterQuick = useMemo(() => {
    if (!quickFilter) return rowsFromDb;
    return rowsFromDb.filter(r => norm(r.status) === norm(quickFilter));
  }, [rowsFromDb, quickFilter]);

  // sorting
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => { setSortBy(path); setSortDir(dir); };

  const rows = useMemo(() => {
    const list = afterQuick.slice();
    if (!sortBy || !sortDir) return list;
    list.sort((a, b) => {
      const A = getByPath(a, sortBy) ?? '';
      const B = getByPath(b, sortBy) ?? '';
      return sortDir === 'asc' ? (A > B ? 1 : A < B ? -1 : 0) : (A < B ? 1 : A > B ? -1 : 0);
    });
    return list;
  }, [afterQuick, sortBy, sortDir]);

  // bulk Apply to visible rows (toggle statusActive)
  const BULK_UPDATES = { enable: { statusActive: true }, disable: { statusActive: false } };
  const handleApply = async () => {
    if (!action) return alert('Select an action first.');
    const updates = BULK_UPDATES[action];
    if (!updates) return alert('Unknown action.');
    try {
      const batch = writeBatch(db);
      rows.forEach(r => batch.update(doc(db, 'collectors', r.id), updates));
      await batch.commit();
      setAction('');
      alert('Bulk update applied to visible rows.');
    } catch (e) {
      console.error(e);
      alert('Failed to apply bulk update.');
    }
  };

  // single toggle active
  const handleToggleActive = async (r) => {
    try {
      const ref = doc(db, 'collectors', r.id);
      await updateDoc(ref, { statusActive: !r._isActive });
    } catch (e) {
      console.error(e);
      alert('Failed to toggle active status.');
    }
  };

  // export visible rows
  const handleExport = () => {
    const headers = ['Collector','Lab','Contact Number','Current Status','Status'];
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        (r.name ?? '').replace(/,/g,' '),
        (r.testCaseCounter ?? '').replace(/,/g,' '),
        (r.bookings ?? '').replace(/,/g,' '),
        ((r._isOnline ? 'Online' : 'Offline') ?? '').replace(/,/g,' '),
        ((r._isActive ? 'Active' : 'Inactive') ?? '').replace(/,/g,' ')
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collectors_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // header UI
  const breadcrumbs = [{ label:'Dashboard', to:'/' }, { label:'Collector List' }];
  const onOpen = () => setOpen(true);
  const handleApplyFilters = () => { setAppliedFilters(values); setOpen(false); };
  const handleResetFilters = () => { setValues({}); setAppliedFilters({}); };

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

          <Button style={{ height:"40px" }} onClick={() => { navigate("new"); }} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>

          <Button
            style={{ height:"40px" }}
            startIcon={<FilterListIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={onOpen}
          >
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderHead = () => (
    <tr>
      <th className="clu-th"><SortHeader label="Collector" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Lab" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Contact Number" path="bookings" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Current Status" path="collectors" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <CollectorListUnified
        variant=""
        title="Collector List"
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onSearch={() => {}}
        onOpenAdvancedFilter={() => {}}
        onExport={() => {}}
        headerSlot={renderLabHeader}
        renderHead={renderHead}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td>{r.testCaseCounter}</td>
            <td>{r.bookings}</td>
            <td><OnlineChip online={r._isOnline} /></td>
            <td><ActiveChip active={r._isActive} /></td>
            <td>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    color="success"
                    aria-label="edit"
                    onClick={() => navigate(`/collectors/edit/${r.id}`)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View">
                  <IconButton
                    size="small"
                    color="info"
                    aria-label="view"
                    onClick={() => navigate(`/collectors/view/${r.id}`)}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={r._isActive ? 'Disable' : 'Enable'}>
                  <IconButton
                    size="small"
                    color="warning"
                    aria-label="toggle-active"
                    onClick={() => handleToggleActive(r)}
                  >
                    {r._isActive ? <LockOutlinedIcon fontSize="small" /> : <LockOpenOutlinedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="delete"
                    onClick={async () => {
                      if (!window.confirm('Delete this record?')) return;
                      await deleteDoc(doc(db, 'collectors', r.id));
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </td>
          </tr>
        )}
      />

      <AdvancedFilterDrawer
        open={open}
        onClose={() => setOpen(false)}
        preset="collector"
        title="Advanced Filter"
        values={values}
        setValues={setValues}
        options={{
          collectors: options.collectors,
          labs: options.labs,
          genders: options.genders.length ? options.genders : [
            { value:'male', label:'Male' },
            { value:'female', label:'Female' },
            { value:'other', label:'Other' },
          ],
        }}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </Box>
  );
}
