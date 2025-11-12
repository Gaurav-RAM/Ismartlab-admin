import React, { useMemo, useState, useEffect } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';

import { db } from '../../firebase';
import { collection, onSnapshot, query as fsQuery, orderBy } from 'firebase/firestore';

// Helper to get deeply nested props
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
      <span>{label}</span>
      <span className={iconCls} aria-hidden="true" />
    </button>
  );
}

export default function CollectorTestCaseList() {
  const navigate = useNavigate();
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [rowsFromDb, setRowsFromDb] = useState([]);

  // Listen to Firestore collector_test_cases and map correct fields
  useEffect(() => {
    const col = collection(db, 'collector_test_cases');
    // Order by testName if you want, or remove orderBy if not all docs have this
    const unsub = onSnapshot(col, (snapshot) => {
      setRowsFromDb(snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          testName: d.testName ?? '',
          testType: d.testType ?? '',
          testCode: d.testCode ?? '',
          lab: getByPath(d, 'details.lab') ?? '',
          category: d.category ?? '',
          status: getByPath(d, 'flags.active') ? 'Active' : 'Inactive',
        };
      }));
    });
    return unsub;
  }, []);

  const bulkActions = [
    { value: 'enable', label: 'Enable' },
    { value: 'disable', label: 'Disable' },
  ];
  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];
  const breadcrumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'TestCaseList' },
  ];

  const handleApply = () => {};
  const handleExport = () => {};

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
              style={{ width: '90px', height: '40px' }}
              displayEmpty
              value={action}
              onChange={(e) => setAction(e.target.value)}
              renderValue={(val) =>
                val ? bulkActions.find((a) => a.value === val)?.label ?? '' : 'No action'
              }
              aria-label="Bulk action"
            >
              <MenuItem value="">
                <em>No action</em>
              </MenuItem>
              {bulkActions.map((a) => (
                <MenuItem key={a.value} value={a.value}>
                  {a.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button style={{height:"40px"}} variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>
          <Button
            style={{ height: "40px" }}
            startIcon={<DownloadRoundedIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={handleExport}
          >
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
              renderValue={(val) =>
                !val ? 'All' : filterOptions.find((f) => f.value === val)?.label ?? 'All'
              }
              aria-label="Quick filter"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {filterOptions.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
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
          <Button style={{height:"40px"}} onClick={() => {navigate("testform")}} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>
          <Button
            style={{ height: "40px" }}
            startIcon={<FilterListIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={() => {/* open advanced filter drawer */}}
          >
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // Use Firestore rows for table
  const baseRows = useMemo(() => rowsFromDb, [rowsFromDb]);

  // Sorting state
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  // Apply sorting
  const rows = useMemo(() => {
    if (!sortBy || !sortDir) return baseRows.slice();
    const copy = baseRows.slice();
    copy.sort((a, b) => {
      const av = getByPath(a, sortBy);
      const bv = getByPath(b, sortBy);
      const A = av == null ? '' : av;
      const B = bv == null ? '' : bv;
      if (A < B) return sortDir === 'asc' ? -1 : 1;
      if (A > B) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [baseRows, sortBy, sortDir]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const toggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleAllOnPage = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) rows.forEach((r) => next.add(r.id));
      else rows.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  const onView = (row) => {
    console.log('view', row);
  };
  const onDelete = (row) => {
    console.log('delete', row);
  };

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th">
        <SortHeader label="Test Name" path="testName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Type" path="testType" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Code" path="testCode" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Lab" path="lab" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Category" path="category" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th>Action</th>
    </tr>
  );

  return (
    <CollectorListUnified
      variant=""
      title="Collector Test Case List"
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
          <td>{r.testName}</td>
          <td>{r.testType}</td>
          <td>{r.testCode}</td>
          <td>{r.lab}</td>
          <td>{r.category}</td>
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
  );
}
