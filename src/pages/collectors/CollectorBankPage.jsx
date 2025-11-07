// src/pages/collectors/CollectorBanks.jsx
import React, { useMemo, useState } from 'react';
import CollectorListUnified from '../../components/CollectorListUnified';
import { useNavigate } from 'react-router-dom';

// simple sort helper
const getByPath = (obj, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), obj);

// design icon header (chevrons pinned right)
function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, 'asc');
    if (sortDir === 'asc') return onChange(path, 'desc');
    return onChange(null, null);
  };
  const cls = sortBy === path ? (sortDir === 'asc' ? 'clu-sort asc' : 'clu-sort desc') : 'clu-sort';
  return (
    <button className="clu-thbtn" onClick={next} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <span className={cls} aria-hidden="true" />
    </button>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="clu-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="clu-slider" />
    </label>
  );
}

export default function CollectorBankPage() {
    const navigate = useNavigate();
    const bankForm =  () => { navigate("form")}
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);

  // demo data — replace with API
  const [rows, setRows] = useState([
    // { id:'b1', bankName:'HDFC', branchName:'Mumbai', collectorName:'Felix Harris', contactNumber:'9876543210', isActive:true },
  ]);
  const [selected, setSelected] = useState(() => new Set());

  // header slot per design: left bulk actions + right filter/search + "+ Add Bank"
  const headerSlot = () => (
    <>
      <div className="clu-leftbar">
        <select className="clu-select" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">No action</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="delete">Delete</option>
        </select>
        <button className="clu-btn" disabled={!action} onClick={() => { console.log('Apply', action, Array.from(selected)); setAction(''); }}>
          Apply
        </button>
        <button className="clu-btn danger" onClick={() => console.log('Export csv')}>Export</button>
      </div>

      <div className="clu-right">
        <div className="clu-select-wrap">
          <select className="clu-select" onChange={() => {}} defaultValue="All">
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="clu-search">
          <span className="clu-search-label">search…</span>
          <input
            className="clu-input"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="search…"
          />
        </div>
        <button className="clu-btn primary" onClick={bankForm}>
          + Add Bank
        </button>
      </div>
    </>
  );

  // filter, sort, paginate (client-side)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.bankName || '').toLowerCase().includes(q) ||
      (r.branchName || '').toLowerCase().includes(q) ||
      (r.collectorName || '').toLowerCase().includes(q) ||
      (r.contactNumber || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    if (!sortBy || !sortDir) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = getByPath(a, sortBy);
      const vb = getByPath(b, sortBy);
      const res = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? res : -res;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const start = (page - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const total = sorted.length;

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAllOnPage = (v) => {
    const next = new Set(selected);
    pageRows.forEach((r) => (v ? next.add(r.id) : next.delete(r.id)));
    setSelected(next);
  };

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
        <SortHeader label="Bank Name" path="bankName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Branch Name" path="branchName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Collector Name" path="collectorName" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Contact Number" path="contactNumber" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      <th className="clu-th">
        <SortHeader label="Status" path="isActive" sortBy={sortBy} sortDir={sortDir} onChange={onSortChange} />
      </th>
      {/* Action column without sort icon */}
      <th>Action</th>
    </tr>
  );

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
      <td>{r.bankName}</td>
      <td>{r.branchName}</td>
      <td>{r.collectorName}</td>
      <td>{r.contactNumber}</td>
      <td>
        <Toggle
          checked={!!r.isActive}
          onChange={(v) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: v } : x)))}
        />
      </td>
      <td>
        <div className="clu-btn-group">
          <button className="clu-btn small outline" onClick={() => console.log('Edit bank', r.id)}>Edit</button>
          <button className="clu-btn small danger" onClick={() => console.log('Delete bank', r.id)}>Delete</button>
        </div>
      </td>
    </tr>
  );

  return (
    <CollectorListUnified
      variant="pending"           // table layout only; header/rows fully customized via slots
      title="Collector Banks"
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
      // compatibility props (unused with headerSlot)
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
