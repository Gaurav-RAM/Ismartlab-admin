// src/pages/AddCollectorBank.jsx
import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// Firestore
import { db } from '../../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/* ============ Global tokens and resets ============ */
const GlobalStyle = createGlobalStyle`
  :root{
    --page-bg:#f7f8fb;
    --card-bg:#ffffff;
    --text:#1f2a37;
    --muted:#6b7280;
    --border:#e5e7eb;
    --danger:#dc2626;
    --brand:#4f46e5;
    --brand-600:#4338ca;
    --focus:#2563eb;
  }
  *{ box-sizing:border-box; }
  body{
    margin:0;
    background:var(--page-bg);
    color:var(--text);
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }
`;

/* ============ Layout & UI ============ */
const Page = styled.div`
  padding:24px;
`;

const PageHead = styled.div`
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin-bottom:16px;
`;

const Breadcrumb = styled.nav`
  color:var(--muted);
  font-size:14px;

  .here{ color:var(--text); font-weight:600; }
  .sep{ margin:0 8px; color:var(--muted); }
`;

const Card = styled.div`
  background:var(--card-bg);
  border:1px solid var(--border);
  border-radius:12px;
  padding:20px;
`;

const SectionTitle = styled.h2`
  font-size:18px;
  margin:6px 0 18px;
`;

const FormGrid = styled.form`
  display:grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap:18px 24px;

  @media (max-width: 900px){
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display:flex;
  flex-direction:column;
  grid-column: ${({$full}) => ($full ? '1 / -1' : 'auto')};
`;

const Label = styled.label`
  font-size:14px;
  margin-bottom:6px;
  .req{ color:var(--danger); margin-left:4px; }
`;

/* Buttons with variant prop: 'ghost' | 'primary' */
const Button = styled.button`
  appearance:none;
  border:1px solid ${({$variant}) => $variant==='primary' ? 'var(--brand)' : 'var(--border)'};
  background:${({$variant}) => $variant==='primary' ? 'var(--brand)' : 'transparent'};
  color:${({$variant}) => $variant==='primary' ? '#fff' : 'var(--text)'};
  height:36px;
  padding:0 14px;
  border-radius:8px;
  cursor:pointer;

  &:disabled{
    opacity:.6;
    cursor:not-allowed;
  }
  &:hover{
    background:${({$variant}) => $variant==='primary' ? 'var(--brand-600)' : 'transparent'};
  }
  &:focus-visible{
    outline:2px solid var(--focus);
    outline-offset:2px;
  }
`;

const Input = styled.input`
  width:100%;
  height:48px;
  border:1px solid ${({$error}) => $error ? 'var(--danger)' : 'var(--border)'};
  background:#fff;
  color:var(--text);
  padding:0 14px;
  border-radius:10px;
  outline:none;
  font-family:${({$mono}) => $mono ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : 'inherit'};
  &::placeholder{ color:#9ca3af; }
  &:focus-visible{
    outline:2px solid var(--focus);
    outline-offset:2px;
  }
`;

const SelectWrap = styled.div`
  position:relative;
  display:block;

  select{
    width:100%;
    height:48px;
    border:1px solid ${({$error}) => $error ? 'var(--danger)' : 'var(--border)'};
    background:#fff;
    color:var(--text);
    padding:0 38px 0 14px;
    border-radius:10px;
    outline:none;
    appearance:none;
  }
  select:focus-visible{
    outline:2px solid var(--focus);
    outline-offset:2px;
  }
`;

const Chev = styled.span`
  position:absolute;
  right:12px;
  top:50%;
  transform:translateY(-50%);
  pointer-events:none;
  color:#9ca3af;
  font-size:14px;
`;

const Hint = styled.div`
  margin-top:6px;
  color:var(--danger);
  font-size:12px;
`;

const Note = styled.div`
  margin-top:6px;
  color:var(--muted);
  font-size:12px;
`;

/* Switch control */
const Slider = styled.span`
  width:46px;
  height:28px;
  border-radius:999px;
  background:#e5e7eb;
  position:relative;
  transition:background .2s ease;
  border:1px solid var(--border);

  &::after{
    content:"";
    position:absolute;
    top:2px; left:2px;
    width:22px; height:22px;
    background:#fff;
    border-radius:50%;
    box-shadow:0 1px 2px rgba(0,0,0,.08);
    transition:transform .2s ease;
  }
`;

const HiddenCheckbox = styled.input.attrs({ type:'checkbox' })`
  position:absolute;
  opacity:0;

  &:checked + ${Slider}{
    background:var(--brand);
    border-color:var(--brand);
  }
  &:checked + ${Slider}::after{
    transform:translateX(18px);
  }
  &:focus-visible + ${Slider}{
    outline:2px solid var(--focus);
    outline-offset:2px;
  }
`;

const Switch = styled.label`
  display:inline-flex;
  align-items:center;
  gap:10px;
  user-select:none;
  position:relative;
`;

const SwitchLabel = styled.span`
  font-size:14px;
  color:var(--text);
`;

const Actions = styled.div`
  display:flex;
  justify-content:flex-end;
  padding-top:6px;
  border-top:1px dashed var(--border);
  margin-top:4px;
  grid-column:1 / -1;
`;

const FooterNote = styled.footer`
  margin-top:24px;
  color:var(--muted);
  font-size:12px;
`;

/* ============ Component ============ */
export default function CollectorBankForm() {
  const [form, setForm] = useState({
    bankName: '',
    branchName: '',
    ifsc: '',
    accountNumber: '',
    phone: '',
    collector: '',
    active: true,
  });

  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  const required = ['bankName', 'branchName', 'ifsc', 'accountNumber', 'phone', 'collector'];

  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }));
  const onBlur = (name) => setTouched(prev => ({ ...prev, [name]: true }));

  const invalid = (name) => touched[name] && !String(form[name]).trim();
  const canSave = required.every(k => String(form[k]).trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(required.reduce((a, k) => ({ ...a, [k]: true }), {}));
    if (!canSave || saving) return;

    try {
      setSaving(true);
      const payload = {
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim(),
        ifsc: form.ifsc.trim().toUpperCase(),
        accountNumber: form.accountNumber.trim(),
        phone: form.phone.trim(),
        collector: form.collector,
        active: !!form.active,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'collector_banks'), payload);
      setForm({
        bankName: '',
        branchName: '',
        ifsc: '',
        accountNumber: '',
        phone: '',
        collector: '',
        active: true,
      });
      setTouched({});
      alert('Saved!');
    } catch (err) {
      console.error('Failed to save bank record', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <GlobalStyle />
      <PageHead>
        <Breadcrumb aria-label="Breadcrumb">
          <span>Dashboard</span>
          <span className="sep">»</span>
          <span className="here" aria-current="page">Add Collector Banks</span>
        </Breadcrumb>

        <Button type="button" $variant="ghost" onClick={() => window.history.back()}>
          ‹ Back
        </Button>
      </PageHead>

      <Card>
        <SectionTitle>Basic Information</SectionTitle>

        <FormGrid onSubmit={handleSubmit} autoComplete="on" noValidate>
          {/* Bank Name */}
          <Field>
            <Label htmlFor="bankName">
              Bank Name <span className="req">*</span>
            </Label>
            <Input
              id="bankName"
              name="bankName"
              type="text"
              placeholder="Enter Bank Name"
              value={form.bankName}
              onChange={(e) => setField('bankName', e.target.value)}
              onBlur={() => onBlur('bankName')}
              autoComplete="organization"
              aria-invalid={invalid('bankName')}
              aria-describedby={invalid('bankName') ? 'bankName-hint' : undefined}
              required
              $error={invalid('bankName')}
            />
            {invalid('bankName') && <Hint id="bankName-hint">Bank Name is required.</Hint>}
          </Field>

          {/* Branch Name */}
          <Field>
            <Label htmlFor="branchName">
              Branch Name <span className="req">*</span>
            </Label>
            <Input
              id="branchName"
              name="branchName"
              type="text"
              placeholder="Enter Branch Name"
              value={form.branchName}
              onChange={(e) => setField('branchName', e.target.value)}
              onBlur={() => onBlur('branchName')}
              autoComplete="off"
              aria-invalid={invalid('branchName')}
              aria-describedby={invalid('branchName') ? 'branchName-hint' : undefined}
              required
              $error={invalid('branchName')}
            />
            {invalid('branchName') && <Hint id="branchName-hint">Branch Name is required.</Hint>}
          </Field>

          {/* IFSC Code */}
          <Field>
            <Label htmlFor="ifsc">
              IFSC Code <span className="req">*</span>
            </Label>
            <Input
              id="ifsc"
              name="ifsc"
              type="text"
              placeholder="Enter IFSC Code"
              value={form.ifsc}
              onChange={(e) => setField('ifsc', e.target.value.toUpperCase())}
              onBlur={() => onBlur('ifsc')}
              autoComplete="off"
              maxLength={11}
              pattern="[A-Z]{4}0[A-Z0-9]{6}"
              inputMode="text"
              aria-invalid={invalid('ifsc')}
              aria-describedby={invalid('ifsc') ? 'ifsc-hint' : 'ifsc-format'}
              title="Format: AAAA0BBBBBB"
              required
              $error={invalid('ifsc')}
              $mono
            />
            <Note id="ifsc-format">Format: 4 letters, a zero, and 6 alphanumerics (AAAA0BBBBBB).</Note>
            {invalid('ifsc') && <Hint id="ifsc-hint">IFSC Code is required.</Hint>}
          </Field>

          {/* Account Number */}
          <Field>
            <Label htmlFor="accountNumber">
              Account Number <span className="req">*</span>
            </Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              type="text"
              placeholder="Enter Account Number"
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value.replace(/\D/g, ''))}
              onBlur={() => onBlur('accountNumber')}
              autoComplete="off"
              inputMode="numeric"
              aria-invalid={invalid('accountNumber')}
              aria-describedby={invalid('accountNumber') ? 'acct-hint' : undefined}
              required
              $error={invalid('accountNumber')}
              $mono
            />
            {invalid('accountNumber') && <Hint id="acct-hint">Account Number is required.</Hint>}
          </Field>

          {/* Phone Number */}
          <Field>
            <Label htmlFor="phone">
              Phone Number <span className="req">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))}
              onBlur={() => onBlur('phone')}
              autoComplete="tel"
              inputMode="tel"
              maxLength={15}
              aria-invalid={invalid('phone')}
              aria-describedby={invalid('phone') ? 'phone-hint' : undefined}
              required
              $error={invalid('phone')}
            />
            {invalid('phone') && <Hint id="phone-hint">Phone Number is required.</Hint>}
          </Field>

          {/* Collector */}
          <Field>
            <Label htmlFor="collector">
              Collector <span className="req">*</span>
            </Label>
            <SelectWrap $error={invalid('collector')}>
              <select
                id="collector"
                name="collector"
                value={form.collector}
                onChange={(e) => setField('collector', e.target.value)}
                onBlur={() => onBlur('collector')}
                autoComplete="off"
                aria-invalid={invalid('collector')}
                aria-describedby={invalid('collector') ? 'collector-hint' : undefined}
                required
              >
                <option value="" disabled>Select Collector</option>
                <option value="collector_1">Collector 1</option>
                <option value="collector_2">Collector 2</option>
                <option value="collector_3">Collector 3</option>
              </select>
              <Chev aria-hidden>▾</Chev>
            </SelectWrap>
            {invalid('collector') && <Hint id="collector-hint">Collector is required.</Hint>}
          </Field>

          {/* Status */}
          <Field $full>
            <Label>Status</Label>
            <Switch>
              <HiddenCheckbox
                checked={form.active}
                onChange={(e) => setField('active', e.target.checked)}
                aria-checked={form.active}
              />
              <Slider />
              <SwitchLabel>{form.active ? 'Active' : 'Inactive'}</SwitchLabel>
            </Switch>
          </Field>

          {/* Actions */}
          <Actions>
            <Button type="submit" $variant="primary" disabled={!canSave || saving} aria-disabled={!canSave || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Actions>
        </FormGrid>
      </Card>

      <FooterNote>
        Kivilab: Your Ultimate Entertainment Hub (v1.2.1)
      </FooterNote>
    </Page>
  );
}
