// src/pages/labs/CollectorUnassignedList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from '@mui/icons-material/Add';
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
} from 'firebase/firestore';

import { AdvancedFilterDrawer } from '../../components/AdvancedFilter';

// helpers
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
const norm = (s) => (s ?? '').toString().trim();

// Sort header
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

// Map lab_sessions doc -> row
const mapDocToRow = (snap) => {
  const d = snap.data();
  const days = Array.isArray(d.days) ? d.days : [];
  // derive one display string from first enabled day; modify if you need to list all
  const first = days.find(x => x?.enabled) || days[0] || {};
  const dayLabel = first?.name ? `${first.name} (${first.start ?? ''}-${first.end ?? ''})` : '';
  return {
    id: snap.id,
    name: d.lab?.name ?? d.labName ?? d.name ?? '',      // Name column (lab)
    testCaseCounter: dayLabel,                            // Day column
    bookings: d.phone ?? '',                              // keep for export consistency
    collectors: '',                                       // not in this collection, keep placeholder
    status: d.status ?? '',                               // optional
    _labId: d.lab?.id ?? null,
  };
};

export default function CollectorUnassignedList() {
  const navigate = useNavigate();

  // search
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(norm(searchText)), 300);
    return () => clearTimeout(id);
  }, [searchText]);

  // drawer
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  // data
  const [rowsFromDb, setRowsFromDb] = useState([]);
  const [options, setOptions] = useState({ labs: [] });

  // equality conditions for sessions (optional lab filter)
  const equalityWhere = (f) => {
    const parts = [];
    if (f.lab) parts.push(where('lab.id', '==', f.lab));
    return parts;
  };

  // subscribe to lab_sessions
  useEffect(() => {
    const col = collection(db, 'lab_sessions');

    if (!debouncedSearch) {
      const q = fsQuery(col, ...equalityWhere(appliedFilters), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const rows = snap.docs.map(mapDocToRow);
        setRowsFromDb(rows);
        // build lab options
        const uniq = (arr) => Array.from(new Map(arr.filter(Boolean).map(x => [x.value, x])).values());
        const labs = uniq(snap.docs.map(d => {
          const x = d.data();
          return x.lab?.id ? { value: x.lab.id, label: x.lab.name ?? x.lab.id } : null;
        }));
        setOptions({ labs });
      });
      return () => unsub();
    }

    // prefix search across lab name and first day name (if stored redundantly)
    const s = debouncedSearch.toLowerCase();
    const merged = new Map();

    const q1 = fsQuery(
      col,
      ...equalityWhere(appliedFilters),
      orderBy('lab.name'),
      where('lab.name', '>=', s),
      where('lab.name', '<=', s + '\uf8ff')
    );

    // If you also indexed a flat dayNameLower field on the document, you can add it here similarly

    const u1 = onSnapshot(q1, (snap) => {
      snap.docs.forEach(d => merged.set(d.id, mapDocToRow(d)));
      setRowsFromDb(Array.from(merged.values()));
    });

    return () => { u1 && u1(); };
  }, [appliedFilters, debouncedSearch]);

  // sort
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

  // export
  const handleExport = () => {
    const headers = ['Lab','Day','Contact','Current Status','Status'];
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
    a.href = url; a.download = `lab_sessions_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // header
  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Lab Sessions' }];
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
          <Button style={{ height: "40px" }} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            style={{ height: "40px" }}
            size="small"
            placeholder="search by lab name…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ minWidth: 320 }}
            aria-label="Search"
          />
          <Button style={{height:"40px"}} onClick={() => navigate("session")} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>
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
  <tr className="clu-head-row">
    <th className="clu-th" style={{ width:'42%' }}>
      <SortHeader label="Name" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
    </th>
    <th className="clu-th" style={{ width:'48%' }}>
      <SortHeader label="Day" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
    </th>
    <th style={{ width:'10%' }}>Action</th>
  </tr>
);

  return (
    <Box sx={{ width: '100%' }}>
      <CollectorListUnified
        variant=""
        title="Lab Sessions"
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onSearch={() => {}}
        onOpenAdvancedFilter={() => setOpen(true)}
        onExport={handleExport}
        headerSlot={renderHeader}
        renderHead={renderHead}
        renderRow={(r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td>{r.testCaseCounter}</td>
            <td>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton size="small" color="primary" aria-label="edit" onClick={() => navigate(`session/${r.id}`)}>
                    <EditOutlinedIcon fontSize="small" />
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
        preset="labSession"
        title="Advanced Filter"
        values={values}
        setValues={setValues}
        options={{
          labs: options.labs,
          collectors: [],
          taxes: [],
          accreditations: [],
          paymentModes: [],
        }}
        onApply={() => { setAppliedFilters(values); setOpen(false); }}
        onReset={() => { setValues({}); setAppliedFilters({}); }}
      />
    </Box>
  );
}
