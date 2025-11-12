// src/pages/labs/CollectorLab.jsx
import React, { useState, useMemo, useEffect } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
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
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'; // Unsorted

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

import { AdvancedFilterDrawer } from "../../components/AdvancedFilter";

// helper to read nested props like "collector.name"
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };

  let icon = <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.7 }}/>; // Default unsorted
  if (sortBy === path) {
    icon =
      sortDir === 'asc'
        ? <ArrowUpwardIcon fontSize="small" sx={{ color: '#fff' }}/>
        : <ArrowDownwardIcon fontSize="small" sx={{ color: '#fff' }}/>;
  }

  return (
    <button
      className="clu-thbtn"
      onClick={next}
      aria-label={`Sort by ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: "inherit"
      }}
    >
      <span>{label}</span>
      {icon}
    </button>
  );
}

// Map Firestore doc -> table row using your schema
const mapDocToRow = (docSnap) => {
  const d = docSnap.data();
  const primaryMember = Array.isArray(d.members) && d.members.length ? d.members[0] : null;
  return {
    id: docSnap.id,
    dateTime: d.dateTime?.toDate ? d.dateTime.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null),
    customer: d.customer?.name ?? '',
    lab: d.lab?.name ?? '',
    collector: d.collector?.name ?? primaryMember?.name ?? '',
    testCase: d.testPackage ?? d.testType ?? '',
    totalAmount: typeof d.totalAmount === 'number' ? d.totalAmount : 0,
    paymentStatus: d.paymentStatus ?? 'Pending',
    status: d.status ?? 'Pending',
  };
};

const fmtDate = (dt) =>
  dt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(dt) : '-';

export default function Appointments() {
  const navigate = useNavigate();

  // header UI state
  const [action, setAction] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // debounce search for Firestore query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(id);
  }, [searchText]);

  // Advanced Filter drawer state
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({});
  const [appliedFilters, setAppliedFilters] = React.useState({});

  const options = {
    collectors: [{ value: 'c1', label: 'Collector 1' }],
    labs: [{ value: 'l1', label: 'Lab 1' }],
    tests: [{ value: 't1', label: 'CBC' }],
    paymentStatus: [{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }],
    status: [{ value: 'active', label: 'Active' }],
    submissionStatus: [{ value: 'submitted', label: 'Submitted' }, { value: 'pending', label: 'Pending' }],
  };

  const [rowsFromDb, setRowsFromDb] = useState([]);

  const buildConstraints = (f, search) => {
    const hasSearch = search && search.length >= 2;
    const c = [];

    if (hasSearch) {
      const term = search.toLowerCase();
      c.push(orderBy('customer.searchName'));
      c.push(where('customer.searchName', '>=', term));
      c.push(where('customer.searchName', '<=', term + '\uf8ff'));
    } else {
      c.push(orderBy('dateTime', 'desc'));
    }

    if (f.collector) c.push(where('collector.id', '==', f.collector));
    if (f.lab) c.push(where('lab.id', '==', f.lab));
    if (f.test) c.push(where('testId', '==', f.test));
    if (f.payment) c.push(where('paymentStatus', '==', f.payment));
    if (f.status) c.push(where('status', '==', f.status));
    if (f.submission) c.push(where('submissionStatus', '==', f.submission));

    return c;
  };

  useEffect(() => {
    const col = collection(db, 'appointments');
    const q = fsQuery(col, ...buildConstraints(appliedFilters, debouncedSearch));
    const unsub = onSnapshot(q, (snap) => {
      setRowsFromDb(snap.docs.map(mapDocToRow));
    });
    return () => unsub();
  }, [appliedFilters, debouncedSearch]);

  const bulkActions = [
    { value: 'enable', label: 'Enable' },
    { value: 'disable', label: 'Disable' },
  ];
  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];
  const breadcrumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'Appointments' },
  ];

  // Bulk update via batched writes
  const BULK_UPDATES = {
    enable:  { status: 'Completed' },
    disable: { status: 'Cancelled' },
  };

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const handleApply = async () => {
    if (!action) return alert('Select an action first.');
    if (selectedIds.size === 0) return alert('Select at least one row.');
    const updates = BULK_UPDATES[action];
    if (!updates) return alert('Unknown action.');

    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, 'appointments', id), updates);
      });
      await batch.commit();
      setAction('');
      setSelectedIds(new Set());
      alert('Bulk update applied.');
    } catch (err) {
      console.error(err);
      alert('Failed to apply bulk update.');
    }
  };

  const handleExport = () => {
    const headers = [
      'ID','DateTime','Customer','Lab','Collector','Test Case','Total Amount','Payment Status','Status'
    ];
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        r.id,
        r.dateTime ? new Date(r.dateTime).toISOString() : '',
        (r.customer ?? '').replace(/,/g, ' '),
        (r.lab ?? '').replace(/,/g, ' '),
        (r.collector ?? '').replace(/,/g, ' '),
        (r.testCase ?? '').replace(/,/g, ' '),
        r.totalAmount ?? '',
        r.paymentStatus ?? '',
        r.status ?? ''
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onOpen = () => setOpen(true);
  const handleApplyFilters = () => {
    setAppliedFilters(values);
    setOpen(false);
  };
  const handleResetFilters = () => {
    setValues({});
    setAppliedFilters({});
  };

  const baseRows = useMemo(() => rowsFromDb, [rowsFromDb]);

  const afterQuickFilter = useMemo(() => {
    if (!quickFilter) return baseRows;
    return baseRows.filter(r => (r.status || '').toLowerCase() === quickFilter.toLowerCase());
  }, [baseRows, quickFilter]);

  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  const rows = useMemo(() => {
    const list = afterQuickFilter.slice();
    if (!sortBy || !sortDir) return list;
    list.sort((a, b) => {
      const av = getByPath(a, sortBy);
      const bv = getByPath(b, sortBy);
      const A = av == null ? '' : av;
      const B = bv == null ? '' : bv;
      const aVal = A instanceof Date ? A.getTime() : A;
      const bVal = B instanceof Date ? B.getTime() : B;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [afterQuickFilter, sortBy, sortDir]);

  const onView = (row) => {
    navigate(`/appointments/view/${row.id}`);
  };
  const onDelete = async (row) => {
    if (window.confirm(`Are you sure you want to delete appointment ${row.id}?`)) {
      try {
        await deleteDoc(doc(db, 'appointments', row.id));
        console.log(`Appointment ${row.id} deleted`);
      } catch (error) {
        console.error('Failed to delete appointment:', error);
        alert('Failed to delete appointment.');
      }
    }
  };

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

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th">
        <SortHeader label="ID" path="id" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Date&Time" path="dateTime" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Customer" path="customer" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Lab" path="lab" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Collector" path="collector" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Test Case" path="testCase" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Total Amount" path="totalAmount" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Payment Status" path="paymentStatus" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">Action</th>
    </tr>
  );

  const renderLabHeader = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2.5 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((b, i) =>
            b.to ? (
              <Link key={i} component={RouterLink} underline="hover" to={b.to}>
                {b.label}
              </Link>
            ) : (
              <Typography key={i}>{b.label}</Typography>
            )
          )}
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              style={{ width: "90px", height: "40px" }}
              displayEmpty
              value={action}
              onChange={(e) => setAction(e.target.value)}
              renderValue={(val) => val ? (bulkActions.find(a => a.value === val)?.label ?? '') : 'No action'}
              aria-label="Bulk action"
            >
              <MenuItem value=""><em>No action</em></MenuItem>
              {bulkActions.map((a) => (
                <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
              ))}
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
          <FormControl size="small" sx={{ minWidth: 73 }}>
            <Select
              style={{ height: "40px" }}
              displayEmpty
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              renderValue={(val) => (!val ? 'All' : (filterOptions.find(f => f.value === val)?.label ?? 'All'))}
              aria-label="Quick filter"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {filterOptions.map((f) => (
                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            style={{ height: "40px" }}
            size="small"
            placeholder="search by customer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 320 }}
            aria-label="Search"
          />

          <Button style={{ height: "40px" }} onClick={() => { navigate("new"); }} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>

          <Button
            style={{ height: "40px" }}
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box>
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
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={(e) => toggleOne(r.id, e.target.checked)}
                />
              </td>
              <td>{r.id}</td>
              <td>{fmtDate(r.dateTime)}</td>
              <td>{r.customer}</td>
              <td>{r.lab}</td>
              <td>{r.collector}</td>
              <td>{r.testCase}</td>
              <td>{r.totalAmount}</td>
              <td>{r.paymentStatus}</td>
              <td>{r.status}</td>
              <td>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="View">
                    <IconButton size="small" color="primary" aria-label="view" onClick={() => onView(r)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" aria-label="delete" onClick={() => onDelete(r)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </td>
            </tr>
          )}
        />
      </Box>

      <AdvancedFilterDrawer
        open={open}
        onClose={() => setOpen(false)}
        values={values}
        setValues={setValues}
        options={options}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </Box>
  );
}
