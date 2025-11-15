import React, { useMemo, useState } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";

// ---------- Theme ----------
const theme = {
  colors: {
    background: "#f5f6fb",
    surface: "#ffffff",
    primary: "#4f63cf", // header blue
    primaryTextOn: "#ffffff",
    text: "#323b4b",
    muted: "#667085",
    border: "#e5e7eb",
    rowHover: "#f2f4f7",
    danger: "#e54848",
    dangerHover: "#c03636",
    controlBg: "#f9fafb",
    controlBorder: "#d0d5dd",
    controlFocus: "#4f63cf",
  },
  radii: {
    sm: "6px",
    md: "10px",
  },
  shadow: "0 1px 2px rgba(0,0,0,0.06)",
  font: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

// ---------- Global ----------
const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light;
  }
  html, body, #root {
    height: 100%;
    background: ${p => p.theme.colors.background};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ${p => p.theme.font};
    color: ${p => p.theme.colors.text};
  }
`;

// ---------- Layout ----------
const Page = styled.div`
  min-height: 100%;
  padding: 28px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  color: ${p => p.theme.colors.muted};
  font-size: 14px;
`;

const Crumb = styled.span`
  &:not(:last-child)::after {
    content: "›";
    margin: 0 8px;
    color: ${p => p.theme.colors.controlBorder};
  }
`;

const Card = styled.div`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.md};
  box-shadow: ${p => p.theme.shadow};
  overflow: hidden;
`;

// ---------- Toolbar ----------
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.surface};
`;

const Select = styled.select`
  appearance: none;
  background: ${p => p.theme.colors.controlBg};
  border: 1px solid ${p => p.theme.colors.controlBorder};
  padding: 10px 12px;
  border-radius: ${p => p.theme.radii.sm};
  color: ${p => p.theme.colors.text};
  font-size: 14px;
  min-width: 160px;
  outline: none;
  &:focus {
    border-color: ${p => p.theme.colors.controlFocus};
    box-shadow: 0 0 0 3px rgba(79, 99, 207, 0.2);
  }
`;

const Button = styled.button`
  background: ${p => p.theme.colors.primary};
  color: ${p => p.theme.colors.primaryTextOn};
  border: 0;
  padding: 10px 16px;
  border-radius: ${p => p.theme.radii.sm};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  &:hover { filter: brightness(0.95); }
`;

// ---------- Table ----------
const TableWrap = styled.div`
  width: 100%;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const THead = styled.thead`
  background: ${p => p.theme.colors.primary};
  color: ${p => p.theme.colors.primaryTextOn};
`;

const Th = styled.th`
  text-align: left;
  font-weight: 600;
  padding: 14px 16px;
  font-size: 14px;
  white-space: nowrap;
  &:first-child { width: 48px; }
  &:last-child { text-align: right; }
`;

const TBody = styled.tbody`
  td {
    padding: 14px 16px;
    border-top: 1px solid ${p => p.theme.colors.border};
    color: ${p => p.theme.colors.text};
    font-size: 14px;
    vertical-align: middle;
  }
  tr:hover {
    background: ${p => p.theme.colors.rowHover};
  }
`;

const CheckCell = styled.td`
  width: 48px;
`;

const UserCell = styled.td`
  color: ${p => p.theme.colors.muted};
`;

const RightCell = styled.td`
  text-align: right;
  white-space: nowrap;
`;

const Checkbox = styled.input.attrs({ type: "checkbox" })`
  width: 16px;
  height: 16px;
  accent-color: ${p => p.theme.colors.primary};
  cursor: pointer;
`;

// ---------- Actions ----------
const IconButton = styled.button`
  background: transparent;
  border: 0;
  padding: 6px;
  border-radius: 6px;
  color: ${p => p.theme.colors.danger};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover {
    color: ${p => p.theme.colors.dangerHover};
    background: rgba(229,72,72,0.08);
  }
  svg { display: block; width: 18px; height: 18px; }
`;

// ---------- Footer ----------
const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.surface};
`;

const Small = styled.span`
  font-size: 13px;
  color: ${p => p.theme.colors.muted};
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageButton = styled.button`
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid ${p => p.theme.colors.controlBorder};
  background: ${p => (p["data-active"] ? p.theme.colors.primary : p.theme.colors.surface)};
  color: ${p => (p["data-active"] ? p.theme.colors.primaryTextOn : p.theme.colors.text)};
  cursor: pointer;
  &:hover { filter: brightness(0.98); }
`;

// ---------- Sample Data ----------
const seedRows = [
  {
    id: "r1",
    type: "appointment",
    text: "Collector Assigned!",
    user: "--",
    updatedAt: "5 seconds ago",
  },
  {
    id: "r2",
    type: "appointment",
    text: "New Appointment Appointment",
    user: "--",
    updatedAt: "4 days ago",
  },
  {
    id: "r3",
    type: "appointment",
    text: "Collector Assigned!",
    user: "--",
    updatedAt: "4 days ago",
  },
];

// ---------- Component ----------
export default function NotificationList() {
  const [rows, setRows] = useState(seedRows);
  const [selected, setSelected] = useState(new Set());
  const [bulk, setBulk] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = useMemo(() => rows.slice(start, start + pageSize), [rows, start, pageSize]);

  const allOnPageIds = pageRows.map(r => r.id);
  const allOnPageChecked = allOnPageIds.every(id => selected.has(id)) && allOnPageIds.length > 0;

  const toggleRow = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    if (allOnPageChecked) {
      allOnPageIds.forEach(id => next.delete(id));
    } else {
      allOnPageIds.forEach(id => next.add(id));
    }
    setSelected(next);
  };

  const deleteOne = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const applyBulk = () => {
    if (bulk === "delete") {
      setRows(prev => prev.filter(r => !selected.has(r.id)));
      setSelected(new Set());
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <HeaderRow aria-label="Breadcrumb">
          <Crumb>Dashboard</Crumb>
          <Crumb>Notification List</Crumb>
        </HeaderRow>

        <Card>
          <Toolbar>
            <Select value={bulk} onChange={(e) => setBulk(e.target.value)} aria-label="Bulk action">
              <option value="">No action</option>
              <option value="delete">Delete</option>
            </Select>
            <Button onClick={applyBulk}>Apply</Button>
          </Toolbar>

          <TableWrap>
            <Table role="table">
              <THead>
                <tr role="row">
                  <Th scope="col">
                    <Checkbox
                      aria-label="Select all rows"
                      checked={allOnPageChecked}
                      onChange={toggleAll}
                    />
                  </Th>
                  <Th scope="col">Type</Th>
                  <Th scope="col">Text</Th>
                  <Th scope="col">User</Th>
                  <Th scope="col">Update At</Th>
                  <Th scope="col" style={{ textAlign: "right" }}>Action</Th>
                </tr>
              </THead>

              <TBody>
                {pageRows.map((r) => (
                  <tr role="row" key={r.id}>
                    <CheckCell>
                      <Checkbox
                        aria-label={`Select row for ${r.text}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleRow(r.id)}
                      />
                    </CheckCell>
                    <td>{r.type}</td>
                    <td>{r.text}</td>
                    <UserCell>{r.user}</UserCell>
                    <td>{r.updatedAt}</td>
                    <RightCell>
                      <IconButton aria-label="Delete" onClick={() => deleteOne(r.id)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M9 3h6a1 1 0 0 1 1 1v2h5v2h-2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8H2V6h5V4a1 1 0 0 1 1-1zm1 3h4V5h-4v1zm-2 4h2v9H8V10zm4 0h2v9h-2V10zm4 0h2v9h-2V10z" />
                        </svg>
                      </IconButton>
                    </RightCell>
                  </tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>

          <Footer>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Small>Show</Small>
              <Select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ minWidth: 80 }}
              >
                {[5, 10, 25, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
              <Small>entries</Small>
            </div>

            <Small>Showing {rows.length === 0 ? 0 : start + 1} to {Math.min(start + pageSize, rows.length)} of {rows.length} entries</Small>

            <Pager>
              <PageButton onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</PageButton>
              <PageButton data-active>{page}</PageButton>
              <PageButton onClick={() => setPage(p => Math.min(pageCount, p + 1))}>Next</PageButton>
            </Pager>
          </Footer>
        </Card>
      </Page>
    </ThemeProvider>
  );
}
