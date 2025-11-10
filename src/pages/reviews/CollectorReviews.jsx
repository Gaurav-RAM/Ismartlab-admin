import React, { useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

/* -------- Sort header (as asked) -------- */
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

const Global = createGlobalStyle`
  :root{
    --bg:#f4f5f8;
    --card:#ffffff;
    --ink:#2d3142;
    --muted:#8c92a4;
    --line:#e7e9f0;
    --brand:#5661d7;
    --brand-600:#4c56c8;
    --danger:#f26363;
    --accent:#f7f8fd;
    --ring:#94b0ff55;
  }
  body{ background:var(--bg); }
  * { box-sizing: border-box; }

  /* Sort header button matches purple header cells */
  .clu-thbtn{
    display:flex;
    align-items:center;
    gap:10px;
    width:100%;
    background:transparent;
    border:0;
    color:inherit;           /* inherits white from TH */
    font: inherit;
    padding: 0;              /* TH provides padding */
    cursor:pointer;
  }
  .clu-thbtn > span:first-child{ pointer-events:none; }

  /* Stacked chevrons */
  .clu-sort{
    margin-left:auto;        /* pushes icon to right */
    position:relative;
    width:10px; height:16px;
  }
  .clu-sort::before, .clu-sort::after{
    content:"";
    display:block;
    width:0; height:0;
    border-left:5px solid transparent;
    border-right:5px solid transparent;
  }
  /* Up triangle */
  .clu-sort::before{
    border-bottom:6px solid rgba(255,255,255,.75);
    margin-bottom:3px;
  }
  /* Down triangle */
  .clu-sort::after{
    border-top:6px solid rgba(255,255,255,.75);
  }
  /* Active states */
  .clu-sort.asc::before { border-bottom-color: rgba(255,255,255,1); }
  .clu-sort.asc::after  { border-top-color:    rgba(255,255,255,.55); }
  .clu-sort.desc::before{ border-bottom-color: rgba(255,255,255,.55); }
  .clu-sort.desc::after { border-top-color:    rgba(255,255,255,1); }
`;

export default function CollectorReviews() {
  const [rows] = useState([]);
  const [selected, setSelected] = useState({});
  const [pageSize, setPageSize] = useState(5);

  const [sortBy, setSortBy] = useState(null);   // "collector" | "labs" | "customer" | "rating" | "review" | null
  const [sortDir, setSortDir] = useState(null); // "asc" | "desc" | null
  const onSortChange = (key, dir) => { setSortBy(key); setSortDir(dir); };

  const allChecked = useMemo(
    () => rows.length > 0 && rows.every(r => selected[r.id]),
    [rows, selected]
  );

  const toggleAll = () => {
    const next = {};
    if (!allChecked) rows.forEach(r => (next[r.id] = true));
    setSelected(next);
  };

  const toggleOne = (id) =>
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <Screen>
      <Global />

      <HeaderRow>
        <Crumbs>
          <Crumb>Dashboard</Crumb>
          <Sep>›</Sep>
          <Crumb $active>Reviews</Crumb>
        </Crumbs>
        <RightTop />
      </HeaderRow>

      <Toolbar>
        <LeftGroup>
          <Select aria-label="Bulk action" defaultValue="">
            <option value="" disabled>No action</option>
            <option value="delete">Delete</option>
            <option value="export">Export selected</option>
          </Select>
          <PrimaryButton disabled>Apply</PrimaryButton>
          <DangerButton>Export</DangerButton>
        </LeftGroup>
        <RightGroup>
          <Select aria-label="Collectors filter" defaultValue="all">
            <option value="all">Collectors</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <SearchBox placeholder="search..." />
        </RightGroup>
      </Toolbar>

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Row $head>
                <ThCheck>
                  <Checkbox
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                </ThCheck>

                <Th $sortable>
                  <SortHeader
                    label="Collector Name"
                    path="collector"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onChange={onSortChange}
                  />
                </Th>

                <Th $sortable>
                  <SortHeader
                    label="Labs"
                    path="labs"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onChange={onSortChange}
                  />
                </Th>

                <Th $sortable>
                  <SortHeader
                    label="Customer Name"
                    path="customer"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onChange={onSortChange}
                  />
                </Th>

                <Th $sortable>
                  <SortHeader
                    label="Rating"
                    path="rating"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onChange={onSortChange}
                  />
                </Th>

                <Th $sortable>
                  <SortHeader
                    label="Review"
                    path="review"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onChange={onSortChange}
                  />
                </Th>

                <Th $center>
                  <span>Action</span>
                </Th>
              </Row>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <TdEmpty colSpan={7}>
                    No Data Found
                  </TdEmpty>
                </tr>
              ) : (
                rows.map(r => (
                  <Row key={r.id}>
                    <TdCheck>
                      <Checkbox
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggleOne(r.id)}
                      />
                    </TdCheck>
                    <Td>{r.collector}</Td>
                    <Td>{r.lab}</Td>
                    <Td>{r.customer}</Td>
                    <Td>
                      <Rating>{r.rating?.toFixed(1) ?? "-"}</Rating>
                    </Td>
                    <Td $clamp>{r.review}</Td>
                    <Td $center>
                      <GhostButton>⋯</GhostButton>
                    </Td>
                  </Row>
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>

        <CardFooter>
          <FooterLeft>
            <span>Show</span>
            <MiniSelect
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[5, 10, 25, 50].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </MiniSelect>
            <span>entries</span>
            <MutedText>Showing 0 to 0 of 0 entries</MutedText>
          </FooterLeft>

          <FooterRight>
            <GhostButton disabled>Previous</GhostButton>
            <GhostButton disabled>Next</GhostButton>
          </FooterRight>
        </CardFooter>
      </Card>
    </Screen>
  );
}

/* Layout */
const Screen = styled.div`
  padding: 24px;
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
`;

const HeaderRow = styled.div`
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom: 16px;
`;
const Crumbs = styled.div`display:flex; gap:8px; align-items:center; color:var(--muted);`;
const Crumb = styled.span`
  color: ${({$active}) => ($active ? "var(--ink)" : "var(--muted)")};
  font-weight:${({$active}) => ($active ? 600 : 500)};
`;
const Sep = styled.span`opacity:.6;`;
const RightTop = styled.div``;

const Toolbar = styled.div`
  display:flex; justify-content:space-between; align-items:center; gap:16px;
  flex-wrap:wrap; margin-bottom: 14px;
`;
const LeftGroup = styled.div`display:flex; align-items:center; gap:12px;`;
const RightGroup = styled(LeftGroup)``;

/* Inputs and buttons */
const focusRing = `
  &:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 3px var(--ring);
  }
`;

const Select = styled.select`
  height:44px; min-width:170px;
  background: var(--accent);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0 14px;
  color: var(--ink);
  ${focusRing}
`;

const MiniSelect = styled.select`
  height:36px; min-width:64px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 8px;
  color: var(--ink);
  ${focusRing}
`;

const BaseButton = styled.button`
  height:44px; padding:0 18px; border:none; border-radius:10px; font-weight:600;
  display:inline-flex; align-items:center; gap:8px; cursor:pointer;
  transition: transform .02s ease, box-shadow .2s ease, background .2s ease, filter .2s ease;
  &:disabled{opacity:.6; cursor:not-allowed;}
  &:active{ transform: translateY(1px); }
  ${focusRing}
`;
const PrimaryButton = styled(BaseButton)`
  color: #fff; background: var(--brand);
  &:hover{ background: var(--brand-600); }
`;
const DangerButton = styled(BaseButton)`
  color:#fff; background: var(--danger);
  &:hover{ filter: brightness(.95); }
`;
const GhostButton = styled(BaseButton)`
  background: transparent; color: var(--ink); border: 1px solid var(--line);
  height:36px; border-radius:8px; padding:0 12px;
  &:hover{ background:#fff; }
`;

const SearchBox = styled.input.attrs({ type: "search" })`
  height:44px; min-width:260px; width:320px; max-width:100%;
  background:#fff; border: 1px solid var(--line);
  border-radius: 10px; padding: 0 14px;
  ${focusRing}
`;

/* Card + table */
const Card = styled.div`
  background: var(--card);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(16,24,40,.04), 0 12px 24px rgba(16,24,40,.06);
  overflow: hidden;
`;

const TableWrap = styled.div`
  overflow:auto;
`;

const Table = styled.table`
  width:100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const Row = styled.tr`
  background: ${({$head}) => ($head ? "var(--brand)" : "transparent")};
  color: ${({$head}) => ($head ? "#fff" : "inherit")};
  border-bottom: ${({$head}) => ($head ? "none" : `1px solid var(--line)`)};
  &:hover td{ background: ${({$head}) => ($head ? "inherit" : "#fbfcff")}; }
`;

const ThBase = styled.th`
  padding: 14px 16px;
  text-align: left;
  white-space: nowrap;
  font-weight: 600;
  position: relative;
  border-right: 1px solid rgba(255,255,255,.16);
  &:last-child{ border-right:none; }
  ${({$center}) => $center && "text-align:center;"}
`;

/* No ::after; SortHeader provides icon */
const Th = styled(ThBase)`
  cursor: ${({$sortable}) => ($sortable ? "pointer" : "default")};
  transition: background .15s ease-in-out;
  &:hover{
    background: ${({$sortable}) => ($sortable ? "var(--brand-600)" : "inherit")};
  }
`;

const ThCheck = styled(ThBase)`
  width:44px; text-align:center;
`;

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  background: #fff;
  vertical-align: middle;
  ${({$center}) => $center && "text-align:center;"}
  ${({$clamp}) => $clamp && `
    max-width: 420px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;
const TdCheck = styled(Td)` width:44px; text-align:center; `;

const TdEmpty = styled.td`
  padding: 32px 16px;
  text-align: center;
  color: var(--muted);
  font-weight: 600;
  background:#fff;
`;

const Checkbox = styled.input`
  width: 18px; height: 18px; cursor: pointer;
`;

const Rating = styled.span`
  display:inline-flex; align-items:center; justify-content:center;
  min-width:38px; height:28px; padding:0 8px; border-radius: 999px;
  background: #fff3c4; color: #7a5d00; font-weight: 700; font-variant-numeric: tabular-nums;
  border: 1px solid #ffe58f;
`;

const CardFooter = styled.div`
  display:flex; justify-content:space-between; align-items:center;
  gap:12px; padding: 12px 16px;
  background:#fafbfe;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
`;
const FooterLeft = styled.div`display:flex; align-items:center; gap:10px; color:var(--ink);`;
const FooterRight = styled.div`display:flex; align-items:center; gap:8px;`;
const MutedText = styled.span`color: var(--muted); margin-left: 8px;`;
