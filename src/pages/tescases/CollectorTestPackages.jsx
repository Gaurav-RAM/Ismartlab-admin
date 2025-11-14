// src/pages/labs/CollectorTestPackages.jsx
import React, { useState, useMemo, useEffect } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
import Grid from '@mui/material/Grid';
import { Link as RouterLink } from 'react-router-dom';
import { AdvancedFilterDrawer } from '../../components/AdvancedFilter';
import { db } from '../../firebase';
import {collection, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';

// Safe deep getter
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

// Parse numbers from strings like "10%", "$8.00", etc.
const toNum = (x) => {
  const n = typeof x === 'string' ? Number(x.replace(/[^0-9.-]/g, '')) : Number(x);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Derive discount values from doc
const deriveDiscount = (d) => {
  const price = Math.max(0, Math.round(toNum(d.price)));
  // final price precedence if present
  const finalField = d.discountPrice ?? d.discountedPrice;
  if (finalField != null) {
    const final = Math.max(0, Math.round(toNum(finalField)));
    const percent = price > 0 ? Math.round((1 - final / price) * 100) : 0;
    return { price, final, percent };
  }
  // percent-based
  const pctRaw = d.discountPercent ?? d.discount ?? d.discount_percentage;
  if (pctRaw != null) {
    const pct = clamp(toNum(pctRaw), 0, 100);
    const final = Math.max(0, Math.round(price * (1 - pct / 100)));
    return { price, final, percent: pct };
  }
  // amount-based
  const amtRaw = d.discountAmount ?? d.discount_flat ?? d.discountValue;
  if (amtRaw != null) {
    const amt = Math.max(0, toNum(amtRaw));
    const final = Math.max(0, Math.round(price - amt));
    const pct = price > 0 ? Math.round((amt / price) * 100) : 0;
    return { price, final, percent: pct };
  }
  return { price, final: price, percent: 0 };
};

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

const mapDocToRow = (docSnap) => {
  const d = docSnap.data();
  const { price, final, percent } = deriveDiscount(d);
  const pkgCategoryId = d.category?.id ?? d.categoryId ?? d.pkgCategoryId ?? '';
  const labIds = Array.isArray(d.labs)
    ? d.labs.map(x => (typeof x === 'string' ? x : (x.id ?? x.value ?? ''))).filter(Boolean)
    : (Array.isArray(d.labIds) ? d.labIds : []);
  const homeCollection = Boolean(d.flags?.homeCollection ?? d.homeCollection ?? false);
  const featured = Boolean(d.flags?.featured ?? d.featured ?? false);
  return {
    id: docSnap.id,
    name: d.name ?? '—',
    labsCounter: d.labsCount ?? (Array.isArray(labIds) ? labIds.length : 0),
    testCaseCounter: d.testCount ?? d.testsCount ?? 0,
    price,
    discountPrice: final,
    discountPercent: percent,
    status: d.status ?? 'Inactive',
    _pkgCategoryId: pkgCategoryId,
    _labIds: labIds,
    _homeCollection: homeCollection,
    _featured: featured,
  };
};

export default function CollectorTestPackages() {
  const navigate = useNavigate();

  const bulkActionsOne = [
  { value: 'status',            label: 'Status' },
  { value: 'delete',            label: 'Delete' },
  { value: 'restore',           label: 'Restore' },
  { value: 'permanent_delete',  label: 'Permanent Delete' },
];
  const [openAdv, setOpenAdv] = useState(false);
  const [advValues, setAdvValues] = useState({
    pkgCategory: '',
    package: '',
    lab: '',
    status: '',
    priceMin: '',
    priceMax: '',
    homeCollection: '',
    featured: '',
    discountMin: '',
    discountMax: '',
    labsMin: '',
    testsMin: '',
  });
  const [appliedAdv, setAppliedAdv] = useState({});
  const onApplyAdv = () => { setAppliedAdv(advValues); setOpenAdv(false); };
  const onResetAdv = () => { setAdvValues({}); setAppliedAdv({}); };

  // UI state
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState(''); // status

const [statusValue, setStatusValue] = useState('Active');

  // DB rows
  const [rowsFromDb, setRowsFromDb] = useState([]);
  useEffect(() => {
    const col = collection(db, 'collector_packages');
    const unsub = onSnapshot(col, (snapshot) => {
      setRowsFromDb(snapshot.docs.map(mapDocToRow));
    });
    return unsub;
  }, []);

  // Sorting controls
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  // Static UI options
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
    { label: 'Packages' },
  ];

const handleApply = async () => {
  if (!action || selectedIds.size === 0) return; 
  try {
    if (action === 'permanent_delete') {
      await Promise.all(Array.from(selectedIds).map(id =>
        deleteDoc(doc(db, 'collector_packages', id))
      )); 
    } else {
      const batch = writeBatch(db);
      Array.from(selectedIds).forEach(id => {
        const ref = doc(db, 'collector_packages', id);
        if (action === 'status')  batch.update(ref, { status: statusValue });
        if (action === 'delete')  batch.update(ref, { deleted: true });
        if (action === 'restore') batch.update(ref, { deleted: false });
      });
      await batch.commit();
    }
    // reset UI
    setAction('');
    setStatusValue('Active');
    setSelectedIds(new Set());
    alert('Action applied.');
  } catch (e) {
    console.error(e);
    alert('Failed to apply action.');
  }
};


  const [drawerOptionsRaw, setDrawerOptionsRaw] = useState({
    packageCategories: [],
    packagesAll: [],
    labs: [],
  });

  

  useEffect(() => {
    const unsubs = [];

    unsubs.push(onSnapshot(collection(db, 'package_categories'), snap => {
      const list = [];
      snap.forEach(d => {
        const name = d.data().name ?? d.id;
        list.push({ value: d.id, label: name });
      });
      setDrawerOptionsRaw(prev => ({ ...prev, packageCategories: list }));
    }));

    unsubs.push(onSnapshot(collection(db, 'test_packages'), snap => {
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        const name = data.name ?? data.title ?? d.id;
        const categoryId = data.category?.id ?? data.categoryId ?? '';
        const price = data.price ?? data.amount ?? null;
        list.push({ value: d.id, label: name, categoryId, price });
      });
      setDrawerOptionsRaw(prev => ({ ...prev, packagesAll: list }));
    }));

    // labs
    unsubs.push(onSnapshot(collection(db, 'labs'), snap => {
      const list = [];
      snap.forEach(d => {
        const name = d.data().name ?? d.data().labName ?? d.id;
        list.push({ value: d.id, label: name });
      });
      setDrawerOptionsRaw(prev => ({ ...prev, labs: list }));
    }));

    return () => unsubs.forEach(u => u && u());
  }, []);

  const drawerOptions = useMemo(() => {
    const { packageCategories, packagesAll, labs } = drawerOptionsRaw;
    const filteredPkgs = packagesAll
      .filter(p => !advValues.pkgCategory || p.categoryId === advValues.pkgCategory)
      .map(p => ({ value: p.value, label: p.price != null ? `${p.label} (₹${p.price})` : p.label }));
    return { packageCategories, packages: filteredPkgs, labs };
  }, [drawerOptionsRaw, advValues.pkgCategory]);


  
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
      style={{ height: '40px' }}
      displayEmpty
      value={action}
      onChange={(e) => setAction(e.target.value)}
      renderValue={(val) => (val ? (bulkActionsOne.find(a => a.value === val)?.label ?? '') : 'No action')}
      aria-label="Bulk action"
    >
      <MenuItem value=""><em>No action</em></MenuItem>
      {bulkActionsOne.map((a) => (
        <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
      ))}
    </Select>
          </FormControl>
          <Button style={{ height: '40px' }} variant="contained" size="small" disabled={!action} onClick={handleApply}>
            Apply
          </Button>
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
            <FormControl size="small" sx={{ minWidth: 73 }}>
              <Select
                style={{ height: '40px' }}
                displayEmpty
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                renderValue={(val) => {
                  if (!val) return 'All';
                  return filterOptions.find((f) => f.value === val)?.label ?? 'All';
                }}
                aria-label="Quick filter"
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {filterOptions.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

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

            <Button
              style={{ height: '40px' }}
              onClick={() => { navigate('packageform'); }}
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
            >
              New
            </Button>

            <Button
              style={{ height: '40px' }}
              startIcon={<FilterListIcon />}
              variant="contained"
              color="error"
              size="small"
              onClick={() => setOpenAdv(true)}
            >
              Advanced Filter
            </Button>
        </Box>
      </Box>
    </Box>
  );

  // Filtering before sorting
  const baseRows = useMemo(() => {
    let items = rowsFromDb.slice();

    // quick status
    if (quickFilter) items = items.filter((r) => r.status === quickFilter);

    // drawer: status (overrides or combines with quickFilter)
    if (appliedAdv.status) items = items.filter((r) => r.status === appliedAdv.status);

    // drawer: category/package/lab flags
    if (appliedAdv.pkgCategory) items = items.filter((r) => r._pkgCategoryId === appliedAdv.pkgCategory);
    if (appliedAdv.package) items = items.filter((r) => r.id === appliedAdv.package);
    if (appliedAdv.lab) items = items.filter((r) => Array.isArray(r._labIds) && r._labIds.includes(appliedAdv.lab));

    // drawer: boolean flags
    if (appliedAdv.homeCollection === 'true') items = items.filter((r) => r._homeCollection === true);
    if (appliedAdv.homeCollection === 'false') items = items.filter((r) => r._homeCollection === false);
    if (appliedAdv.featured === 'true') items = items.filter((r) => r._featured === true);
    if (appliedAdv.featured === 'false') items = items.filter((r) => r._featured === false);

    // search by name
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((r) => (r.name ?? '').toLowerCase().includes(q));
    }

    // price ranges (from drawer)
    if (appliedAdv.priceMin !== '' && !Number.isNaN(Number(appliedAdv.priceMin))) {
      items = items.filter((r) => r.price >= Number(appliedAdv.priceMin));
    }
    if (appliedAdv.priceMax !== '' && !Number.isNaN(Number(appliedAdv.priceMax))) {
      items = items.filter((r) => r.price <= Number(appliedAdv.priceMax));
    }

    // discount percentage ranges (from drawer)
    if (appliedAdv.discountMin !== '' && !Number.isNaN(Number(appliedAdv.discountMin))) {
      items = items.filter((r) => r.discountPercent >= Number(appliedAdv.discountMin));
    }
    if (appliedAdv.discountMax !== '' && !Number.isNaN(Number(appliedAdv.discountMax))) {
      items = items.filter((r) => r.discountPercent <= Number(appliedAdv.discountMax));
    }

    // labs/tests minimum thresholds (from drawer)
    if (appliedAdv.labsMin !== '' && !Number.isNaN(Number(appliedAdv.labsMin))) {
      items = items.filter((r) => Number(r.labsCounter) >= Number(appliedAdv.labsMin));
    }
    if (appliedAdv.testsMin !== '' && !Number.isNaN(Number(appliedAdv.testsMin))) {
      items = items.filter((r) => Number(r.testCaseCounter) >= Number(appliedAdv.testsMin));
    }

    return items;
  }, [rowsFromDb, quickFilter, query, appliedAdv]);

  // Sorting after filtering
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

  // CSV export of current view
  const handleExport = () => {
    const header = [
      'Name',
      'Labs',
      'Test Case',
      'Price',
      'Discount Price',
      'Discount %',
      'Status',
    ];
    const escapeCell = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rowsCsv = rows.map((r) =>
      [
        r.name,
        r.labsCounter,
        r.testCaseCounter,
        r.price,
        r.discountPrice,
        r.discountPercent,
        r.status,
      ].map(escapeCell).join(',')
    );
    const csv = [header.join(','), ...rowsCsv].join('\n');

    // BOM for Excel compatibility
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collector_packages.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // INR currency
  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(toNum(n));

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th"><SortHeader label="Name" path="name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Labs" path="labsCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Test Case" path="testCaseCounter" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Price" path="price" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Discount Price" path="discountPrice" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Discount %" path="discountPercent" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th className="clu-th"><SortHeader label="Status" path="status" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} /></th>
      <th>Action</th>
    </tr>
  );

  // selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());
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

  return (
    <>
      <CollectorListUnified
        variant=""
        title="CollectorLab Packages"
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onSearch={() => {}}
        onOpenAdvancedFilter={() => setOpenAdv(true)}
        onExport={handleExport}
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
            <td>{r.name}</td>
            <td>{r.labsCounter}</td>
            <td>{r.testCaseCounter}</td>
            <td>{formatCurrency(r.price)}</td>
            <td>{formatCurrency(r.discountPrice)}</td>
            <td>{r.discountPercent}%</td>
            <td>{r.status}</td>
            <td>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton size="small" color="primary" aria-label="edit" onClick={()=>navigate(`/testcases/edit/${r.id}`)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="delete"
                    onClick={async()=>{ if(!window.confirm('Delete this package?')) return; await deleteDoc(doc(db,'collector_packages', r.id)); }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </td>
          </tr>
        )}
      />

      <AdvancedFilterDrawer
        open={openAdv}
        onClose={()=>setOpenAdv(false)}
        preset="testPackages"
        title="Advanced Filter"
        values={advValues}
        setValues={setAdvValues}
        options={drawerOptions}
        onApply={onApplyAdv}
        onReset={onResetAdv}
      />
    </>
  );
}
