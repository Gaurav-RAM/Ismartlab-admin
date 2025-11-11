// PaymentList.jsx
import React, { useMemo, useState } from "react";
import styled, { css, createGlobalStyle } from "styled-components";

/* ===== Global styles (button only; icon is SVG) ===== */
const SortStyles = createGlobalStyle`
  .clu-thbtn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #ffffff;     /* header text color */
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    justify-content: flex-start; /* overridden per-column when needed */
  }
`;

/* ===== SVG sort icon (dual triangles, tri-state) ===== */
const IconSort = ({ state }) => {
  const passive = "rgba(255,255,255,0.45)";
  const active = "#ffffff";
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true" focusable="false">
      <path d="M5 2 L1 6 H9 Z" fill={state === "asc" ? active : passive} />
      <path d="M5 14 L9 10 H1 Z" fill={state === "desc" ? active : passive} />
    </svg>
  );
};

/* ===== Sort header component (tri-state) ===== */
function SortHeader({ label, path, sortBy, sortDir, onChange, alignRight }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, "asc");
    if (sortDir === "asc") return onChange(path, "desc");
    return onChange(null, null);
  };
  const state = sortBy === path ? sortDir : null;

  return (
    <button
      className="clu-thbtn"
      onClick={next}
      aria-label={`Sort by ${label}`}
      style={{ justifyContent: alignRight ? "flex-end" : "flex-start" }}
    >
      <span>{label}</span>
      <IconSort state={state} />
    </button>
  );
}

/* ===== Theme ===== */
const colors = {
  bg: "#f6f7fb",
  card: "#ffffff",
  text: "#1f2937",
  subtext: "#6b7280",
  primary: "#4556e5",
  border: "#e5e7eb",
  header: "#4657a7",
  headerText: "#ffffff",
  successBg: "#e7f6ec",
  success: "#15803d",
  infoBg: "#e8edff",
  info: "#3b82f6",
};

/* ===== Layout ===== */
const Page = styled.div`
  min-height: 100vh;
  background: ${colors.bg};
  padding: 24px;
  color: ${colors.text};
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
`;

const Breadcrumb = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  color: ${colors.subtext};
  margin-bottom: 14px;
  a { color: ${colors.subtext}; text-decoration: none; }
  span.sep { opacity: 0.6; }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  h2 { margin: 0; font-size: 20px; font-weight: 600; }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ExportButton = styled.button`
  background: #ff6b6b;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  &:hover { filter: brightness(0.98); }
`;

const SearchBox = styled.div`
  background: ${colors.card};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 280px;
  display: flex;
  align-items: center;
  gap: 8px;
  input {
    border: none; outline: none; width: 100%;
    font-size: 14px; color: ${colors.text};
    background: transparent;
  }
`;

/* ===== Table ===== */
const Card = styled.div`
  background: ${colors.card};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  overflow: hidden;
`;

const columnsCss = "90px 1.4fr 1.4fr 1fr 0.9fr 1.2fr 1.1fr"; // 7 columns

const TableHead = styled.div`
  background: ${colors.header};
  color: ${colors.headerText};
  display: grid;
  grid-template-columns: ${columnsCss};
  padding: 14px 16px;
  font-weight: 600;
  font-size: 14px;
`;

const HeadCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${p => p.right && css`justify-content: flex-end;`}
`;

const TableBody = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${columnsCss};
  padding: 16px;
  border-top: 1px solid ${colors.border};
  align-items: center;
  background: #fff;
  &:hover { background: #fafbff; }
`;

const IdLink = styled.a`
  color: ${colors.primary};
  text-decoration: none;
  font-weight: 600;
  &:hover { text-decoration: underline; }
`;

const CustomerCell = styled.div`display: flex; align-items: center; gap: 12px;`;

const Avatar = styled.div`
  width: 36px; height: 36px; border-radius: 50%;
  background: #eef2ff; color: ${colors.primary};
  font-weight: 700; display: inline-flex;
  align-items: center; justify-content: center;
`;

const CustomerText = styled.div`
  line-height: 1.25;
  strong { display: block; font-weight: 600; color: ${colors.text}; }
  small { color: ${colors.subtext}; }
`;

const Badge = styled.span`
  padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block;
  ${p => p.type === "paid"
    ? css`background: ${colors.successBg}; color: ${colors.success};`
    : css`background: ${colors.infoBg}; color: ${colors.info};`}
`;

const Right = styled.div`text-align: right; font-weight: 600;`;

const Footer = styled.div`
  padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;
  color: ${colors.subtext}; gap: 12px; flex-wrap: wrap;
`;

const ShowEntries = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  select {
    border: 1px solid ${colors.border};
    background: ${colors.card};
    padding: 6px 8px; border-radius: 8px;
  }
`;

const Pagination = styled.div`display: inline-flex; gap: 8px; align-items: center;`;

const PageBtn = styled.button`
  border: 1px solid ${colors.border};
  background: ${p => (p.active ? colors.primary : colors.card)};
  color: ${p => (p.active ? "#fff" : colors.text)};
  padding: 8px 12px; border-radius: 8px; cursor: pointer;
  &:disabled { opacity: 0.5; cursor: default; }
`;

/* ===== Utilities & mock data ===== */
const formatCurrency = n => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const originalRows = [
  { id: 11, testCase: "Multiparametric MRI Test", name: "John Doe", email: "john@gmail.com", paymentType: "Stripe", status: "Paid",    date: "2025-11-07 10:03", amount: 331.9 },
  { id: 8,  testCase: "Urine Test for Bladder Cancer", name: "John Doe", email: "john@gmail.com", paymentType: "-",      status: "Pending", date: "2025-11-05 10:06", amount: 61.9  },
  { id: 7,  testCase: "Low-Dose CT Screening for Lung Cancer", name: "John Doe", email: "john@gmail.com", paymentType: "-",      status: "Pending", date: "2025-11-07 10:00", amount: 161.9 },
  { id: 6,  testCase: "Advanced Metabolic & Heart Health Package", name: "John Doe", email: "john@gmail.com", paymentType: "-",      status: "Pending", date: "2025-11-14 09:57", amount: 461.9 },
  { id: 5,  testCase: "Liver & Cholesterol Health Package", name: "John Doe", email: "john@gmail.com", paymentType: "-",      status: "Pending", date: "2025-11-07 10:13", amount: 197.9 },
];

/* ===== Page component ===== */
export default function PaymentList() {
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "id", dir: "desc" }); // null for unsorted

  const handleSortChange = (key, dir) => {
    setPage(1);
    if (!key || !dir) setSort({ key: null, dir: null });
    else setSort({ key, dir });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? originalRows.filter(r =>
          [r.id, r.testCase, r.name, r.email, r.paymentType, r.status, r.date, r.amount]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : originalRows.slice();

    if (!sort.key || !sort.dir) return base;

    const dir = sort.dir === "asc" ? 1 : -1;
    return base.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (sort.key === "amount") return (Number(av) - Number(bv)) * dir;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const exportCSV = () => {
    const rows = [
      ["ID","Test Case","Customer","Email","Payment Type","Status","Date & Time","Total Paid Amount"],
      ...filtered.map(r => [
        `#${r.id}`, r.testCase, r.name, r.email, r.paymentType, r.status, r.date, formatCurrency(r.amount)
      ]),
    ];
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payment-list.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Page>
      <SortStyles />

      <Breadcrumb>
        <a href="#">Dashboard</a>
        <span className="sep">›</span>
        <span>Payment List</span>
      </Breadcrumb>

      <TitleRow>
        <h2>Payment List</h2>
        <Toolbar>
          <ExportButton onClick={exportCSV}>
            <span>⬇</span> Export
          </ExportButton>
          <SearchBox>
            <span role="img" aria-label="search">🔍</span>
            <input
              placeholder="search…"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
            />
          </SearchBox>
        </Toolbar>
      </TitleRow>

      <Card>
        <TableHead>
          <HeadCell>
            <SortHeader label="ID" path="id" sortBy={sort.key} sortDir={sort.dir} onChange={handleSortChange} />
          </HeadCell>

          <HeadCell>Test Case</HeadCell>

          <HeadCell>
            <SortHeader label="Customer" path="name" sortBy={sort.key} sortDir={sort.dir} onChange={handleSortChange} />
          </HeadCell>

          <HeadCell>
            <SortHeader label="Payment Type" path="paymentType" sortBy={sort.key} sortDir={sort.dir} onChange={handleSortChange} />
          </HeadCell>

          <HeadCell>
            <SortHeader label="Status" path="status" sortBy={sort.key} sortDir={sort.dir} onChange={handleSortChange} />
          </HeadCell>

          <HeadCell>
            <SortHeader label="Date & Time" path="date" sortBy={sort.key} sortDir={sort.dir} onChange={handleSortChange} />
          </HeadCell>

          <HeadCell right>
            <SortHeader
              label="Total Paid Amount"
              path="amount"
              sortBy={sort.key}
              sortDir={sort.dir}
              onChange={handleSortChange}
              alignRight
            />
          </HeadCell>
        </TableHead>

        <TableBody>
          {pageRows.map(r => (
            <Row key={r.id}>
              <IdLink href="#">#{r.id}</IdLink>
              <div>{r.testCase}</div>
              <CustomerCell>
                <Avatar>{(r.name || "?").split(" ").map(s => s[0]).join("").slice(0,2)}</Avatar>
                <CustomerText>
                  <strong>{r.name}</strong>
                  <small>{r.email}</small>
                </CustomerText>
              </CustomerCell>
              <div>{r.paymentType}</div>
              <div><Badge type={r.status.toLowerCase() === "paid" ? "paid" : "info"}>{r.status}</Badge></div>
              <div>{r.date}</div>
              <Right>{formatCurrency(r.amount)}</Right>
            </Row>
          ))}
        </TableBody>

        <Footer>
          <ShowEntries>
            <span>Show</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
            <span style={{ marginLeft: 8 }}>
              Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} entries
            </span>
          </ShowEntries>

          <Pagination>
            <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</PageBtn>
            {Array.from({ length: pageCount }).map((_, i) => (
              <PageBtn key={i} active={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PageBtn>
            ))}
            <PageBtn onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</PageBtn>
          </Pagination>
        </Footer>
      </Card>

      <div style={{ marginTop: 18, color: colors.subtext, fontSize: 14 }}>
        Kivilab: Your Ultimate Entertainment Hub (v1.2.1)
      </div>
    </Page>
  );
}
