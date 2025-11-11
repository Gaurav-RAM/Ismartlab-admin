import React, { useMemo, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Search, Plus, Filter as FilterIcon, Edit2 } from 'react-feather';
import {useNavigate } from 'react-router-dom';


const Global = createGlobalStyle`
  :root{
    --brandBlue:#475ec7;
    --danger:#dc3545;
    --text:#343a40;
    --muted:#6c757d;
    --bg:#f7f7fb;
    --card:#ffffff;
    --rowHover:#f5f7ff;
    --border:#e9ecef;
  }
  body { background: var(--bg); }
`;

const Page = styled.div`
  padding: 20px;
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
`;

const Breadcrumb = styled.div`
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 12px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  line-height: 1;
  color: #fff;
  background: ${p => p.variant === 'danger' ? 'var(--danger)' : 'var(--brandBlue)'};

  &:hover { opacity: .95; }
`;

const SearchWrap = styled.label`
  display: inline-flex;
  align-items: center;
  height: 38px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 6px;
  padding: 0 10px;
  gap: 8px;

  input{
    border: 0;
    outline: 0;
    font-size: 14px;
    width: 220px;
  }
`;

const Card = styled.div`
  background: var(--card);
  border: 0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  overflow: hidden;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  thead th{
    background: var(--brandBlue);
    color: #fff;
    padding: 14px 16px;
    font-weight: 600;
    text-align: left;
  }
  tbody td{
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    vertical-align: middle;
  }
  tbody tr:hover { background: var(--rowHover); }
`;

const LabCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e9ecff;
  color: var(--brandBlue);
  font-weight: 700;
  font-size: 12px;
`;

const Meta = styled.div`
  line-height: 1.2;
  .name { font-weight: 600; }
  .email { color: var(--muted); font-size: 12px; }
`;

const ActionLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0d6efd;
  background: transparent;
  border: 0;
  padding: 4px;
  cursor: pointer;
`;

const TableFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
  flex-wrap: wrap;
  gap: 10px;
`;

const Length = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  select{
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0 8px;
    background:#fff;
  }
`;

const Pager = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  button{
    height: 30px;
    min-width: 34px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--text);
    cursor: pointer;
  }
  .active{
    background: #6c7ae0;
    color: #fff;
    border-color: #6c7ae0;
  }
`;

const FootNote = styled.div`
  color: #8b8b8b;
  font-size: 12px;
  text-align: center;
  padding: 14px 0;
`;

const ModalScrim = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display: ${p => p.open ? 'grid' : 'none'};
  place-items: center;
  z-index: 40;
`;

const ModalCard = styled.div`
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,.2);
  overflow: hidden;
`;

const ModalHead = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 700;
`;

const ModalBody = styled.div`
  padding: 16px;
  display: grid;
  gap: 12px;

  label{ font-size: 13px; color: var(--muted); }
  input{
    height: 38px; border: 1px solid var(--border); border-radius: 8px; padding: 0 10px;
  }
`;

const ModalFoot = styled.div`
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 8px;
`;

function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
}

const seedRows = [
  {
    name: 'Spectrum Health Diagnostics',
    email: 'diagnostics@spectrum.com',
    days: 'monday,tuesday,wednesday,thursday,friday,saturday'
  },
  {
    name: 'Precision Medical Lab',
    email: 'support@medlab.com',
    days: 'monday,tuesday,wednesday,thursday,friday,saturday'
  },
  {
    name: 'Advanced Diagnostics Lab',
    email: 'info@diagnostics.com',
    days: 'monday,tuesday,wednesday,thursday,friday,saturday'
  }
];

export default function CollectorLabSessionPage(){
     const navigate = useNavigate(); 

  const [q, setQ] = useState('');
  const [len, setLen] = useState(5);
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if(!term) return seedRows;
    return seedRows.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.days.toLowerCase().includes(term)
    );
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / len));
  const shown = useMemo(() => {
    const start = (page - 1) * len;
    return filtered.slice(start, start + len);
  }, [filtered, page, len]);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));

  React.useEffect(() => { setPage(1); }, [q, len]);

  return (
    <>
      <Global/>
      <Page>
        <Breadcrumb>Dashboard › Lab Session</Breadcrumb>

        <TopBar>
          <LeftGroup>
            <Button style={{height:"40px"}} variant="danger">Export</Button>
          </LeftGroup>

          <RightGroup>
            <SearchWrap style={{height:"40px"}}>
              <Search size={16} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="search..."
              />
            </SearchWrap>

            <Button style={{height:"40px"}}  onClick={() => navigate("session")}>
              <Plus size={18}/> New
            </Button>

            <Button  style={{height:"40px"}}variant="danger" onClick={() => setOpenFilter(true)}>
              <FilterIcon size={18}/> Advanced Filter
            </Button>
          </RightGroup>
        </TopBar>

        <Card>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th style={{width:'55%'}}>Name</th>
                  <th style={{width:'35%'}}>Day</th>
                  <th style={{width:'10%'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <LabCell>
                        <Avatar>{getInitials(r.name)}</Avatar>
                        <Meta>
                          <div className="name">{r.name}</div>
                          <div className="email">{r.email}</div>
                        </Meta>
                      </LabCell>
                    </td>
                    <td>{r.days}</td>
                    <td>
                      <ActionLink title="Edit">
                        <Edit2 size={18}/>
                      </ActionLink>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={3} style={{color:'var(--muted)'}}>No results</td></tr>
                )}
              </tbody>
            </Table>
          </TableWrap>

          <TableFooter>
            <Length>
              <span>Show</span>
              <select value={len} onChange={e => setLen(Number(e.target.value))}>
                {[5,10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </Length>

            <div>Showing {shown.length ? ( (page-1)*len + 1 ) : 0} to {Math.min(page*len, filtered.length)} of {filtered.length} entries</div>

            <Pager>
              <button onClick={goPrev}>Previous</button>
              <button className="active">{page}</button>
              <button onClick={goNext}>Next</button>
            </Pager>
          </TableFooter>
        </Card>

        <FootNote>Kivilab: Your Ultimate Entertainment Hub (v1.2.1)</FootNote>
      </Page>

    </>
  );
}
