import React, { useEffect, useState } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const theme = {
  colors: {
    primary: '#4C63B6',
    primaryText: '#FFFFFF',
    border: '#E5E7EB',
    muted: '#6B7280',
    bg: '#FFFFFF',
    danger: '#EF4444',
    surface: '#F9FAFB',
    link: '#2563EB',
    successText: '#065F46',
    successBg: '#D1FAE5',
    warnText: '#92400E',
    warnBg: '#FEF3C7',
    errorText: '#991B1B',
    errorBg: '#FEE2E2',
    inputBg: '#FFFFFF',
    inputBorder: '#D1D5DB',
  },
  radii: { sm: '6px', md: '10px' },
  space: { xs: '6px', sm: '10px', md: '14px', lg: '20px' },
  font: { base: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", size: '14px' },
};

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    font-family: ${p => p.theme.font.base};
    font-size: ${p => p.theme.font.size};
    background: ${p => p.theme.colors.surface};
    color: #111827;
  }
`;

const Page = styled.div`padding: ${p => p.theme.space.lg};`;
const Breadcrumb = styled.div`
  display: flex; align-items: center; gap: ${p => p.theme.space.xs};
  color: ${p => p.theme.colors.muted}; margin-bottom: ${p => p.theme.space.md};
  strong { color: #111827; font-weight: 600; }
`;
const Sep = styled.span`opacity: 0.6;`;

const Toolbar = styled.div`
  display: flex; justify-content: space-between; gap: ${p => p.theme.space.md};
  flex-wrap: wrap; margin-bottom: ${p => p.theme.space.md};
`;
const LeftGroup = styled.div`display: flex; gap: ${p => p.theme.space.sm}; align-items: center;`;
const RightGroup = styled.div`display: flex; gap: ${p => p.theme.space.sm}; align-items: center;`;

const Select = styled.select`
  height: 38px; padding: 0 ${p => p.theme.space.sm};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  background: ${p => p.theme.colors.inputBg};
  border-radius: ${p => p.theme.radii.sm}; color: #111827; outline: none;
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 3px rgba(76,99,182,.15); }
`;
const Button = styled.button`
  height: 38px; padding: 0 ${p => p.theme.space.lg};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  background: #E5E7EB; color: #6B7280;
  border-radius: ${p => p.theme.radii.sm}; cursor: not-allowed;
`;
const DangerButton = styled(Button)`
  background: ${p => p.theme.colors.danger}; border-color: ${p => p.theme.colors.danger};
  color: white; cursor: pointer; &:hover { filter: brightness(.95); }
`;
const SearchInput = styled.input.attrs({ type: 'search' })`
  height: 38px; min-width: 260px; padding: 0 ${p => p.theme.space.sm};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  background: ${p => p.theme.colors.inputBg};
  border-radius: ${p => p.theme.radii.sm}; outline: none;
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 3px rgba(76,99,182,.15); }
`;

const TableCard = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bg}; border-radius: ${p => p.theme.radii.md};
  overflow: hidden;
`;
const TableWrapper = styled.div`width: 100%; overflow-x: auto;`;
const Table = styled.table`width: 100%; border-collapse: separate; border-spacing: 0;`;

const HeaderRow = styled.tr`background: ${p => p.theme.colors.primary}; color: ${p => p.theme.colors.primaryText};`;
const Th = styled.th`
  text-align: left; padding: 12px 14px; font-weight: 600; position: relative;
  ${p => p.sortable && `cursor: pointer;`}
`;
const Tr = styled.tr`&:nth-child(even) td { background: ${p => p.theme.colors.surface}; }`;
const Td = styled.td`padding: 12px 14px; border-top: 1px solid ${p => p.theme.colors.border}; color: #111827;`;
const Checkbox = styled.input`width: 16px; height: 16px;`;

const RowFlex = styled.div`display: flex; align-items: center; gap: 12px;`;
const Avatar = styled.div`
  width: 34px; height: 34px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px;
  color: ${p => p.soft ? '#374151' : '#111827'};
  background: ${p => p.soft ? '#E5E7EB' : '#D1D5DB'};
`;
const TwoLine = styled.div`
  .name { font-weight: 600; line-height: 1.1; }
`;
const EmailText = styled.span`
  color: ${p => p.theme.colors.link}; line-height: 1.1;
`;

const StatusPill = styled.span`
  display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
  color: ${p => p.theme.colors.successText}; background: ${p => p.theme.colors.successBg};
  ${p => p.$status === 'Pending' && `color: ${p.theme.colors.warnText}; background: ${p.theme.colors.warnBg};`}
  ${p => p.$status === 'Rejected' && `color: ${p.theme.colors.errorText}; background: ${p.theme.colors.errorBg};`}
`;

const RowActions = styled.div`display: flex; gap: 10px;`;
const IconButton = styled.button`
  border: 0; background: transparent; padding: 4px 6px; border-radius: 6px; cursor: pointer;
  &:hover { background: rgba(76,99,182,.08); }
`;

const FooterBar = styled.div`
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  gap: ${p => p.theme.space.sm}; padding: ${p => p.theme.space.sm} ${p => p.theme.space.md};
  border-top: 1px solid ${p => p.theme.colors.border};
`;
const ShowEntries = styled.div`display: flex; align-items: center; gap: 6px;`;
const ResultsText = styled.div`color: ${p => p.theme.colors.muted}; text-align: center;`;
const Pagination = styled.div`display: flex; justify-content: flex-end; gap: 8px;`;
const PageButton = styled.button`
  height: 34px; padding: 0 12px; border-radius: ${p => p.theme.radii.sm};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  background: ${p => p.theme.colors.bg}; color: #111827; cursor: pointer;
  &:disabled { color: ${p => p.theme.colors.muted}; background: #F3F4F6; cursor: not-allowed; }
`;

function getInitials(full) {
  const parts = (full || '').trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

export default function AllPrescriptions() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const col = collection(db, 'prescriptions'); // Change to your collection name if needed
    const unsub = onSnapshot(col, (snap) => {
      setRows(
        snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            customer: {
              name: d?.customer?.name ?? '—',
              email: d?.customer?.email ?? '—'
            },
            uploadedAt: d?.uploadedAt ?? '—',
            lab: {
              name: d?.lab?.name ?? '—',
              email: d?.lab?.email ?? '—'
            },
            status: d?.status ?? 'Inactive'
          };
        })
      );
    });
    return unsub;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Breadcrumb>
          <span>Dashboard</span>
          <Sep>›</Sep>
          <strong>All Prescriptions</strong>
        </Breadcrumb>

        <Toolbar>
          <LeftGroup>
            <Select aria-label="Bulk action">
              <option>No action</option>
              <option>Delete</option>
              <option>Mark as reviewed</option>
            </Select>
            <Button disabled>Apply</Button>
            <DangerButton>Export</DangerButton>
          </LeftGroup>
          <RightGroup>
            <Select aria-label="Status filter">
              <option>All</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </Select>
            <SearchInput placeholder="search..." />
          </RightGroup>
        </Toolbar>

        <TableCard>
          <TableWrapper>
            <Table>
              <thead>
                <HeaderRow>
                  <Th style={{ width: 48 }}>
                    <Checkbox type="checkbox" aria-label="Select all" />
                  </Th>
                  <Th sortable>Customer</Th>
                  <Th sortable>Uploaded At</Th>
                  <Th sortable>Lab</Th>
                  <Th sortable>Status</Th>
                  <Th style={{ width: 110 }}>Action</Th>
                </HeaderRow>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td><Checkbox type="checkbox" aria-label={`Select ${r.customer.name}`} /></Td>
                    <Td>
                      <RowFlex>
                        <Avatar>{getInitials(r.customer.name)}</Avatar>
                        <TwoLine>
                          <div className="name">{r.customer.name}</div>
                          <EmailText>{r.customer.email}</EmailText>
                        </TwoLine>
                      </RowFlex>
                    </Td>
                    <Td>{r.uploadedAt}</Td>
                    <Td>
                      <RowFlex>
                        <Avatar soft>{getInitials(r.lab.name)}</Avatar>
                        <TwoLine>
                          <div className="name">{r.lab.name}</div>
                          <EmailText>{r.lab.email}</EmailText>
                        </TwoLine>
                      </RowFlex>
                    </Td>
                    <Td>
                      <StatusPill $status={r.status}>{r.status}</StatusPill>
                    </Td>
                    <Td>
                      <RowActions>
                        <IconButton aria-label="View">👁️</IconButton>
                        <IconButton aria-label="Delete">🗑️</IconButton>
                      </RowActions>
                    </Td>
                  </Tr>
                ))}
                {rows.length === 0 && (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center', color: '#6B7280', padding: "30px" }}>
                      No prescriptions found
                    </Td>
                  </Tr>
                )}
              </tbody>
            </Table>
          </TableWrapper>

          <FooterBar>
            <ShowEntries>
              <span>Show</span>
              <Select style={{ width: 64, marginInline: 8 }}>
                {[5, 10, 25, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
              <span>entries</span>
            </ShowEntries>
            <ResultsText>Showing 1 to {rows.length} of {rows.length} entries</ResultsText>
            <Pagination>
              <PageButton disabled>Previous</PageButton>
              <PageButton disabled>Next</PageButton>
            </Pagination>
          </FooterBar>
        </TableCard>
      </Page>
    </ThemeProvider>
  );
}
