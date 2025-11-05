// src/pages/collectors/Documents.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CollectorListUnified from '@/components/CollectorListUnified';

export default function CollectorDocumentList() {
  const { id } = useParams(); 

  // local state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [documentRows, setDocumentRows] = useState([
    // { id: 'd1', title: 'ID Proof', type: 'ID', uploadedAt: '2025-10-12', url: '/files/id-proof.pdf' },
    // { id: 'd2', title: 'License', type: 'License', uploadedAt: '2025-10-14', url: '/files/license.pdf' },
  ]);

  // optional: client-side search; for server-side, query using `search` and `id`
  const filtered = documentRows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.type || '').toLowerCase().includes(q) ||
      (r.uploadedAt || '').toLowerCase().includes(q)
    );
  });

  // client-side pagination; replace with server paging if needed
  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);
  const total = filtered.length;

  // simple export
  const handleExport = () => {
    if (!filtered.length) return;
    const cols = ['title', 'type', 'uploadedAt', 'url'];
    const csv = [cols.join(','), ...filtered.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collector_${id || 'documents'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CollectorListUnified
      variant="documents"
      title={id ? `Collector Documents (#${id})` : 'Collector Documents'}
      rows={pageRows}
      renderActions={(d) => (
        <div className="clu-btn-group">
          <a className="clu-btn small outline" href={d.url} target="_blank" rel="noreferrer">View</a>
          <a className="clu-btn small" href={d.url} download>Download</a>
        </div>
      )}
      search={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      bulkActions={[]}
      selectedAction=""
      onActionChange={() => {}}
      onApply={() => {}}
      onExport={handleExport}
      onOpenAdvancedFilter={() => console.log('Open filter for documents')}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      onPageSizeChange={(s) => {
        setPage(1);
        setPageSize(s);
      }}
    />
  );
}
