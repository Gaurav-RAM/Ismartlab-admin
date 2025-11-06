// src/pages/collectors/DocumentsCollectorList.jsx
import React, { useMemo, useState } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import CollectorListUnified from '../../components/CollectorListUnified';

// helper to read nested props like "collector.name"
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

// right-pinned sort header with design icon
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

// small accessible toggle using a checkbox
function Toggle({ checked, onChange }) {
  return (
    <label className="clu-switch" aria-label="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="clu-slider" />
    </label>
  );
}


 
    // If /appointments has a nested child route path="new", use relative navigation:
 
  

export default function DocumentsCollectorList() {
  const { id } = useParams();
  const navigate = useNavigate(); 
    const onformdata =  () => { navigate("form")}
  // local state
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);

  // data (swap with API)
  const [rows, setRows] = useState([
    // {
    //   id:'1',
    //   collector:{ name:'Felix Harris', email:'collector@gmail.com', avatar:'/img/felix.png' },
    //   document:'Government-issued ID Proof (Passport, Driver’s License, etc)',
    //   isVerified:true,
    //   isActive:true,
    //   uploadedAt:'2025-10-12'
    // },
  ]);

  // selection for bulk actions
  const [selected, setSelected] = useState(() => new Set());

  // search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.collector?.name || '').toLowerCase().includes(q) ||
      (r.collector?.email || '').toLowerCase().includes(q) ||
      (r.document || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  // sort
  const sorted = useMemo(() => {
    if (!sortBy || !sortDir) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = getByPath(a, sortBy);
      const vb = getByPath(b, sortBy);
      // booleans and dates handled first
      if (typeof va === 'boolean' && typeof vb === 'boolean') {
        const res = va === vb ? 0 : va ? 1 : -1;
        return sortDir === 'asc' ? res : -res;
      }
      if (!Number.isNaN(Date.parse(va)) && !Number.isNaN(Date.parse(vb))) {
        const res = new Date(va) - new Date(vb);
        return sortDir === 'asc' ? res : -res;
      }
      const res = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? res : -res;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  // paging
  const start = (page - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const total = sorted.length;

  // select all on page
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAllOnPage = (v) => {
    const next = new Set(selected);
    pageRows.forEach((r) => (v ? next.add(r.id) : next.delete(r.id)));
    setSelected(next);
  };

  // bulk Apply
  const handleApply = () => {
    console.log('Bulk action:', action, Array.from(selected));
    setAction('');
  };

  // header slot (left actions + right search and New)
  const headerSlot = () => (
    <>
      <div className="clu-leftbar">
        <select className="clu-select" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">No action</option>
          <option value="verify">Mark Verified</option>
          <option value="unverify">Mark Unverified</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="delete">Delete</option>
        </select>
        <button className="clu-btn" disabled={!action} onClick={handleApply}>Apply</button>
        <button className="clu-btn danger" onClick={() => console.log('Export csv')}>Export</button>
      </div>
      <div className="clu-right">
        <div className="clu-search">
          <span className="clu-search-label">search…</span>
          <input
            className="clu-input"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="search…"
          />
        </div>
        <button onClick={onformdata} className="clu-btn">+ New</button>
      </div>
    </>
  );

  const onSortChange = (key, dir) => {
    setSortBy(key);
    setSortDir(dir);
    setPage(1);
  };

  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input type="checkbox" checked={allOnPageSelected} onChange={(e) => toggleAllOnPage(e.target.checked)} />
      </th>
      <th className="clu-th">
        <SortHeader label="Collector" path="collector.name" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Document" path="document" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Is Verified" path="isVerified" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Status" path="isActive" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>

       <th>Action</th>
      {/* <th className="clu-th">
        <SortHeader label="Action" path="uploadedAt" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th> */}
    </tr>
  );

  // row with toggles and action buttons
  const renderRow = (r, i) => (
    <tr key={r.id ?? i}>
      <td>
        <input
          type="checkbox"
          checked={selected.has(r.id)}
          onChange={(e) => {
            const next = new Set(selected);
            e.target.checked ? next.add(r.id) : next.delete(r.id);
            setSelected(next);
          }}
        />
      </td>
      <td>
        <div className="clu-user">
          {r.collector?.avatar ? <img className="clu-avatar" src={r.collector.avatar} alt="" /> : <div className="clu-avatar fallback" />}
          <div className="clu-user-meta">
            <div className="clu-user-name">{r.collector?.name}</div>
            <div className="clu-user-email">{r.collector?.email}</div>
          </div>
        </div>
      </td>
      <td>{r.document}</td>
      <td>
        <Toggle
          checked={!!r.isVerified}
          onChange={(v) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isVerified: v } : x)))}
        />
      </td>
      <td>
        <Toggle
          checked={!!r.isActive}
          onChange={(v) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: v } : x)))}
        />
      </td>
      <td>
        <div className="clu-btn-group">
          <button className="clu-btn small outline" onClick={() => console.log('Edit', r.id)}>✏️</button>
          <button className="clu-btn small" onClick={() => console.log('Approve/Verify', r.id)}>✅</button>
          <button className="clu-btn small danger" onClick={() => console.log('Delete', r.id)}>🗑️</button>
        </div>
      </td>
    </tr>
  );

  return (
    <CollectorListUnified
      variant="documents"
      title={id ? `Collector Document List` : 'Collector Document List'}
      rows={pageRows}
      headerSlot={headerSlot}
      renderHead={renderHead}
      renderRow={renderRow}
      hideActionsRow={true}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      onPageSizeChange={(s) => { setPage(1); setPageSize(s); }}
      // keep the following props for compatibility (but not used in headerSlot mode)
      search={search}
      onSearch={setSearch}
      bulkActions={[]}
      selectedAction=""
      onActionChange={() => {}}
      onApply={() => {}}
      onExport={() => {}}
      onOpenAdvancedFilter={() => {}}
    />
  );
}
