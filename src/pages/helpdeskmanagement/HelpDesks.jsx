import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

const tableStyles = { width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', boxShadow: '0 2px 8px rgba(34,34,34,0.06)', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' };
const thStyles = { background: '#5469d4', color: '#fff', fontWeight: 'bold', padding: '14px 12px', fontSize: '16px', textAlign: 'left', border: 'none' };
const tdStyles = { padding: '11px 12px', color: '#86889a', fontSize: '15px', border: 'none' };
const statusBadgeStyles = (status) => ({
  background: status === 'Closed' ? '#ffd4d4' : '#d4f3dc',
  color: status === 'Closed' ? '#e04b3d' : '#159b37',
  borderRadius: '7px',
  padding: '1px 12px',
  fontWeight: 'bold',
  fontSize: '14px',
  display: 'inline-block',
});

function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  let icon = <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.7 }} />;
  if (sortBy === path) {
    icon =
      sortDir === 'asc' ? (
        <ArrowUpwardIcon fontSize="small" sx={{ color: '#fff' }} />
      ) : (
        <ArrowDownwardIcon fontSize="small" sx={{ color: '#fff' }} />
      );
  }
  return (
    <button
      onClick={next}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
      }}
    >
      <span>{label}</span>
      {icon}
    </button>
  );
}

export default function HelpDesks() {
  const navigate = useNavigate();

  const [action, setAction] = useState('');
  const [rows, setRows] = useState([]);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Selection state for checkboxes (use Set for O(1) membership)
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    const q = query(collection(db, 'helpdeskTickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((snapDoc) => {
          const d = snapDoc.data();
          const ts = d.createdAt;
          const jsDate = ts && typeof ts.toDate === 'function' ? ts.toDate() : null;
          const status =
            d.status && String(d.status).toLowerCase() === 'closed' ? 'Closed' : 'Open';
          return {
            id: snapDoc.id,
            subject: d.subject ?? '',
            dateTime: jsDate ? jsDate.toLocaleString() : '',
            status,
          };
        });
        setRows(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err?.message || 'Failed to load tickets');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const onView = (row) => {
    navigate(`/helpdesks/view/${row.id}`);
  };

  const onConfirm = async (row) => {
    try {
      setUpdatingId(row.id);
      await updateDoc(doc(db, 'helpdeskTickets', row.id), { status: 'Closed' });
      // onSnapshot will refresh the table
    } catch (e) {
      setError(e?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  const sortedRows = useMemo(() => {
    if (!sortBy || !sortDir) return rows;
    const sorted = [...rows].sort((a, b) => {
      const A = a[sortBy];
      const B = b[sortBy];
      if (sortDir === 'asc') return A > B ? 1 : A < B ? -1 : 0;
      return A < B ? 1 : A > B ? -1 : 0;
    });
    return sorted;
  }, [rows, sortBy, sortDir]);

  // Selection model derived from visible rows
  const visibleIds = useMemo(() => sortedRows.map((r) => r.id), [sortedRows]);
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someChecked = visibleIds.some((id) => selected.has(id));
  const indeterminate = someChecked && !allChecked;

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked) => {
    setSelected((prev) => {
      if (checked) return new Set([...prev, ...visibleIds]);
      const next = new Set(prev);
      visibleIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Helpdesks' }];

  const renderHeader = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((b, i) =>
            b.to ? (
              <Link key={i} component={RouterLink} underline="hover" to={b.to}>
                {b.label}
              </Link>
            ) : (
              <Typography key={i} color="textPrimary">
                {b.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small">
            <Select
              style={{ width: '140px', height: '40px' }}
              displayEmpty
              value={action}
              onChange={(e) => setAction(e.target.value)}
              aria-label="No action"
              renderValue={(val) => {
                if (!val) return <span style={{ color: '#b4b8d3' }}>No action</span>;
                return val.charAt(0).toUpperCase() + val.slice(1);
              }}
            >
              <MenuItem value="" disabled>
                <em>Select status</em>
              </MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            disabled={!action}
            sx={{
              background: action ? '#5469d4' : '#e8eaf6',
              color: action ? '#fff' : '#b4b8d3',
              fontWeight: 'bold',
              height: '40px',
            }}
          >
            Apply
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            style={{ height: '40px' }}
            onClick={() => {
              navigate('hform');
            }}
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
          >
            New
          </Button>
        </Box>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 3 }}>
        {renderHeader()}
        <Typography sx={{ color: '#86889a', mt: 2 }}>Loading…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {renderHeader()}
      {error && (
        <Typography sx={{ color: '#e04b3d', mb: 1 }}>
          {error}
        </Typography>
      )}
      <table style={tableStyles}>
        <thead>
          <tr>
            <th style={{ ...thStyles, width: '60px' }}>
              <Checkbox
                size="small"
                indeterminate={indeterminate}
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
                inputProps={{ 'aria-label': 'select all visible' }}
              />
            </th>
            <th style={thStyles}>ID</th>
            <th style={thStyles}>
              <SortHeader
                label="Subject"
                path="subject"
                sortBy={sortBy}
                sortDir={sortDir}
                onChange={onSortChange}
              />
            </th>
            <th style={thStyles}>
              <SortHeader
                label="Date & Time"
                path="dateTime"
                sortBy={sortBy}
                sortDir={sortDir}
                onChange={onSortChange}
              />
            </th>
            <th style={thStyles}>Status</th>
            <th style={thStyles}>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{ textAlign: 'center', color: '#bbb', padding: '32px 0' }}
              >
                No Data Found
              </td>
            </tr>
          ) : (
            sortedRows.map((r) => (
              <tr key={r.id}>
                <td style={tdStyles}>
                  <Checkbox
                    size="small"
                    checked={selected.has(r.id)}
                    onChange={() => toggleRow(r.id)}
                    inputProps={{ 'aria-label': `select ${r.id}` }}
                  />
                </td>
                <td style={tdStyles}>#{r.id}</td>
                <td style={tdStyles}>{r.subject}</td>
                <td style={tdStyles}>{r.dateTime}</td>
                <td style={tdStyles}>
                  <span style={statusBadgeStyles(r.status)}>{r.status}</span>
                </td>
                <td style={tdStyles}>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="view"
                        onClick={() => onView(r)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {r.status !== 'Closed' && (
                      <Tooltip title="Mark As Closed">
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onConfirm(r)}
                            disabled={updatingId === r.id}
                          >
                            <span style={{ color: '#159b37', fontSize: '20px' }}>
                              &#10003;
                            </span>
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
        }}
      >
        <Typography>
          Show
          <Select size="small" defaultValue={5} sx={{ mx: 1, minWidth: 54 }}>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
          </Select>
          entries
        </Typography>
        <Box>
          <Button variant="outlined" size="small" disabled>
            Previous
          </Button>
          <Button variant="outlined" size="small">
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
