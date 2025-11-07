// src/pages/labs/CollectorLab.jsx
import React, { useState, useMemo } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useNavigate } from 'react-router-dom';


// helper to read nested props like "collector.name"
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
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



// sort header with toggle
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

export default function CollectorLab() {
    const navigate = useNavigate();
  // local UI state for header controls
const [action, setAction] = useState('');
const [query, setQuery] = useState('');
const [quickFilter, setQuickFilter] = useState('');
  const [labs] = useState([
    { id: 'l1', name: 'CollectorLab A', test_count: 12, booking_count: 5, collector_count: 3, status: 'Active' },
    { id: 'l2', name: 'CollectorLab B', test_count: 7,  booking_count: 2, collector_count: 1, status: 'Inactive' },
  ]);

  
// optional data for dropdowns/breadcrumbs
const bulkActions = [
  { value: 'enable', label: 'Enable' },
  { value: 'disable', label: 'Disable' },
];
const filterOptions = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const breadcrumbs = [
  { label: 'Dashboard', to: '/' },
  { label: 'Labs' },
];

// handlers
const handleApply = () => {
  // TODO: apply bulk action with `action` and your `selectedIds`
};
const handleExport = () => {
  // TODO: export current rows/filter
};

// headerSlot function
const renderLabHeader = () => (
  <Box sx={{ width: '100%' }}>
    {/* Breadcrumbs */}
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

    {/* Toolbar: left cluster + right cluster */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {/* Left cluster: No action + Apply + Export */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
          style={{width:"90px"}}
            displayEmpty
            value={action}
            onChange={(e) => setAction(e.target.value)}
            renderValue={(val) =>
              val ? (bulkActions.find(a => a.value === val)?.label ?? '') : 'No action'
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

        <Button variant="contained" size="small" disabled={!action} onClick={handleApply}>
          Apply
        </Button>

        <Button
          startIcon={<DownloadRoundedIcon />}
          variant="contained"
          color="error"
          size="small"
          onClick={handleExport}
        >
          Export
        </Button>
      </Box>

      {/* Right cluster: All filter + search + New + Advanced Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 73 }}>
          <Select
            displayEmpty
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            renderValue={(val) => {
              if (!val) return 'All';
              return filterOptions.find(f => f.value === val)?.label ?? 'All';
            }}
            aria-label="Quick filter"
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
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

        <Button onClick={() => {navigate("form")}} startIcon={<AddIcon />} variant="contained" size="small">
          New
        </Button>

        <Button
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

  // base rows for variant="lab"
  const baseRows = useMemo(
    () => labs.map(l => ({
      id: l.id,
      name: l.name,
      testCaseCounter: l.test_count,
      bookings: l.booking_count,
      collectors: l.collector_count,
      status: l.status,
    })),
    [labs]
  );

  // sorting state
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  // apply sorting
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

  // selection state
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

  const onView = (row) => {
    // implement your view logic
    console.log('view', row);
  };

  const onDelete = (row) => {
    // implement your delete logic
    console.log('delete', row);
  };

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th">
        <SortHeader label="Name" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Test Case Counter" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        Bookings
        {/* <SortHeader label="Bookings" path="bookings" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /> */}
      </th>
      <th className="clu-th">
        Collectors
        {/* <SortHeader label="Collectors" path="collectors" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /> */}
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
      title="CollectorLab Labs"
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
      // No renderActions prop needed since we render actions inside renderRow
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
                <IconButton size="small" color="primary" aria-label="view" onClick={() => onView(r)}>
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
               <Tooltip title="View">
                <IconButton size="small" color="primary" aria-label="view" onClick={() => onView(r)}>
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
  );
}
