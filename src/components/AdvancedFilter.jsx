// AdvancedFilterDrawer.jsx
import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  opacity: ${p => p.open ? 1 : 0};
  pointer-events: ${p => p.open ? 'auto' : 'none'};
  transition: opacity 200ms ease;
  z-index: 1000;
`;

const slideIn = keyframes`from { transform: translateX(380px); } to { transform: translateX(0); }`;
const slideOut = keyframes`from { transform: translateX(0); } to { transform: translateX(380px); }`;

const Drawer = styled.aside`
  position: absolute;
  right: 0; top: 0; height: 100%;
  width: 380px; max-width: 90vw; background: #fff;
  box-shadow: -8px 0 24px rgba(0,0,0,0.12);
  border-left: 1px solid rgba(0,0,0,0.06);
  display: flex; flex-direction: column;
  animation: ${p => p.open ? slideIn : slideOut} 260ms ease forwards;
`;

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid #eee;
  font-size: 18px; font-weight: 600;
`;

const CloseBtn = styled.button`
  all: unset; cursor: pointer; padding: 6px; line-height: 1; border-radius: 6px;
  &:hover { background:#f4f4f4; }
  &:focus-visible { outline: 2px solid #2684ff; outline-offset: 2px; }
`;

const Body = styled.div`
  padding: 16px 24px; overflow: auto; flex: 1;
  display: grid; grid-template-columns: 1fr; gap: 16px;
`;

const Field = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const Label = styled.label` font-size: 13px; color: #555; `;

const SelectWrap = styled.div`
  position: relative;
  &::after {
    content: ""; position: absolute; right: 12px; top: 50%;
    width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
    border-top: 6px solid #777; transform: translateY(-50%); pointer-events: none;
  }
`;

const Select = styled.select`
  width: 100%; padding: 12px 40px 12px 12px; font-size: 14px; color: #222;
  background: #fff; border: 1px solid #ddd; border-radius: 8px; appearance: none;
  &:focus { border-color: #2684ff; box-shadow: 0 0 0 3px rgba(38,132,255,0.2); outline: none; }
`;

const Footer = styled.div`
  border-top: 1px solid #eee; padding: 16px 24px;
  display: flex; gap: 12px; justify-content: flex-end;
`;

const Button = styled.button`
  border: 1px solid ${p => p.variant === 'ghost' ? '#ddd' : '#2684ff'};
  background: ${p => p.variant === 'ghost' ? '#fff' : '#2684ff'};
  color: ${p => p.variant === 'ghost' ? '#333' : '#fff'};
  padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

/* Radio group styles for collector preset */
const RadioGroup = styled.div` display: flex; gap: 12px; flex-wrap: wrap; `;
const RadioCard = styled.label`
  position: relative; display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; background: #fff;
  input { position: absolute; opacity: 0; pointer-events: none; }
  input:checked + span { font-weight: 600; color: #0b5cff; }
  input:checked ~ div { position: absolute; inset: 0; border-radius: 8px; border: 2px solid #0b5cff; pointer-events: none; }
  &:focus-within { outline: 2px solid #2684ff; outline-offset: 2px; }
`;

export function AdvancedFilterDrawer({
  open,
  onClose,
  values,
  setValues,
  onApply,
  onReset,
  options,
  preset = 'default',
  title = 'Advanced Filter',
}) {
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (open && firstFieldRef.current) firstFieldRef.current.focus();
    const onKeyDown = e => { if (e.key === 'Escape' && open) onClose?.(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleChange = key => e =>
    setValues(prev => ({ ...prev, [key]: e.target.value || '' }));

  const renderAppointmentsPreset = () => (
    <>
      <Field>
        <Label htmlFor="collector">Collector Name</Label>
        <SelectWrap>
          <Select id="collector" ref={firstFieldRef} value={values.collector || ''} onChange={handleChange('collector')}>
            <option value="">Select Collector</option>
            {options?.collectors?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="lab">Lab Name</Label>
        <SelectWrap>
          <Select id="lab" value={values.lab || ''} onChange={handleChange('lab')}>
            <option value="">Select Lab</option>
            {options?.labs?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="test">Test Case</Label>
        <SelectWrap>
          <Select id="test" value={values.test || ''} onChange={handleChange('test')}>
            <option value="">Select Test</option>
            {options?.tests?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="pay">Payment Status</Label>
        <SelectWrap>
          <Select id="pay" value={values.payment || ''} onChange={handleChange('payment')}>
            <option value="">Select Payment Status</option>
            {options?.paymentStatus?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="status">Status</Label>
        <SelectWrap>
          <Select id="status" value={values.status || ''} onChange={handleChange('status')}>
            <option value="">Select Status</option>
            {options?.status?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="submission">Submission Status</Label>
        <SelectWrap>
          <Select id="submission" value={values.submission || ''} onChange={handleChange('submission')}>
            <option value="">Select Submission Status</option>
            {options?.submissionStatus?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>
    </>
  );


// Add this inside AdvancedFilterDrawer.jsx

const renderLabsPreset = () => {
  const accOptions =
    Array.isArray(options?.accreditationTypes) && options.accreditationTypes.length
      ? options.accreditationTypes
      : [
          { value: 'all', label: 'All' },
          { value: 'nabl', label: 'NABL' },
          { value: 'iso15189', label: 'ISO 15189' },
          { value: 'cap', label: 'CAP' },
        ];

  const payOptions =
    Array.isArray(options?.paymentModes) && options.paymentModes.length
      ? options.paymentModes
      : [
          { value: 'all', label: 'All' },
          { value: 'cash', label: 'Cash' },
          { value: 'upi', label: 'UPI' },
          { value: 'card', label: 'Card' },
          { value: 'netbanking', label: 'Net Banking' },
        ];

  const taxOptions =
    Array.isArray(options?.taxes) && options.taxes.length
      ? options.taxes
      : [
          { value: 'none', label: 'No Tax' },
          { value: 'gst5', label: 'GST 5%' },
          { value: 'gst12', label: 'GST 12%' },
          { value: 'gst18', label: 'GST 18%' },
        ];

  return (
    <>
      <Field>
        <Label htmlFor="lab">Lab Name</Label>
        <SelectWrap>
          <Select
            id="lab"
            ref={firstFieldRef}
            value={values.lab || ''}
            onChange={handleChange('lab')}
            aria-label="Select lab"
          >
            <option value="">Select Lab</option>
            {options?.labs?.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="collector">Collector Name</Label>
        <SelectWrap>
          <Select
            id="collector"
            value={values.collector || ''}
            onChange={handleChange('collector')}
            aria-label="Select collector"
          >
            <option value="">Select Collector</option>
            {options?.collectors?.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="tax">Taxes</Label>
        <SelectWrap>
          <Select
            id="tax"
            value={values.tax || ''}
            onChange={handleChange('tax')}
            aria-label="Select tax"
          >
            <option value="">Select Tax</option>
            {taxOptions.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="accreditation">Accreditation Type</Label>
        <SelectWrap>
          <Select
            id="accreditation"
            value={values.accreditation ?? 'all'}
            onChange={handleChange('accreditation')}
            aria-label="Select accreditation type"
          >
            {accOptions.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="paymentMode">Payment Mode</Label>
        <SelectWrap>
          <Select
            id="paymentMode"
            value={values.paymentMode ?? 'all'}
            onChange={handleChange('paymentMode')}
            aria-label="Select payment mode"
          >
            {payOptions.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>
    </>
  );
};


  const renderCollectorPreset = () => {
  // Always provide all three; prefer incoming options.genders if complete
  const fallback = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];
  const list = Array.isArray(options?.genders) && options.genders.length >= 3
    ? options.genders
    : fallback;

  return (
    <>
      <Field>
        <Label htmlFor="collector">Collector Name</Label>
        <SelectWrap>
          <Select
            id="collector"
            ref={firstFieldRef}
            value={values.collector || ''}
            onChange={handleChange('collector')}
            aria-label="Select collector"
          >
            <option value="">Select Collector</option>
            {options?.collectors?.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="lab">Lab Name</Label>
        <SelectWrap>
          <Select
            id="lab"
            value={values.lab || ''}
            onChange={handleChange('lab')}
            aria-label="Select lab"
          >
            <option value="">Select Lab</option>
            {options?.labs?.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label id="afc-gender-label">Gender<span style={{color:'#d32f2f'}}>*</span></Label>
        <RadioGroup role="radiogroup" aria-labelledby="afc-gender-label">
          {list.map(g => (
            <RadioCard key={g.value}>
              <input
                type="radio"
                name="afc-gender"
                value={g.value}
                checked={(values.gender || '') === g.value}
                onChange={handleChange('gender')}
              />
              <span>{g.label}</span>
              <div aria-hidden="true" />
            </RadioCard>
          ))}
        </RadioGroup>
      </Field>
    </>
  );
};


  return (
    <Overlay open={open} aria-hidden={!open} onClick={onClose}>
      <Drawer
        open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adv-filter-title"
        onClick={e => e.stopPropagation()}
      >
        <Header>
          <div id="adv-filter-title">{title}</div>
          <CloseBtn aria-label="Close" onClick={onClose}>✕</CloseBtn>
        </Header>

        <Body>
          {preset === 'collector' ? renderCollectorPreset() : preset === 'appointments' ? renderAppointmentsPreset() : preset === "labs" ? renderLabsPreset():null}
        </Body>

        <Footer>
          <Button variant="ghost" type="button" onClick={onReset}>Reset</Button>
          <Button type="button" onClick={onApply}>Apply</Button>
        </Footer>
      </Drawer>
    </Overlay>
  );
}
