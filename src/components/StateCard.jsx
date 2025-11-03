export default function StatCard({ label, value, icon }) {
  return (
    <div className="card">
      <div className="stat">
        <div>
          <div className="label">{label}</div>
          <div className="value">{value}</div>
        </div>
        <div className="icon">{icon}</div>
      </div>
    </div>
  );
}
