// src/pages/sessions/LabSessionEditor.jsx
import React, { useMemo, useState } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import { useNavigate, Link as RouterLink } from "react-router-dom";


// Theme
const theme = {
  colors: {
    bg: "#f5f6f8",
    card: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
    primary: "#3b82f6",
    border: "#e5e7eb",
    line: "#e5e7eb",
    focus: "rgba(59,130,246,0.35)",
    success: "#16a34a",
    danger: "#ef4444",
    link: "#2563eb",
  },
  radius: { sm: "6px", md: "10px", lg: "12px" },
  shadow: { sm: "0 1px 2px rgba(0,0,0,0.04)", md: "0 6px 18px rgba(17,24,39,0.08)" },
  space: (n) => `${4 * n}px`,
  font: { base: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
};

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body { margin: 0; font-family: ${p => p.theme.font.base}; color: ${p => p.theme.colors.text}; background: ${p => p.theme.colors.bg}; }
  :focus-visible { outline: 2px solid ${p => p.theme.colors.primary}; outline-offset: 2px; }
`;

// Layout
const Page = styled.div`
  min-height: 100%;
  padding: ${p => p.theme.space(8)};
  display: flex;
  justify-content: center;
`;

const Frame = styled.div`
  width: 100%;
  max-width: 1280px;
`;

const Card = styled.div`
  background: ${p => p.theme.colors.card};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  box-shadow: ${p => p.theme.shadow.md};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${p => p.theme.space(5)} ${p => p.theme.space(6)};
  border-bottom: 1px solid ${p => p.theme.colors.line};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${p => p.theme.colors.muted};
`;

const Breadcrumbs = styled.div`
  font-size: 12px;
  color: ${p => p.theme.colors.muted};
  margin-bottom: ${p => p.theme.space(3)};
  a { color: ${p => p.theme.colors.link}; text-decoration: none; }
`;

const BackButton = styled.button`
  padding: ${p => p.theme.space(2)} ${p => p.theme.space(4)};
  border-radius: ${p => p.theme.radius.sm};
  border: 1px solid ${p => p.theme.colors.border};
  background: #fff;
  cursor: pointer;
`;

const Body = styled.div`
  padding: ${p => p.theme.space(6)};
  display: grid;
  gap: ${p => p.theme.space(6)};
`;

const Section = styled.section`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.md};
  overflow: hidden;
`;

const SectionHead = styled.div`
  background: #fafafa;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  padding: ${p => p.theme.space(4)} ${p => p.theme.space(5)};
  font-weight: 600;
  font-size: 14px;
`;

const SectionBody = styled.div`
  padding: ${p => p.theme.space(5)};
  display: grid;
  gap: ${p => p.theme.space(4)};
`;

// Basic info
const Field = styled.label`
  display: grid;
  gap: 8px;
`;

const Label = styled.span`
  font-size: 12px;
  color: ${p => p.theme.colors.muted};
`;

const Select = styled.select`
  height: 40px;
  padding: 0 12px;
  border-radius: ${p => p.theme.radius.sm};
  border: 1px solid ${p => p.theme.colors.border};
  background: #fff;
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 4px ${p => p.theme.colors.focus}; outline: none; }
`;

// Hours grid
const HoursHeader = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr 1fr 140px;
  gap: ${p => p.theme.space(3)};
  padding: 0 ${p => p.theme.space(1)} ${p => p.theme.space(2)} ${p => p.theme.space(1)};
  border-bottom: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.muted};
  font-size: 12px;
`;

const HoursRow = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr 1fr 140px;
  gap: ${p => p.theme.space(3)};
  align-items: center;
  padding: ${p => p.theme.space(3)} ${p => p.theme.space(1)};
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => (p.$disabled ? "#fafafa" : "transparent")};
`;

const DayCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.theme.space(3)};
  input[type="checkbox"] { width: 16px; height: 16px; }
  span { font-size: 14px; }
`;

const TimeInput = styled.input.attrs({ type: "time" })`
  height: 38px;
  padding: 0 10px;
  border-radius: ${p => p.theme.radius.sm};
  border: 1px solid ${p => p.theme.colors.border};
  background: #fff;
  min-width: 140px;
  &:disabled { background: #f3f4f6; color: ${p => p.theme.colors.muted}; }
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 4px ${p => p.theme.colors.focus}; outline: none; }
`;

const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.theme.space(3)};
  justify-content: flex-end;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${p => p.theme.colors.link};
  cursor: pointer;
  font-size: 12px;
  &:hover { text-decoration: underline; }
`;

const BreakRow = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr 1fr 140px;
  gap: ${p => p.theme.space(3)};
  align-items: center;
  padding: 0 ${p => p.theme.space(1)} ${p => p.theme.space(3)} ${p => p.theme.space(1)};
  margin-top: -${p => p.theme.space(2)};
  > div:nth-child(1) {
    display: flex;
    align-items: center;
    gap: ${p => p.theme.space(2)};
    color: ${p => p.theme.colors.muted};
    font-size: 12px;
  }
`;

const FooterBar = styled.div`
  position: sticky;
  bottom: 0;
  padding: ${p => p.theme.space(4)} ${p => p.theme.space(6)};
  border-top: 1px solid ${p => p.theme.colors.line};
  background: linear-gradient(to bottom, rgba(255,255,255,0.75), #fff 40%);
  display: flex;
  justify-content: flex-end;
  gap: ${p => p.theme.space(3)};
`;

const Save = styled.button`
  padding: 10px 18px;
  border-radius: ${p => p.theme.radius.sm};
  border: 1px solid ${p => p.theme.colors.primary};
  background: ${p => p.theme.colors.primary};
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

// Data helpers
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const defaultSchedule = DAYS.map((d, i) => ({
  day: d,
  enabled: i !== 6,         // Sunday off by default
  open: "09:00",
  close: "18:00",
  breaks: [],               // [{ start: "13:00", end: "14:00" }]
}));

export default function LabSessionEditor() {
      const navigate = useNavigate();
  const [lab, setLab] = useState("spectrum-health");
  const [schedule, setSchedule] = useState(defaultSchedule);

  const allDisabled = useMemo(() => schedule.every(s => !s.enabled), [schedule]);

  const toggleDay = (idx) => {
    setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const setTime = (idx, key, value) => {
    setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };

  const addBreak = (idx) => {
    setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, breaks: [...s.breaks, { start: "13:00", end: "14:00" }] } : s));
  };

  const setBreakTime = (idx, bIdx, key, value) => {
    setSchedule(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const next = s.breaks.map((b, j) => j === bIdx ? { ...b, [key]: value } : b);
      return { ...s, breaks: next };
    }));
  };

  const removeBreak = (idx, bIdx) => {
    setSchedule(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const next = s.breaks.filter((_, j) => j !== bIdx);
      return { ...s, breaks: next };
    }));
  };

  const closeLabAllDays = () => {
    setSchedule(prev => prev.map(s => ({ ...s, enabled: false })));
  };

  const handleSave = () => {
    const payload = { lab, schedule };
    console.log("SAVE payload", payload);
    alert("Session saved (see console).");
    navigate("labs")
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Frame>
          <Breadcrumbs>
            <a href="#/">Dashboard</a> &nbsp;›&nbsp; Edit Lab Session
          </Breadcrumbs>

          <Card>
            <HeaderRow>
              <Title>Basic Information</Title>
              <BackButton type="button" onClick={() => window.history.back()}>
                Back
              </BackButton>
            </HeaderRow>

            <Body>
              <Section>
                <SectionHead>Basic Information</SectionHead>
                <SectionBody>
                  <Field>
                    <Label>Lab</Label>
                    <Select value={lab} onChange={(e) => setLab(e.target.value)}>
                      <option value="spectrum-health">Spectrum Health Diagnostics</option>
                      <option value="alpha-labs">Alpha Labs</option>
                      <option value="prime-diagnostics">Prime Diagnostics</option>
                    </Select>
                  </Field>
                </SectionBody>
              </Section>

              <Section>
                <SectionHead>Business Hours</SectionHead>
                <SectionBody>
                  <HoursHeader>
                    <div>Day</div>
                    <div>Open</div>
                    <div>Close</div>
                    <div style={{ textAlign: "right" }}>
                      {!allDisabled ? <LinkButton onClick={closeLabAllDays}>Lab Close</LinkButton> : <span />}
                    </div>
                  </HoursHeader>

                  {schedule.map((row, idx) => (
                    <React.Fragment key={row.day}>
                      <HoursRow $disabled={!row.enabled}>
                        <DayCell>
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={() => toggleDay(idx)}
                            aria-label={`Enable ${row.day}`}
                          />
                          <span>{row.day}</span>
                        </DayCell>

                        <div>
                          <TimeInput
                            value={row.open}
                            onChange={(e) => setTime(idx, "open", e.target.value)}
                            disabled={!row.enabled}
                          />
                        </div>

                        <div>
                          <TimeInput
                            value={row.close}
                            onChange={(e) => setTime(idx, "close", e.target.value)}
                            disabled={!row.enabled}
                          />
                        </div>

                        <ActionsCell>
                          <LinkButton onClick={() => addBreak(idx)} disabled={!row.enabled}>
                            Add Break
                          </LinkButton>
                        </ActionsCell>
                      </HoursRow>

                      {row.breaks.map((b, bIdx) => (
                        <BreakRow key={`${row.day}-break-${bIdx}`}>
                          <div>Break #{bIdx + 1}</div>
                          <div>
                            <TimeInput
                              value={b.start}
                              onChange={(e) => setBreakTime(idx, bIdx, "start", e.target.value)}
                              disabled={!row.enabled}
                            />
                          </div>
                          <div>
                            <TimeInput
                              value={b.end}
                              onChange={(e) => setBreakTime(idx, bIdx, "end", e.target.value)}
                              disabled={!row.enabled}
                            />
                          </div>
                          <ActionsCell>
                            <LinkButton onClick={() => removeBreak(idx, bIdx)}>Remove</LinkButton>
                          </ActionsCell>
                        </BreakRow>
                      ))}
                    </React.Fragment>
                  ))}
                </SectionBody>
              </Section>
            </Body>

            <FooterBar>
              <Save type="button" onClick={handleSave}>Save</Save>
            </FooterBar>
          </Card>
        </Frame>
      </Page>
    </ThemeProvider>
  );
}
