import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444'];

export default function PieCard({ title, data }) {
  return (
    <div className="card cols-6">
      <div className="chart-title">{title}</div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        <div><span className="dot" style={{ background: COLORS[0] }} />Test</div>
        <div><span className="dot" style={{ background: COLORS[1] }} />Packages</div>
      </div>
    </div>
  );
}
