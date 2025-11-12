// src/pages/labs/CollectorUnassignedList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

import { AdvancedFilterDrawer } from '../../components/AdvancedFilter';

const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
const norm = (s) => (s ?? '').toString().trim();

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

// Map a collector document to table row fields
const mapDocToRow = (snap) => {
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name ?? '',
    testCaseCounter: d.lab?.name ?? '',
    bookings: d.phone ?? d.email ?? '',
    collectors: d.currentStatus ?? '',
    status: d.status ?? '',
    _labId: d.lab?.id ?? null,
    _gender: d.gender ?? null,
  };
};

export default function CollectorUnassignedList() {
  const navigate = useNavigate();

  // Header UI state
  const [action, setAction] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(norm(searchText)), 250);
    return () => clearTimeout(id);
  }, [searchText]);

  // Advanced Filter state
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  // Data and options
  const [rowsFromDb, setRowsFromDb] = useState([]);
  const [options, setOptions] = useState({ collectors: [], labs: [], genders: [] });

  // Always constrain to unassigned, then optional equals
  const equalityWhere = (f) => {
    const parts = [where('status', '==', 'unassigned')];
    if (f.lab) parts.push(where('lab.id', '==', f.lab));
    if (f.gender) parts.push(where('gender', '==', f.gender));
    // If you expose a “Select Collector” by ID externally, add where('__name__','==',id) via documentId(); omitted here
    return parts;
  };

  // Subscribe to collectors with safe default ordering by name
  useEffect(() => {
    const col = collection(db, 'collectors');

    if (!debouncedSearch) {
      // Use name for default ordering so docs aren’t excluded by a missing createdAt field
      const q = fsQuery(col, ...equalityWhere(appliedFilters), orderBy('name', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        const rows = snap.docs.map(mapDocToRow);
        setRowsFromDb(rows);

        // Build drawer options from the latest snapshot
        const ds = snap.docs.map(d => d.data());
        const uniq = (arr) => {
          const m = new Map();
          arr.forEach(x => { if (x.value && !m.has(x.value)) m.set(x.value, x); });
          return Array.from(m.values());
        };
        const collectors = uniq(snap.docs.map(d => ({ value: d.id, label: d.data().name ?? d.id })));
        const labs = uniq(ds.map(d => ({ value: d.lab?.id ?? '', label: d.lab?.name ?? '' }))).filter(x => x.value);
        const genders = uniq(ds.map(d => ({ value: d.gender ?? '', label: (d.gender ?? '').replace(/\b\w/g, c => c.toUpperCase()) }))).filter(x => x.value);
        setOptions({ collectors, labs, genders });
      });
      return () => unsub();
    }

    // Server-side prefix search across common fields that usually exist
    const s = debouncedSearch;
    const fields = ['name', 'lab.name', 'phone'];
    const merged = new Map();
    const unsubs = fields.map((field) => {
      const q = fsQuery(
        col,
        ...equalityWhere(appliedFilters),
        orderBy(field),
        where(field, '>=', s),
        where(field, '<=', s + '\uf8ff')
      );
      return onSnapshot(q, (snap) => {
        snap.docs.forEach((d) => merged.set(d.id, mapDocToRow(d)));
        setRowsFromDb(Array.from(merged.values()));
      });
    });
    return () => unsubs.forEach((u) => u && u());
  }, [appliedFilters, debouncedSearch]);

  // Sorting
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

  // Bulk actions (example)
  const BULK_UPDATES = { enable: { status: 'active' }, disable: { status: 'inactive' } };
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

  // Export CSV
  const handleExport = () => {
    const headers = ['Collector','Lab','Contact','Current Status','Status'];
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        (r.name ?? '').replace(/,/g,' '),
        (r.testCaseCounter ?? '').replace(/,/g,' '),
        (r.bookings ?? '').replace(/,/g,' '),
        (r.collectors ?? '').replace(/,/g,' '),
        (r.status ?? '').replace(/,/g,' ')
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `unassigned_collectors_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // Header UI
  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Unassigned Collector List' }];

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
          <Button style={{ height: "40px" }} variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>
          <Button style={{ height: "40px" }} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <Button
            style={{ height: "40px" }}
            startIcon={<FilterListIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={() => setOpen(true)}
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
      <th className="clu-th"><SortHeader label="Contact" path="bookings" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Current Status" path="collectors" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <CollectorListUnified
        variant=""
        title="Unassigned Collector List"
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onSearch={() => {}}
        onOpenAdvancedFilter={() => {}}
        onExport={() => {}}
        headerSlot={renderHeader}
        renderHead={renderHead}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td>{r.testCaseCounter}</td>
            <td>{r.bookings}</td>
            <td>{r.collectors}</td>
            <td>{r.status}</td>
            <td>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="View">
                  <IconButton size="small" color="primary" aria-label="view" onClick={() => navigate(`/collectors/view/${r.id}`)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" aria-label="delete" onClick={async () => {
                    if (!window.confirm('Delete this collector?')) return;
                    await deleteDoc(doc(db, 'collectors', r.id));
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
        onApply={() => { setAppliedFilters(values); setOpen(false); }}
        onReset={() => { setValues({}); setAppliedFilters({}); }}
      />
    </Box>
  );
}
