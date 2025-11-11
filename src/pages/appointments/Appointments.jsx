// src/pages/labs/CollectorLab.jsx
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
import { collection, onSnapshot, query as fsQuery, orderBy } from 'firebase/firestore';

// helper to read nested props like "collector.name"
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  const iconCls = sortBy === path ? (sortDir === 'asc' ? 'clu-sort asc' : 'clu-sort desc') : 'clu-sort';
  return (
    <button className="clu-thbtn" onClick={next} aria-label={`Sort by ${label}`}>
      <span style={{ paddingRight: "6px"}}>{label}</span>
      <span className={iconCls} aria-hidden="true" />
    </button>
  );
}

// Map Firestore doc -> table row using your schema
const mapDocToRow = (doc) => {
  const d = doc.data();
  const primaryMember = Array.isArray(d.members) && d.members.length ? d.members[0] : null;
  return {
    id: doc.id,
    // Prefer 'dateTime'; fall back to 'createdAt' if needed
    dateTime: d.dateTime?.toDate ? d.dateTime.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null),
    customer: d.customer?.name ?? '',
    lab: d.lab?.name ?? '',
    // Your screenshot shows members[0]; use that as collector when dedicated collector not present
    collector: d.collector?.name ?? primaryMember?.name ?? '',
    testCase: d.testPackage ?? d.testType ?? '',
    totalAmount: typeof d.totalAmount === 'number' ? d.totalAmount : 0,
    paymentStatus: d.paymentStatus ?? 'Pending',
    status: d.status ?? 'Pending',
  };
};

const fmtDate = (dt) =>
  dt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(dt) : '-';

export default function CollectorTestCaseList() {
  const navigate = useNavigate();

  // local UI state for header controls
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('');

  // rows from Firestore
  const [rowsFromDb, setRowsFromDb] = useState([]);

  // subscribe to Firestore (realtime) - appointments ordered by dateTime
  useEffect(() => {
    const col = collection(db, 'appointments');
    const q = fsQuery(col, orderBy('dateTime', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRowsFromDb(snap.docs.map(mapDocToRow));
    });
    return () => unsub();
  }, []);

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
    { label: 'Collector List' },
  ];

  const handleApply = () => {
    // implement bulk action here
  };
  const handleExport = () => {
    // TODO: export current rows/filter
  };

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
              style={{ width: "90px",height:"40px" }}
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

          <Button style={{height:"40px" }} variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>

          <Button style={{height:"40px" }}  startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 73 }}>
            <Select
              style={{height:"40px" }} 
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
            style={{height:"40px" }} 
            size="small"
            placeholder="search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

          <Button style={{height:"40px" }}  onClick={() => { navigate("testform"); }} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>

          <Button style={{height:"40px" }}  startIcon={<FilterListIcon />} variant="contained" color="error" size="small" onClick={() => {}}>
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // use Firestore-backed rows as base
  const baseRows = useMemo(() => rowsFromDb, [rowsFromDb]);

  // search + quick status filter (client-side)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byQuery = !q
      ? baseRows
      : baseRows.filter(r =>
          r.id.toLowerCase().includes(q) ||
          (r.customer || '').toLowerCase().includes(q) ||
          (r.lab || '').toLowerCase().includes(q) ||
          (r.collector || '').toLowerCase().includes(q) ||
          (r.testCase || '').toLowerCase().includes(q) ||
          String(r.totalAmount).includes(q) ||
          (r.paymentStatus || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q)
        );
    if (!quickFilter) return byQuery;
    return byQuery.filter(r => (r.status || '').toLowerCase() === quickFilter.toLowerCase());
  }, [baseRows, query, quickFilter]);

  // sorting state
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  // apply sorting
  const rows = useMemo(() => {
    if (!sortBy || !sortDir) return filtered.slice();
    const copy = filtered.slice();
    copy.sort((a, b) => {
      const av = getByPath(a, sortBy);
      const bv = getByPath(b, sortBy);
      const A = av == null ? '' : av;
      const B = bv == null ? '' : bv;
      // If values are Date instances, compare by time
      const aVal = A instanceof Date ? A.getTime() : A;
      const bVal = B instanceof Date ? B.getTime() : B;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  const onView = (row) => {
    console.log('view', row);
  };
  const onDelete = (row) => {
    console.log('delete', row);
  };

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

  // table head aligned to row keys
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

  // HORIZONTAL SCROLL INSIDE THIS PAGE
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box sx={{ minWidth: 1100 }}>
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
                      <EditOutlinedIcon fontSize="small" />
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
    </Box>
  );
}
