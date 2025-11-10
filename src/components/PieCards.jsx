// src/components/PieCards.jsx
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444']; // Test, Packages
const EMPTY_COLOR = '#E5E7EB';

const Card = styled.div`
  background: #fff;
  border: 1px solid #F2F4F7;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.06);
  padding: 16px 18px;
  height: 330px;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr auto;
  gap: 12px;
`;
const Title = styled.div`grid-column: 1 / -1; color:#101828; font-weight:600; font-size:20px; line-height:1.3;`;
const Content = styled.div`grid-column: 1 / 2; display:flex; align-items:center; min-height:240px;`;
const ChartWrap = styled.div`width:100%; height:240px;`;
const LegendBox = styled.div`grid-column:2/3; display:flex; flex-direction:column; gap:10px; align-items:flex-start; justify-content:center; padding-right:6px;`;
const LegendItem = styled.div`color:#667085; font-size:14px; display:flex; align-items:center; gap:10px;`;
const Dot = styled.span`width:12px; height:12px; border-radius:50%; display:inline-block; background:${p=>p.color};`;
const EmptyCenter = styled.div`position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#667085; font-weight:600; font-size:14px;`;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RAD = Math.PI / 180;
  const r = (innerRadius + outerRadius) / 2;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  if (!isFinite(percent)) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontWeight="700" fontSize="14">
      {(percent * 100).toFixed(1)}%
    </text>
  );
};

export default function PieCard({ title, data }) {
  const safe = Array.isArray(data) && data.length ? data : [
    { name: 'Test', value: 0 },
    { name: 'Packages', value: 0 },
  ];
  const total = safe.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const isEmpty = total <= 0;

  return (
    <Card style={{padding:"16px 4px"}}>
      <Title>{title}</Title>
      <Content>
        <ChartWrap style={{ position: 'relative' }}>
          <ResponsiveContainer>
            <PieChart>
              {isEmpty ? (
                <Pie
                  data={[{ name: 'empty', value: 1 }]}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={70}
                  outerRadius={95}
                  stroke="#fff"
                  strokeWidth={3}
                >
                  <Cell fill={EMPTY_COLOR} />
                </Pie>
              ) : (
                <Pie
                  data={safe}
                  dataKey="value"
                  nameKey="name"
                  startAngle={90}
                  endAngle={-270}
                  label={renderLabel}
                  labelLine={false}
                  paddingAngle={2}
                  outerRadius={95}
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {safe.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              )}
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          {isEmpty && <EmptyCenter>No data</EmptyCenter>}
        </ChartWrap>
      </Content>
      <LegendBox>
        <LegendItem><Dot color={COLORS[0]} /> Test</LegendItem>
        <LegendItem><Dot color={COLORS[1]} /> Packages</LegendItem>
      </LegendBox>
    </Card>
  );
}
