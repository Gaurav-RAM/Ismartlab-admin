import React, { useState } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';

// Firestore (v9 modular)
import { db } from '../../firebase.js'; // <-- ensure this exports an initialized Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {useNavigate } from 'react-router-dom';

const theme = {
  colors: {
    bg: '#f6f7fb',
    card: '#ffffff',
    border: '#e6e8ee',
    text: '#1f2937',
    muted: '#6b7280',
    primary: '#4f46e5',
    danger: '#ef4444',
    primaryText: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    link: '#4b5563',
    linkHover: '#111827'
  },
  radii: { card: '8px', input: '6px', pill: '999px' },
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)',
  space: (n) => `${4 * n}px`,
  font: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
};

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background: ${p => p.theme.colors.bg};
    color: ${p => p.theme.colors.text};
    font-family: ${p => p.theme.font};
  }
`;

const initialDays = [
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
].map(name => ({ name, enabled: false, start: '09:00', end: '18:00', breaks: [] }));

export default function LabSessionPage() {
       const navigate = useNavigate(); 
  const [days, setDays] = useState(initialDays); // state drives rows and buttons
  const [labId, setLabId] = useState('');        // controlled lab selection
  const [saving, setSaving] = useState(false);    // saving flag

  const addBreak = (dayIdx) => {
    setDays(prev => {
      const next = [...prev];
      next[dayIdx] = {
        ...next[dayIdx],
        breaks: [
          ...next[dayIdx].breaks,
          { id: Date.now() + Math.floor(Math.random() * 1000), start: '', end: '' }
        ]
      };
      return next;
    });
  };

  const removeBreak = (dayIdx, breakId) => {
    setDays(prev => {
      const next = [...prev];
      next[dayIdx] = {
        ...next[dayIdx],
        breaks: next[dayIdx].breaks.filter(b => b.id !== breakId)
      };
      return next;
    });
  };

  const setBreakField = (dayIdx, breakId, field, value) => {
    setDays(prev => {
      const next = [...prev];
      next[dayIdx] = {
        ...next[dayIdx],
        breaks: next[dayIdx].breaks.map(b => (b.id === breakId ? { ...b, [field]: value } : b))
      };
      return next;
    });
  };

  // Save to Firestore: creates lab_sessions doc with schedule for selected lab
  const handleSave = async () => {
    if (saving) return; // prevent double clicks
    setSaving(true);

    try {
      if (!labId) {
        alert('Please select a lab first');
        return;
      }

      const payload = {
        labId,
        days: days.map(d => ({
          name: d.name,
          enabled: d.enabled,
          start: d.start,
          end: d.end,
          breaks: d.breaks.map(b => ({ start: b.start, end: b.end })) // strip local ids
        })),
        createdAt: serverTimestamp(),
      };

      // optional debug
      // console.log('Saving payload', payload);

      await addDoc(collection(db, 'lab_sessions'), payload); // creates collection on first write
      setLabId('');
      setDays(initialDays);
      alert('Session saved');
      navigate("labsession")
    } catch (err) {
      console.error(err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Breadcrumb>Dashboard › New Lab Session</Breadcrumb>

        <Card>
          <CardTitle>Basic Information</CardTitle>
          <Row>
            <Label htmlFor="lab">Select Lab</Label>
            <Select
              id="lab"
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
            >
              <option value="" disabled>Select Lab</option>
              <option value="lab-a">Lab A</option>
              <option value="lab-b">Lab B</option>
            </Select>
            <HelpNote>
              Note: If all lab sessions are created, the select option will be blank.
            </HelpNote>
          </Row>
        </Card>

        <Card>
          <CardTitle>Business Hours</CardTitle>

          {days.map((day, idx) => (
            <DayGroup key={day.name}>
              <DayRow>
                <Left>
                  <Checkbox
                    type="checkbox"
                    checked={day.enabled}
                    onChange={e =>
                      setDays(d => {
                        const next = [...d];
                        next[idx] = { ...next[idx], enabled: e.target.checked };
                        return next;
                      })
                    }
                  />
                  <DayLabel>{day.name}</DayLabel>
                </Left>

                <TimeGroup>
                  <TimeInput
                    type="time"
                    value={day.start}
                    onChange={e =>
                      setDays(d => {
                        const next = [...d];
                        next[idx] = { ...next[idx], start: e.target.value };
                        return next;
                      })
                    }
                  />
                  <Dash>—</Dash>
                  <TimeInput
                    type="time"
                    value={day.end}
                    onChange={e =>
                      setDays(d => {
                        const next = [...d];
                        next[idx] = { ...next[idx], end: e.target.value };
                        return next;
                      })
                    }
                  />
                </TimeGroup>

                <Right>
                  <AddBreakButton type="button" onClick={() => addBreak(idx)}>
                    Add Break
                  </AddBreakButton>
                </Right>
              </DayRow>

              {day.breaks.map(br => (
                <BreakRow key={br.id}>
                  <BreakLeft>Break</BreakLeft>
                  <TimeGroup>
                    <TimeInput
                      type="time"
                      placeholder="--:--"
                      value={br.start}
                      onChange={e => setBreakField(idx, br.id, 'start', e.target.value)}
                    />
                    <Dash>—</Dash>
                    <TimeInput
                      type="time"
                      placeholder="--:--"
                      value={br.end}
                      onChange={e => setBreakField(idx, br.id, 'end', e.target.value)}
                    />
                  </TimeGroup>

                  <Right>
                    <RemoveButton type="button" onClick={() => removeBreak(idx, br.id)}>
                      Remove
                    </RemoveButton>
                  </Right>
                </BreakRow>
              ))}
            </DayGroup>
          ))}
        </Card>

        <SaveBar>
          <BackButton type="button">Back</BackButton>
          {/* Only disable during saving so onClick always fires and can validate */}
          <SaveButton type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </SaveButton>
        </SaveBar>
      </Page>
    </ThemeProvider>
  );
}

/* styled-components remain unchanged */

const Page = styled.div`
  width: 100%;
  min-height: 100%;
  padding: ${p => p.theme.space(6)};
  display: flex;
  flex-direction: column;
  gap: ${p => p.theme.space(6)};
`;

const Breadcrumb = styled.div`
  font-size: 14px;
  color: ${p => p.theme.colors.muted};
`;

const Card = styled.section`
  background: ${p => p.theme.colors.card};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.card};
  box-shadow: ${p => p.theme.shadow};
  padding: ${p => p.theme.space(5)};
  display: flex;
  flex-direction: column;
  gap: ${p => p.theme.space(4)};
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 180px minmax(240px, 560px);
  align-items: start;
  gap: ${p => p.theme.space(3)};
`;

const Label = styled.label`
  font-size: 14px;
  color: ${p => p.theme.colors.muted};
  align-self: center;
`;

const Select = styled.select`
  height: 40px;
  padding: 0 ${p => p.theme.space(3)};
  border-radius: ${p => p.theme.radii.input};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  width: 100%;
  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
    outline: none;
  }
`;

const HelpNote = styled.p`
  grid-column: 2 / 3;
  margin: ${p => p.theme.space(1)} 0 0;
  font-size: 12px;
  color: ${p => p.theme.colors.muted};
`;

const DayGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${p => p.theme.space(2)};
`;

const DayRow = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr auto;
  align-items: center;
  gap: ${p => p.theme.space(3)};
  padding: ${p => p.theme.space(2)} 0;
  border-top: 1px solid ${p => p.theme.colors.border};
  &:first-of-type { border-top: 0; }
`;

const BreakRow = styled(DayRow)`
  grid-template-columns: 240px 1fr auto;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.theme.space(2)};
  min-width: 0;
`;

const BreakLeft = styled(Left)`
  color: ${p => p.theme.colors.muted};
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${p => p.theme.colors.primary};
`;

const DayLabel = styled.span`
  font-size: 14px;
  color: ${p => p.theme.colors.text};
`;

const TimeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.theme.space(2)};
  min-width: 0;
`;

const TimeInput = styled.input`
  width: 140px;
  height: 40px;
  padding: 0 ${p => p.theme.space(3)};
  border-radius: ${p => p.theme.radii.input};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
    outline: none;
  }
`;

const Dash = styled.span`
  color: ${p => p.theme.colors.muted};
`;

const Right = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const AddBreakButton = styled.button`
  height: 36px;
  padding: 0 ${p => p.theme.space(3)};
  color: ${p => p.theme.colors.link};
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${p => p.theme.radii.pill};
  cursor: pointer;
  &:hover {
    color: ${p => p.theme.colors.linkHover};
    background: #f3f4f6;
    border-color: ${p => p.theme.colors.border};
  }
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 ${p => p.theme.space(4)};
  background: ${p => p.theme.colors.danger};
  color: #fff;
  border: 1px solid ${p => p.theme.colors.danger};
  border-radius: ${p => p.theme.radii.input};
  cursor: pointer;
  white-space: nowrap;
  &:hover { filter: brightness(0.95); }
`;

const SaveBar = styled.div`
  margin-top: ${p => p.theme.space(2)};
  display: flex;
  justify-content: flex-end;
  gap: ${p => p.theme.space(2)};
`;

const BackButton = styled.button`
  height: 40px;
  padding: 0 ${p => p.theme.space(4)};
  background: #eef2ff;
  color: ${p => p.theme.colors.primary};
  border: 1px solid #e0e7ff;
  border-radius: ${p => p.theme.radii.input};
  cursor: pointer;
  &:hover { filter: brightness(0.98); }
`;

const SaveButton = styled.button`
  height: 40px;
  padding: 0 ${p => p.theme.space(5)};
  background: ${p => p.theme.colors.primary};
  color: ${p => p.theme.colors.primaryText};
  border: 1px solid ${p => p.theme.colors.primary};
  border-radius: ${p => p.theme.radii.input};
  cursor: pointer;
  &:hover { filter: brightness(0.95); }
`;
