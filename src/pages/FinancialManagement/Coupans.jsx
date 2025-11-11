// src/pages/labs/CollectorLab.jsx
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
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

// helper to read nested props like "coupon.code"
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

// styled-components SortHeader
const ThButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0;
  padding: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
`;

const SortIcon = styled.span`
  width: 10px;
  height: 12px;
  position: relative;
  display: inline-block;

  &::before,
  &::after {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
  }

  /* Up arrow */
  &::before {
    border-bottom: 6px solid
      ${({ $active, $dir }) =>
        $active && $dir === "asc" ? "#fff" : "rgba(255,255,255,0.45)"};
    margin-bottom: 2px;
  }

  /* Down arrow */
  &::after {
    border-top: 6px solid
      ${({ $active, $dir }) =>
        $active && $dir === "desc" ? "#fff" : "rgba(255,255,255,0.45)"};
  }
`;

function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  const active = sortBy === path;
  return (
    <ThButton onClick={next} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <SortIcon $active={active} $dir={sortDir} aria-hidden="true" />
    </ThButton>
  );
}

export default function Coupans() {
  const navigate = useNavigate();

  // local UI state for header controls
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('');

  // coupons data aligned to header columns
  const [coupons] = useState([
    { id: 'c1', code: 'SAVE10', lab: 'CollectorLab A', discountValue: '10%', startAt: '2025-11-01', endAt: '2025-12-31', status: 'Active' },
    { id: 'c2', code: 'NEW20',  lab: 'CollectorLab B', discountValue: '20%', startAt: '2025-10-15', endAt: '2025-11-30', status: 'Inactive' },
    { id: 'c3', code: 'FEST15', lab: 'CollectorLab A', discountValue: '15%', startAt: '2025-11-10', endAt: '2026-01-10', status: 'Active' },
    { id: 'c4', code: 'WELCOME5', lab: 'CollectorLab C', discountValue: '5%', startAt: '2025-09-01', endAt: '2025-12-01', status: 'Active' },
    { id: 'c5', code: 'LAB25', lab: 'CollectorLab B', discountValue: '25%', startAt: '2025-11-05', endAt: '2025-11-25', status: 'Inactive' },
  ]);

  const breadcrumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'Collector List' },
  ];

  const bulkActions = [
    { value: 'enable', label: 'Enable' },
    { value: 'disable', label: 'Disable' },
  ];

  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const handleApply = () => {
    // TODO: apply bulk action to selected rows
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
              style={{ width: "90px" }}
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

          <Button variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>

          <Button startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 73 }}>
            <Select
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

          <Button onClick={() => { navigate(""); }} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>

          <Button startIcon={<FilterListIcon />} variant="contained" color="error" size="small" onClick={() => {}}>
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // sorting state
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  // apply search / quick filter (basic demo)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter(c => {
      const statusOk = quickFilter ? c.status.toLowerCase() === quickFilter : true;
      const textOk = !q
        ? true
        : [c.code, c.lab, c.discountValue, c.startAt, c.endAt, c.status]
            .join(' ')
            .toLowerCase()
            .includes(q);
      return statusOk && textOk;
    });
  }, [coupons, query, quickFilter]);

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

  // selection state (checkbox column)
  const [selected, setSelected] = useState(() => new Set());
  const visibleIds = rows.map(r => r.id);
  const allOnPageSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));
  const toggleAllOnPage = (checked) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) visibleIds.forEach(id => next.add(id));
      else visibleIds.forEach(id => next.delete(id));
      return next;
    });
  };
  const toggleOne = (id, checked) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  // table head WITH checkbox column
  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input
          type="checkbox"
          checked={allOnPageSelected}
          onChange={(e) => toggleAllOnPage(e.target.checked)}
          aria-label="Select all on page"
        />
      </th>

      <th aria-sort={sortBy === "code" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
        <SortHeader label="Coupon Code" path="code" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>

      <th aria-sort={sortBy === "lab" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
        <SortHeader label="Lab" path="lab" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>

      <th aria-sort={sortBy === "discountValue" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
        <SortHeader label="Discount Value" path="discountValue" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>

      <th aria-sort={sortBy === "startAt" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
        <SortHeader label="Start At" path="startAt" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>

      <th aria-sort={sortBy === "endAt" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
        <SortHeader label="End At" path="endAt" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>

      <th aria-sort={sortBy === "status" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
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
          {/* row WITH checkbox cell */}
          <td style={{ width: 40 }}>
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={(e) => toggleOne(r.id, e.target.checked)}
              aria-label={`Select row ${r.code}`}
            />
          </td>

          <td>{r.code}</td>
          <td>{r.lab}</td>
          <td>{r.discountValue}</td>
          <td>{r.startAt}</td>
          <td>{r.endAt}</td>
          <td>{r.status}</td>
          <td>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View">
                <IconButton size="small" color="primary" aria-label="view" onClick={() => console.log('view', r)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" aria-label="delete" onClick={() => console.log('delete', r)}>
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
