// CollectorPayouts.jsx
import React, { useMemo, useState } from "react";
import styled, { createGlobalStyle, css } from "styled-components";

/* ===== SortHeader (your API) ===== */
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
    --primary:#4f5bd5;        /* header strip */
    --primary-dark:#3f4ab0;
    --text:#1f2937;
    --muted:#6b7280;
    --border:#e6e8f0;
    --export:#ef5350;         /* export button */
    --filter:#f06292;         /* advanced filter button */
  }
  *{box-sizing:border-box}
  body{margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", Arial; background:var(--bg); color:var(--text);}

  /* ===== SortHeader visuals ===== */
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
  /* Up triangle (dimmed by default) */
  .clu-sort::before{ top:1px; border-bottom:6px solid rgba(255,255,255,.8); }
  /* Down triangle (dimmed by default) */
  .clu-sort::after{ bottom:1px; border-top:6px solid rgba(255,255,255,.8); }
  /* Active states */
  .clu-sort.asc::before{ border-bottom-color:#fff; }
  .clu-sort.desc::after{ border-top-color:#fff; }
`;

const Page = styled.div`min-height:100vh; display:flex; flex-direction:column;`;
const Shell = styled.div`max-width:1200px; margin:0 auto; padding:24px 16px 72px; width:100%;`;

const Breadcrumb = styled.div`
  font-size:14px; color:var(--muted); margin-bottom:16px; display:flex; gap:8px; align-items:center;
  span{ color:var(--text); font-weight:600; }
`;

const TopBar = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px;
`;

const Left = styled.div`display:flex; gap:12px; align-items:center;`;
const Right = styled.div`display:flex; gap:12px; align-items:center;`;

const Button = styled.button`
  appearance:none; border:0; color:#fff; font-weight:700; border-radius:10px;
  padding:12px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:10px;
  box-shadow:0 6px 14px rgba(31,41,55,.1);
  ${(p)=>p.variant==="export" && css`
    background:var(--export);
    &:hover{ filter:brightness(.97); transform:translateY(-1px); }
    &:active{ transform:translateY(0); }
  `}
  ${(p)=>p.variant==="filter" && css`
    background:var(--filter);
    &:hover{ filter:brightness(.97); transform:translateY(-1px); }
    &:active{ transform:translateY(0); }
  `}
`;

const Search = styled.div`
  position:relative; width:360px; max-width:46vw;
  input{
    width:100%; border:1px solid var(--border); background:#f8fafc; border-radius:10px;
    padding:10px 12px 10px 36px; outline:none; font-size:14px; color:var(--text);
  }
  .icon{ position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:.6; font-size:14px; }
`;

const Card = styled.div`
  background:var(--card); border:1px solid var(--border); border-radius:14px; overflow:hidden;
  box-shadow:0 6px 18px rgba(24,32,79,.06);
`;

const TableWrap = styled.div`width:100%; overflow-x:auto;`;
const Table = styled.table`width:100%; border-collapse:separate; border-spacing:0; min-width:820px;`;

const Th = styled.th`
  background:var(--primary); color:#fff; font-weight:700; text-align:left; padding:14px 16px; font-size:14px; position:relative; white-space:nowrap; user-select:none;
  &:first-child{ border-top-left-radius:12px; }
  &:last-child{ border-top-right-radius:12px; }
`;

const Tr = styled.tr`
  &:not(:last-child) td{ border-bottom:1px solid var(--border); }
  &:hover td{ background:#fafbff; }
`;

const Td = styled.td`
  padding:16px; font-size:14px; color:${p=>p.muted ? "var(--muted)" : "inherit"}; white-space:nowrap;
  text-align: ${p => p.align || "left"};
`;

const EmptyRow = styled.td`
  padding:28px 16px; text-align:center; color:var(--muted); font-weight:600;
`;

const TableFooter = styled.div`
  display:flex; align-items:center; gap:18px; padding:14px 16px 18px; color:var(--muted); font-size:14px; flex-wrap:wrap;
`;

const ShowEntries = styled.div`
  display:flex; align-items:center; gap:8px;
  select{ border:1px solid var(--border); border-radius:8px; padding:6px 10px; background:#fff; }
`;

const Pager = styled.div`margin-left:auto; display:flex; align-items:center; gap:8px;`;
const PageBtn = styled.button`
  border:1px solid ${p=>p.active ? "var(--primary)" : "var(--border)"};
  background:${p=>p.active ? "var(--primary)" : "#fff"};
  color:${p=>p.active ? "#fff" : "var(--text)"};
  padding:8px 12px; border-radius:8px; cursor:pointer; min-width:84px;
  &:disabled{ opacity:.6; cursor:not-allowed; }
`;

const Footer = styled.div`margin-top:36px; text-align:center; color:var(--muted); font-size:14px;`;

// Column model
const columns = [
  { key: "collector", title: "Collector Name" },
  { key: "method", title: "Payment Method" },
  { key: "amount", title: "Amount", align: "left" },
  { key: "date", title: "Paid Date" }
];

// Example data
const rowsSample = []; // plug your dataset here

export default function CollectorPayouts(){
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sort, setSort] = useState({ key: "collector", dir: null }); // 'asc' | 'desc' | null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rowsSample;
    if(!q) return base;
    return base.filter(r =>
      [r.collector, r.method, r.amount, r.date].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  const sorted = useMemo(() => {
    if(!sort.dir || !sort.key) return filtered;
    const copy = [...filtered];
    copy.sort((a,b) => {
      const A = a[sort.key];
      const B = b[sort.key];
      if (sort.key === "amount") {
        const nA = typeof A === "number" ? A : parseFloat(String(A).replace(/[^0-9.]/g,"")) || 0;
        const nB = typeof B === "number" ? B : parseFloat(String(B).replace(/[^0-9.]/g,"")) || 0;
        return sort.dir === "asc" ? nA - nB : nB - nA;
      }
      return sort.dir === "asc"
        ? String(A).localeCompare(String(B))
        : String(B).localeCompare(String(A));
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  return (
    <Page>
      <GlobalStyle />
      <Shell>
        <Breadcrumb>
          Dashboard <span>›</span> <span>Collector Payouts</span>
        </Breadcrumb>

        <TopBar>
          <Left>
            <Button variant="export" onClick={()=>alert("Export logic here")}>⭳ Export</Button>
          </Left>
          <Right>
            <Search>
              <span className="icon">🔍</span>
              <input
                placeholder="search..."
                value={query}
                onChange={(e)=>{ setQuery(e.target.value); setPage(1); }}
              />
            </Search>
            <Button variant="filter" onClick={()=>alert("Open advanced filter panel")}>⚗ Advanced Filter</Button>
          </Right>
        </TopBar>

        <Card>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  {columns.map(col => (
                    <Th key={col.key}>
                      <SortHeader
                        label={col.title}
                        path={col.key}
                        sortBy={sort.key}
                        sortDir={sort.dir}
                        onChange={(key, dir) => { setSort({ key, dir }); setPage(1); }}
                      />
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <EmptyRow colSpan={columns.length}>No Data Found</EmptyRow>
                  </tr>
                ) : (
                  visible.map((r, i) => (
                    <Tr key={i}>
                      <Td>{r.collector}</Td>
                      <Td>{r.method}</Td>
                      <Td>{r.amount}</Td>
                      <Td>{r.date}</Td>
                    </Tr>
                  ))
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
              <PageBtn onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={safePage===1}>Previous</PageBtn>
              <PageBtn onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={safePage===totalPages}>Next</PageBtn>
            </Pager>
          </TableFooter>
        </Card>

        <Footer>Kivilab: Your Ultimate Entertainment Hub (v1.2.1)</Footer>
      </Shell>
    </Page>
  );
}
