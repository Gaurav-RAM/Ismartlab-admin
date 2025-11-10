// StatCard.jsx
import styled from 'styled-components';

const Card = styled.div`
  height: 145px;
  background: #ffffff;
  border: 1px solid #F2F4F7;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
  padding: 16px 18px;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr auto;
  gap: 8px;
`;

const Label = styled.div`
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  color: #667085;       /* muted label */
  font-size: 12px;
  line-height: 1.3;
  font-weight: 500;
`;

const BottomRow = styled.div`
  grid-column: 1 / -1;
  grid-row: 2 / 3;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const Value = styled.div`
  color: #101828;       /* dark text */
  font-weight: 700;
  font-size: 28px;      /* prominent figure */
  letter-spacing: 0.2px;
`;

const IconWrap = styled.div`
  color: #6676F5;       /* blue accent */
  font-size: 40px;
  line-height: 1;
  display: flex;
  align-items: flex-end;

  /* If an SVG icon is passed, size it here */
  svg, img {
    width: 40px;
    height: 40px;
  }
`;

export default function StatCard({ label, value, icon }) {
  return (
    <Card>
      <Label>{label}</Label>
      <BottomRow>
        <Value>{value}</Value>
        <IconWrap aria-hidden="true">{icon}</IconWrap>
      </BottomRow>
    </Card>
  );
}

/* Example usage:
<StatCard
  label="Total Pending Payout"
  value="$137.00"
  icon={<HandCoinsIcon />}  // any React node
/>
*/
