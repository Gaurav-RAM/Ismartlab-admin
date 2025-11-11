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
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';

// helper to read nested props like "collector.name"
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

// tiny formatters for display
const fmtPct = (n) => (n == null ? '' : `${Number(n).toFixed(1)}%`);
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '';

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

export default function TopBookTestCase() {
  const navigate = useNavigate();

  // local UI state for header controls
  const [query, setQuery] = useState('');

  // Sample data aligned to table headers
  // Replace with API results that expose these fields for seamless rendering
  const [labs] = useState([
    {
      id: 't1',
      testCase: 'Complete Blood Count',
      testCategory: 'Hematology',
      bookingCount: 128,
      bookingPercentage: 24.6,
      lastBookingDate: '2025-11-09',
    },
    {
      id: 't2',
      testCase: 'Lipid Profile',
      testCategory: 'Biochemistry',
      bookingCount: 93,
      bookingPercentage: 17.9,
      lastBookingDate: '2025-11-10',
    },
  ]);

  const breadcrumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'Top Booked Test Case' },
  ];

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
          <Button
            style={{ height: '40px' }}
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
          <TextField
            style={{ height: '40px' }}
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
        </Box>
      </Box>
    </Box>
  );

  // rows for table mapped 1:1 with headers
  const baseRows = useMemo(
    () =>
      labs.map((l) => ({
        id: l.id,
        testCase: l.testCase,
        testCategory: l.testCategory,
        bookingCount: l.bookingCount,
        bookingPercentage: l.bookingPercentage,
        lastBookingDate: l.lastBookingDate,
      })),
    [labs]
  );

  // client-side filtering on testCase/testCategory text
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseRows;
    return baseRows.filter(
      (r) =>
        r.testCase.toLowerCase().includes(q) ||
        (r.testCategory || '').toLowerCase().includes(q)
    );
  }, [baseRows, query]);

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
      if (A < B) return sortDir === 'asc' ? -1 : 1;
      if (A > B) return sortDir === 'asc' ? 1 : -1;
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

  // table head aligned to data keys
  const renderHead = () => (
    <tr>
      <th className="clu-th">
        <SortHeader label="Test Case" path="testCase" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Test Category" path="testCategory" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Booking Counts" path="bookingCount" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader
          label="Booking Percentage"
          path="bookingPercentage"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>
      <th className="clu-th">
        <SortHeader
          label="Last Booking Date"
          path="lastBookingDate"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>
      <th className="clu-th">{/* actions column header, optional */}</th>
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
          <td>{r.testCase}</td>
          <td>{r.testCategory}</td>
          <td>{r.bookingCount}</td>
          <td>{fmtPct(r.bookingPercentage)}</td>
          <td>{fmtDate(r.lastBookingDate)}</td>
                 </tr>
      )}
    />
  );
}
