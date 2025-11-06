// src/components/CollectorListUnified.jsx
import React from 'react';
import "./styles/common.css"

export default function CollectorListUnified(props) {
  const {
    variant = 'pending',
    title,
    rows = [],
    search = '',
    onSearch = () => {},
    bulkActions = [],
    selectedAction = '',
    onActionChange = () => {},
    onApply = () => {},
    onExport = () => {},
    onOpenAdvancedFilter = () => {},
    page = 1,
    pageSize = 10,
    total = 0,
    onPageChange = () => {},
    onPageSizeChange = () => {},
    rowKey,
    renderActions,
    emptyText = 'No Data Found',
     headerSlot,           // NEW: optional custom header bar
    renderHead,           // NEW: optional custom <tr> for table header
    renderRow,            // NEW: optional custom <tr> per data row
    hideActionsRow = false
  } = props;

  const isDocs = variant === 'documents';
  const resolvedTitle =
    title ||
    (isDocs
      ? 'Collector Documents'
      : variant === 'unassigned'
      ? 'Unassigned Collector List'
      : 'Pending Collector List');

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
     <div className="clu-wrap">
      {/* Header */}
      {headerSlot ? (
        <div className="clu-top">{headerSlot()}</div>
      ) : (
        <div className="clu-top">
          <h5 className="clu-title">{resolvedTitle}</h5>
          <div className="clu-right">
            <div className="clu-search">
              <span className="clu-search-label">search…</span>
              <input
                className="clu-input"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="search…"
              />
            </div>
            <button className="clu-btn outline" onClick={onOpenAdvancedFilter}>
              Advanced Filter
            </button>
          </div>
        </div>
      )}

      {/* Bulk actions row (can be hidden if headerSlot contains these controls) */}
      {!hideActionsRow && (
        <div className="clu-actions">
          <select
            className="clu-select"
            value={selectedAction}
            onChange={(e) => onActionChange(e.target.value)}
          >
            <option value="">No action</option>
            {bulkActions.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <button className="clu-btn" disabled={!selectedAction} onClick={onApply}>
            Apply
          </button>
          <button className="clu-btn danger" onClick={onExport}>
            Export
          </button>
        </div>
      )}

      {/* Table */}
      <div className="clu-card">
        <table className="clu-table">
          <thead>
            {renderHead ? (
              renderHead()
            ) : !isDocs ? (
              <tr>
                <th>Collector</th>
                <th>Lab</th>
                <th>Contact Number</th>
                <th>Current Status</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            ) : (
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Action</th>
              </tr>
            )}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="clu-empty" colSpan={renderHead ? 99 : !isDocs ? 6 : 4}>
                  {emptyText}
                </td>
              </tr>
            ) : renderRow ? (
              rows.map((r, i) => renderRow(r, i))
            ) : !isDocs ? (
              rows.map((r, i) => (
                <tr key={rowKey ? rowKey(r, i) : r.id ?? i}>
                  <td>{r.name}</td>
                  <td>{r.lab}</td>
                  <td>{r.contactNumber}</td>
                  <td>{r.currentStatus}</td>
                  <td>{r.status}</td>
                  <td>
                    {renderActions ? (
                      renderActions(r)
                    ) : (
                      <div className="clu-btn-group">
                        <button className="clu-btn small outline">View</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              rows.map((r, i) => (
                <tr key={rowKey ? rowKey(r, i) : r.id ?? i}>
                  <td>{r.title}</td>
                  <td>{r.type}</td>
                  <td>{r.uploadedAt}</td>
                  <td>
                    {renderActions ? (
                      renderActions(r)
                    ) : (
                      <div className="clu-btn-group">
                        <a className="clu-btn small outline" href={r.url} target="_blank" rel="noreferrer">View</a>
                        <a className="clu-btn small" href={r.url} download>Download</a>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="clu-foot">
        <div className="clu-left">
          <span>Show</span>
          <select
            className="clu-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>entries</span>
          <span className="clu-range">
            Showing {start} to {end} of {total} entries
          </span>
        </div>
        <div className="clu-pager">
          <button
            className="clu-btn outline"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className="clu-page">
            Page {page} of {pageCount}
          </span>
          <button
            className="clu-btn outline"
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
