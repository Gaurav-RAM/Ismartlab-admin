// CashPaymentList.jsx
import React, { useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

/* ===== Sort header button styles (CSS triangles) ===== */
const SortStyles = createGlobalStyle`
  .clu-thbtn{
    display:flex; align-items:center; gap:8px;
    background:transparent; border:0; color:#fff; font-weight:700;
    cursor:pointer; padding:0; margin:0;
  }
  .clu-sort{
    position:relative; width:10px; height:16px; display:inline-block;
  }
  .clu-sort::before, .clu-sort::after{
    content:""; position:absolute; left:0; right:0; margin:auto; width:0; height:0;
    border-left:5px solid transparent; border-right:5px solid transparent;
  }
  .clu-sort::before{ top:1px; border-bottom:6px solid rgba(255,255,255,.8); }
  .clu-sort::after{ bottom:1px; border-top:6px solid rgba(255,255,255,.8); }
  .clu-sort.asc::before{ border-bottom-color:#fff; }
  .clu-sort.desc::after{ border-top-color:#fff; }
`;

/* ===== SortHeader (tri-state) ===== */
function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, "asc");
    if (sortDir === "asc") return onChange(path, "desc");
    return onChange(null, null);
  };
  const iconCls =
    sortBy === path ? (sortDir === "asc" ? "clu-sort asc" : "clu-sort desc") : "clu-sort";
  return (
    <button className="clu-thbtn" onClick={next} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <span className={iconCls} aria-hidden="true" />
    </button>
  );
}

const GlobalStyle = createGlobalStyle`
  :root{
    --bg:#f5f7fb;
    --card:#ffffff;
    --primary:#4f5bd5;
    --primary-dark:#3f4ab0;
    --text:#1f2937;
    --muted:#6b7280;
    --border:#e6e8f0;
    --success:#3b82f6;
    --danger:#ef4444;
  }
  *{box-sizing:border-box}
  body{margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji"; background:var(--bg); color:var(--text);}
  a{color:inherit}
`;

const Page = styled.div`min-height: 100vh; display:flex; flex-direction: column;`;
const Shell = styled.div`max-width: 1200px; margin: 0 auto; padding: 24px 16px 72px; width: 100%;`;

const Breadcrumb = styled.div`
  font-size: 14px; color: var(--muted); margin-bottom: 16px; display: flex; gap: 8px; align-items: center;
  span{ color: var(--text); font-weight: 600; }
`;

const TopBar = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
`;

const ExportButton = styled.button`
  appearance:none; border:0; background:#ef5350; color:#fff; font-weight:600; border-radius:10px;
  padding:12px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:10px;
  box-shadow:0 6px 14px rgba(239,83,80,.25); transition: transform .12s ease, filter .2s ease, background .2s ease;
  &:hover{ background:#e04946; transform: translateY(-1px); }
  &:active{ transform: translateY(0); }
`;

const Card = styled.div`
  background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
  box-shadow: 0 6px 18px rgba(24, 32, 79, 0.06);
`;

const Search = styled.div`
  position: relative; width: 360px; max-width: 100%;
  input{
    width: 100%; border: 1px solid var(--border); background: #f8fafc; border-radius: 10px;
    padding: 10px 12px 10px 36px; outline: none; font-size: 14px; color: var(--text);
  }
  .icon{ position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: .6; font-size: 14px; }
`;

const TableWrap = styled.div`width:100%; overflow-x:auto;`;
const Table = styled.table`width:100%; border-collapse:separate; border-spacing:0; min-width:980px;`;

const Th = styled.th`
  background: var(--primary); color: #fff; font-weight: 600; text-align: left;
  padding: 14px 16px; font-size: 14px; position: relative; white-space: nowrap;
  &:first-child{ border-top-left-radius: 12px; }
  &:last-child{ border-top-right-radius: 12px; }
`;

const Tr = styled.tr`
  &:not(:last-child) td{ border-bottom: 1px solid var(--border); }
  &:hover td{ background: #fafbff; }
`;

const Td = styled.td`
  padding: 16px; font-size: 14px; color: ${p => p.muted ? "var(--muted)" : "inherit"}; white-space: nowrap;
`;

const CustomerCell = styled.div`display:flex; align-items:center; gap:12px;`;
const Avatar = styled.div`width:36px; height:36px; border-radius:50%; background:#f1f5ff; color:var(--primary); font-weight:700; display:flex; align-items:center; justify-content:center;`;
const CustomerMeta = styled.div`display:flex; flex-direction:column; line-height:1.15; strong{font-weight:700;} span{color:var(--muted); font-size:13px;}`;
const LinkBtn = styled.button`border:0; background:transparent; color:var(--primary); font-weight:600; cursor:pointer; padding:6px 0; text-decoration: underline;`;
const StatusBadge = styled.span`display:inline-block; background:#e9edff; color:var(--primary-dark); font-weight:700; border-radius:999px; padding:6px 12px; font-size:12px;`;

const TableFooter = styled.div`display:flex; align-items:center; gap:18px; padding:14px 16px 18px; color:var(--muted); font-size:14px; flex-wrap:wrap;`;
const ShowEntries = styled.div`display:flex; align-items:center; gap:8px; select{ border:1px solid var(--border); border-radius:8px; padding:6px 10px; background:#fff; }`;
const Pager = styled.div`margin-left:auto; display:flex; align-items:center; gap:8px;`;
const PageBtn = styled.button`
  border:1px solid ${p=>p.active ? "var(--primary)" : "var(--border)"}; background:${p=>p.active ? "var(--primary)" : "#fff"};
  color:${p=>p.active ? "#fff" : "var(--text)"}; padding:8px 12px; border-radius:8px; cursor:pointer; min-width:44px;
  &:disabled{ opacity:.6; cursor:not-allowed }
`;

const Footer = styled.div`margin-top:36px; text-align:center; color:var(--muted); font-size:14px;`;

/* ===== Data ===== */
const sampleRows = [
  {
    id: 4,
    test: "Prostate-Specific Antigen (PSA)",
    name: "John Doe",
    email: "john@gmail.com",
    cashHistory: "View",
    status: "Approved by collector",
    date: "2025-11-02 10:49",
    amount: "$71.90"
  }
];

function initialsOf(name){
  const parts = name.split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export default function CashPaymentList(){
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "id", dir: null }); // asc | desc | null

  const rows = sampleRows; // plug in your data source here

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if(!q) return rows.slice();
    return rows.filter(r =>
      [r.test, r.name, r.email, r.amount, r.status, r.id, r.date]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  const sorted = useMemo(() => {
    if(!sort.key || !sort.dir) return filtered.slice();
    const copy = filtered.slice();
    copy.sort((a,b) => {
      let A, B;
      switch (sort.key) {
        case "id": A = a.id; B = b.id; break;
        case "test": A = a.test; B = b.test; break;
        case "name": A = a.name; B = b.name; break;
        case "date": A = a.date; B = b.date; break;
        case "amount": {
          const toNum = v => typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g,"")) || 0;
          A = toNum(a.amount); B = toNum(b.amount); break;
        }
        default: A = ""; B = "";
      }
      if (typeof A === "number" && typeof B === "number") {
        return sort.dir === "asc" ? A - B : B - A;
      }
      return sort.dir === "asc"
        ? String(A).localeCompare(String(B))
        : String(B).localeCompare(String(A));
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const handleSort = (key, dir) => { setSort({ key, dir }); setPage(1); };

  return (
    <Page>
      <GlobalStyle />
      <SortStyles />
      <Shell>
        <Breadcrumb>
          Dashboard <span>›</span> <span>Cash Payment List</span>
        </Breadcrumb>

        <TopBar>
          <ExportButton onClick={() => alert("Implement your export here")}>
            ⭳ Export
          </ExportButton>
          <Search>
            <span className="icon">🔍</span>
            <input
              placeholder="search..."
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
            />
          </Search>
        </TopBar>

        <Card>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>
                    <SortHeader label="ID" path="id" sortBy={sort.key} sortDir={sort.dir} onChange={handleSort} />
                  </Th>
                  <Th>
                    <SortHeader label="Test Case" path="test" sortBy={sort.key} sortDir={sort.dir} onChange={handleSort} />
                  </Th>
                  <Th>
                    <SortHeader label="Customer" path="name" sortBy={sort.key} sortDir={sort.dir} onChange={handleSort} />
                  </Th>
                  <Th>Cash History</Th>
                  <Th>Status</Th>
                  <Th>
                    <SortHeader label="Date & Time" path="date" sortBy={sort.key} sortDir={sort.dir} onChange={handleSort} />
                  </Th>
                  <Th>
                    <SortHeader label="Total Paid Amount" path="amount" sortBy={sort.key} sortDir={sort.dir} onChange={handleSort} />
                  </Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map(r => (
                  <Tr key={r.id}>
                    <Td muted>#{r.id}</Td>
                    <Td>{r.test}</Td>
                    <Td>
                      <CustomerCell>
                        <Avatar>{initialsOf(r.name)}</Avatar>
                        <CustomerMeta>
                          <strong>{r.name}</strong>
                          <span>{r.email}</span>
                        </CustomerMeta>
                      </CustomerCell>
                    </Td>
                    <Td>
                      <LinkBtn onClick={() => alert("Open cash history")}>View</LinkBtn>
                    </Td>
                    <Td><StatusBadge>{r.status}</StatusBadge></Td>
                    <Td>{r.date}</Td>
                    <Td>{r.amount}</Td>
                    <Td></Td>
                  </Tr>
                ))}
                {visible.length === 0 && (
                  <Tr>
                    <Td colSpan={8} muted>No results found.</Td>
                  </Tr>
                )}
              </tbody>
            </Table>
          </TableWrap>

          <TableFooter>
            <ShowEntries>
              Show
              <select
                value={pageSize}
                onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[5,10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              entries
            </ShowEntries>

            <span>
              Showing {sorted.length === 0 ? 0 : start + 1} to {Math.min(sorted.length, start + pageSize)} of {sorted.length} entries
            </span>

            <Pager>
              <PageBtn onClick={() => setPage(p => Math.max(1, p-1))} disabled={pageSafe === 1}>Previous</PageBtn>
              {Array.from({length: totalPages}).slice(0, 5).map((_, i) => {
                const n = i + 1;
                return <PageBtn key={n} active={n===pageSafe} onClick={() => setPage(n)}>{n}</PageBtn>;
              })}
              <PageBtn onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={pageSafe === totalPages}>Next</PageBtn>
            </Pager>
          </TableFooter>
        </Card>

        <Footer>
          Kivilab: Your Ultimate Entertainment Hub (v1.2.1)
        </Footer>
      </Shell>
    </Page>
  );
}
