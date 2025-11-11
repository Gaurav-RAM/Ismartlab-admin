// src/pages/labs/CollectorLab.jsx
import React, { useState, useMemo } from 'react';
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
      <span>{label}</span>
      <span className={iconCls} aria-hidden="true" />
    </button>
  );
}

export default function CollectorTestCaseList() {
  const navigate = useNavigate();

  // local UI state for header controls
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('');

  const [labs] = useState([
    { id: 'l1', name: 'CollectorLab A', test_count: 12, booking_count: 5, collector_count: 3, status: 'Active' },
    { id: 'l2', name: 'CollectorLab B', test_count: 7,  booking_count: 2, collector_count: 1, status: 'Inactive' },
  ]);

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
    { label: 'Pending Collector List' },
  ];

  const handleApply = () => {
    // No selection column anymore; implement bulk action via filters or remove this button
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

          <Button style={{height:"40px"}} variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>

          <Button style={{height:"40px"}} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  

          <TextField
          style={{height:"40px"}}
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

          <Button style={{height:"40px"}} startIcon={<FilterListIcon />} variant="contained" color="error" size="small" onClick={() => {}}>
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // rows for table
  const baseRows = useMemo(
    () =>
      labs.map(l => ({
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

  const onView = (row) => {
    console.log('view', row);
  };
  const onDelete = (row) => {
    console.log('delete', row);
  };

  // table head WITHOUT checkbox column
  const renderHead = () => (
    <tr>
      <th className="clu-th">
        <SortHeader label="Collector" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Lab" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Contact Number" path="bookings" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Current Status" path="collectors" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
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
          {/* row WITHOUT checkbox cell */}
          <td>{r.name}</td>
          <td>{r.testCaseCounter}</td>
          <td>{r.bookings}</td>
          <td>{r.collectors}</td>
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
