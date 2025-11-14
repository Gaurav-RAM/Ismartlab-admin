// src/pages/labs/CollectorLab.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
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
  getDoc,
  updateDoc,
} from 'firebase/firestore';

// helpers
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);
const norm = (s) => (s ?? '').toString().trim().toLowerCase();

// sort header
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

// map a document row after join
const composeRow = (docSnap, collector) => {
  const d = docSnap.data();
  const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : null;
  return {
    id: docSnap.id,
    // columns aligned to screenshot: Collector, Document, Is Verified, Status, Action
    collectorName: collector?.name ?? '—',
    collectorEmail: collector?.email ?? '',
    collectorAvatar: collector?.photoURL ?? '',
    documentLabel: d.documentType === 'id'
      ? 'Government-issued ID Proof (Passport, Driver’s License, etc)'
      : (d.documentType === 'contract'
          ? 'Signed Contract/Agreement'
          : (d.documentType === 'education'
              ? 'Educational Certificates'
              : (d.fileName ?? 'Document'))),
    isVerified: !!d.isVerified,
    isActive: !!d.isActive,
    // extras
    fileName: d.fileName ?? '',
    documentType: d.documentType ?? '',
    fileSize: d.fileSize ?? 0,
    fileType: d.fileType ?? '',
    createdAtText: createdAt ? createdAt.toLocaleString() : '',
    collectorId: d.collectorId ?? '',
  };
};

export default function CollectorLab() {
  const navigate = useNavigate();

  // header state
  const [action, setAction] = useState('');
  const [quickFilter, setQuickFilter] = useState(''); // '', 'active', 'inactive', 'verified', 'unverified'
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(id);
  }, [searchText]);

  // backing docs and a small cache of collectors by id
  const [docSnaps, setDocSnaps] = useState([]); // array<DocSnapshot>
  const [collectorMap, setCollectorMap] = useState({}); // { [collectorId]: {name,email,photoURL} }
  const collectorCacheRef = useRef({});

  // quick equality filters
  const equalityWhere = () => {
    const parts = [];
    if (quickFilter === 'active') parts.push(where('isActive', '==', true));
    if (quickFilter === 'inactive') parts.push(where('isActive', '==', false));
    if (quickFilter === 'verified') parts.push(where('isVerified', '==', true));
    if (quickFilter === 'unverified') parts.push(where('isVerified', '==', false));
    return parts;
  };

  // load collectors by ids not in cache
  const warmCollectors = async (ids) => {
    const missing = ids.filter(id => id && !collectorCacheRef.current[id]);
    if (!missing.length) return;
    const entries = await Promise.all(missing.map(async (cid) => {
      try {
        const cs = await getDoc(doc(db, 'collectors', cid));
        const c = cs.exists() ? cs.data() : null;
        return [cid, c ? { name: c.name ?? '', email: c.email ?? '', photoURL: c.photoURL ?? '' } : { name: '', email: '', photoURL: '' }];
      } catch {
        return [cid, { name: '', email: '', photoURL: '' }];
      }
    }));
    const next = { ...collectorCacheRef.current };
    entries.forEach(([k, v]) => { next[k] = v; });
    collectorCacheRef.current = next;
    setCollectorMap(next);
  };

  // subscribe to collector_documents with server-side search where possible
  useEffect(() => {
    const col = collection(db, 'collector_documents');

    if (!debouncedSearch) {
      const q = fsQuery(col, ...equalityWhere(), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, async (snap) => {
        setDocSnaps(snap.docs);
        const ids = Array.from(new Set(snap.docs.map(d => d.data().collectorId).filter(Boolean)));
        await warmCollectors(ids);
      });
      return () => unsub();
    }

    // prefix search pattern per-field, then merge
    const term = norm(debouncedSearch);
    const fields = ['fileName', 'documentType', 'collectorId'];
    const merged = new Map();
    const unsubs = fields.map((field) => {
      const q = fsQuery(
        col,
        ...equalityWhere(),
        orderBy(field),
        where(field, '>=', term),
        where(field, '<=', term + '\uf8ff')
      );
      return onSnapshot(q, async (snap) => {
        snap.docs.forEach(d => merged.set(d.id, d));
        const docs = Array.from(merged.values());
        setDocSnaps(docs);
        const ids = Array.from(new Set(docs.map(d => d.data().collectorId).filter(Boolean)));
        await warmCollectors(ids);
      });
    });
    return () => unsubs.forEach(u => u && u());
  }, [quickFilter, debouncedSearch]);

  // compose rows with joined collector info and optional client contains on collector name/email
  const rows = useMemo(() => {
    const joined = docSnaps.map(s => composeRow(s, collectorMap[s.data().collectorId]));
    if (!debouncedSearch) return joined;
    const t = norm(debouncedSearch);
    return joined.filter(r =>
      (r.collectorName ?? '').toLowerCase().includes(t) ||
      (r.collectorEmail ?? '').toLowerCase().includes(t) ||
      (r.documentLabel ?? '').toLowerCase().includes(t) ||
      (r.fileName ?? '').toLowerCase().includes(t)
    );
  }, [docSnaps, collectorMap, debouncedSearch]);

  // sorting
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => { setSortBy(path); setSortDir(dir); };
  const sortedRows = useMemo(() => {
    const list = rows.slice();
    if (!sortBy || !sortDir) return list;
    list.sort((a, b) => {
      const A = getByPath(a, sortBy) ?? '';
      const B = getByPath(b, sortBy) ?? '';
      return sortDir === 'asc' ? (A > B ? 1 : A < B ? -1 : 0) : (A < B ? 1 : A > B ? -1 : 0);
    });
    return list;
  }, [rows, sortBy, sortDir]);

  // selection and bulk
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const allOnPageSelected = sortedRows.length > 0 && sortedRows.every(r => selectedIds.has(r.id));
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
      if (checked) sortedRows.forEach(r => next.add(r.id));
      else sortedRows.forEach(r => next.delete(r.id));
      return next;
    });
  };

  const BULK_UPDATES = { enable: { isActive: true }, disable: { isActive: false } };
  const handleApply = async () => {
    if (!action) return alert('Select an action first.');
    const updates = BULK_UPDATES[action];
    if (!updates) return alert('Unknown action.');
    try {
      const batch = writeBatch(db);
      Array.from(selectedIds).forEach(id => batch.update(doc(db, 'collector_documents', id), updates));
      await batch.commit();
      setAction('');
      setSelectedIds(new Set());
      alert('Bulk update applied.');
    } catch (e) {
      console.error(e);
      alert('Failed to apply bulk update.');
    }
  };

  // row toggles
  const toggleVerified = async (row) => {
    try { await updateDoc(doc(db, 'collector_documents', row.id), { isVerified: !row.isVerified }); }
    catch (e) { console.error(e); alert('Failed to update verification'); }
  };
  const toggleActive = async (row) => {
    try { await updateDoc(doc(db, 'collector_documents', row.id), { isActive: !row.isActive }); }
    catch (e) { console.error(e); alert('Failed to update status'); }
  };

  // export CSV
  const handleExport = () => {
    const headers = ['Collector','Email','Document','Is Verified','Status','Created','File','Type','Size','Collector ID'];
    const lines = [
      headers.join(','),
      ...sortedRows.map(r => [
        (r.collectorName ?? '').replace(/,/g,' '),
        (r.collectorEmail ?? '').replace(/,/g,' '),
        (r.documentLabel ?? '').replace(/,/g,' '),
        r.isVerified ? 'Yes' : 'No',
        r.isActive ? 'Active' : 'Inactive',
        (r.createdAtText ?? '').replace(/,/g,' '),
        (r.fileName ?? '').replace(/,/g,' '),
        (r.documentType ?? '').replace(/,/g,' '),
        r.fileSize ?? 0,
        (r.collectorId ?? '').replace(/,/g,' ')
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collector_documents_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // header UI
  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Collector Documents' }];
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
          <Button style={{height:"40px"}} variant="contained" size="small" disabled={!action || selectedIds.size === 0} onClick={handleApply}>
            Apply
          </Button>
          <Button style={{height:"40px"}} startIcon={<DownloadRoundedIcon />} variant="contained" color="error" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              style={{ height:"40px" }}
              displayEmpty
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              renderValue={(val) => (!val ? 'All documents' : val[0].toUpperCase() + val.slice(1))}
              aria-label="Quick filter"
            >
              <MenuItem value=""><em>All documents</em></MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="unverified">Unverified</MenuItem>
            </Select>
          </FormControl>
          <TextField
            style={{height:"40px"}}
            size="small"
            placeholder="Search by file name, type, or collector..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ minWidth: 340 }}
            aria-label="Search"
          />
          <Button style={{height:"40px"}} onClick={() => navigate("form")} startIcon={<AddIcon />} variant="contained" size="small">
            New
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // head styled for screenshot columns
  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th"><SortHeader label="Collector" path="collectorName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Document" path="documentLabel" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Is Verified" path="isVerified" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="isActive" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

  return (
    <CollectorListUnified
      variant=""
      title="Collector Documents"
      rows={sortedRows}
      total={sortedRows.length}
      page={1}
      pageSize={10}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      onSearch={() => {}}
      onOpenAdvancedFilter={() => {}}
      onExport={handleExport}
      headerSlot={renderHeader}
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
          <td>
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Avatar src={r.collectorAvatar} sx={{ width: 32, height: 32 }}>{r.collectorName?.[0] ?? ''}</Avatar>
              <Box>
                <div>{r.collectorName}</div>
                <div style={{ fontSize:12, color:'#666' }}>{r.collectorEmail}</div>
              </Box>
            </Box>
          </td>
          <td>{r.documentLabel}</td>
          <td>
            <Switch size="small" checked={r.isVerified} onChange={() => toggleVerified(r)} />
          </td>
          <td>
            <Switch size="small" checked={r.isActive} onChange={() => toggleActive(r)} />
          </td>
          <td>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Edit">
                <IconButton size="small" color="primary" aria-label="edit" onClick={() => navigate(`/collectors/documents/edit/${r.id}`)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" aria-label="delete" onClick={async () => {
                  if (!window.confirm('Delete this document?')) return;
                  await deleteDoc(doc(db, 'collector_documents', r.id));
                }}>
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
