// src/pages/collectors/PendingList.jsx
import React, { useState } from 'react';
import CollectorListUnified from '@/components/CollectorListUnified';

export default function CollectorPendingList() {
  // state
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [pendingRows, setPendingRows] = useState([
  ]);

  const total = pendingRows.length;

  // handlers
  const handleApply = () => {
    console.log('Apply:', action);
    setAction('');
  };

  const handleExport = () => {
    if (!pendingRows.length) return;
    const cols = ['name', 'lab', 'contactNumber', 'currentStatus', 'status'];
    const csv = [cols.join(','), ...pendingRows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pending_collectors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRows = pendingRows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.name || '').toLowerCase().includes(q) ||
      (r.lab || '').toLowerCase().includes(q) ||
      (r.contactNumber || '').toLowerCase().includes(q) ||
      (r.currentStatus || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    );
  });

  const startIndex = (page - 1) * pageSize;
  const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);
  const pageTotal = filteredRows.length;

  return (
    <CollectorListUnified
      variant="pending"
      rows={pageRows}
      bulkActions={[
        { label: 'Approve', value: 'approve' },
        { label: 'Reject', value: 'reject' },
      ]}
      renderActions={(r) => (
        <div className="clu-btn-group">
          <button className="clu-btn small outline" onClick={() => console.log('View', r.id)}>View</button>
          <button className="clu-btn small" onClick={() => console.log('Approve', r.id)}>Approve</button>
          <button className="clu-btn small danger" onClick={() => console.log('Reject', r.id)}>Reject</button>
        </div>
      )}
      search={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      selectedAction={action}
      onActionChange={setAction}
      onApply={handleApply}
      onExport={handleExport}
      onOpenAdvancedFilter={() => console.log('Open filter')}
      page={page}
      pageSize={pageSize}
      total={pageTotal}
      onPageChange={setPage}
      onPageSizeChange={(s) => {
        setPage(1);
        setPageSize(s);
      }}
    />
  );
}
