// components/AdvancedFilterDrawer.jsx
import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,.35);
  opacity: ${p=>p.open?1:0};
  pointer-events: ${p=>p.open?'auto':'none'};
  transition: opacity 200ms ease;
  z-index: 1000;
`;
const slideIn = keyframes`from{transform:translateX(380px);}to{transform:translateX(0);}`;
const slideOut = keyframes`from{transform:translateX(0);}to{transform:translateX(380px);}`;
const Drawer = styled.aside`
  position: absolute; right: 0; top: 0; height: 100%; width: 380px; max-width: 90vw;
  background: #fff; box-shadow: -8px 0 24px rgba(0,0,0,.12); border-left: 1px solid rgba(0,0,0,.06);
  display: flex; flex-direction: column;
  animation: ${p=>p.open?slideIn:slideOut} 260ms ease forwards;
`;
const Header = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  padding:20px 24px; border-bottom:1px solid #eee; font-size:18px; font-weight:600;
`;
const CloseBtn = styled.button`
  all:unset; cursor:pointer; padding:6px; line-height:1; border-radius:6px;
  &:hover{background:#f4f4f4;}
  &:focus-visible{outline:2px solid #2684ff; outline-offset:2px;}
`;
const Body = styled.div`
  padding:16px 24px; overflow:auto; flex:1; display:grid; grid-template-columns:1fr; gap:16px;
`;
const Field = styled.div`display:flex; flex-direction:column; gap:8px;`;
const Label = styled.label`font-size:13px; color:#555;`;
const SelectWrap = styled.div`
  position:relative;
  &::after{
    content:""; position:absolute; right:12px; top:50%;
    width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid #777;
    transform:translateY(-50%); pointer-events:none;
  }
`;
const Select = styled.select`
  width:100%; padding:12px 40px 12px 12px; font-size:14px; color:#222;
  background:#fff; border:1px solid #ddd; border-radius:8px; appearance:none;
  &:focus{border-color:#2684ff; box-shadow:0 0 0 3px rgba(38,132,255,.2); outline:none;}
`;
const Footer = styled.div`
  border-top:1px solid #eee; padding:16px 24px; display:flex; gap:12px; justify-content:flex-start;
`;
const Button = styled.button`
  border:1px solid ${p=>p.variant==='danger' ? '#dc2626' : '#2684ff'};
  background:${p=>p.variant==='danger' ? '#dc2626' : '#2684ff'};
  color:#fff; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:600;
  &:disabled{opacity:.6; cursor:not-allowed;}
`;

export function AdvancedFilterDrawer({
  open, onClose, values, setValues, onApply, onReset, options,
  preset = 'default', title = 'Advanced Filter',
}) {
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (open && firstFieldRef.current) firstFieldRef.current.focus();
    const onKeyDown = e => { if (e.key === 'Escape' && open) onClose?.(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const setAndAutoApply = (patch) => {
    setValues(prev => {
      const next = { ...prev, ...patch };
      setTimeout(() => onApply?.(), 0);
      return next;
    });
  };

  const renderTestPackagesPreset = () => (
    <>
      <Field>
        <Label htmlFor="tp-lab">Lab</Label>
        <SelectWrap>
          <Select
            id="tp-lab"
            ref={firstFieldRef}
            value={values.lab || ''}
            onChange={(e)=>setAndAutoApply({ lab: e.target.value || '' })}
            aria-label="Select Lab"
          >
            <option value="">Select Lab</option>
            {(options?.labs || []).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="tp-category">Test Category</Label>
        <SelectWrap>
          <Select
            id="tp-category"
            value={values.pkgCategory || ''}
            onChange={(e)=>{
              const v = e.target.value || '';
              // clear dependent Test Case when category changes
              setAndAutoApply({ pkgCategory: v, package: '' });
            }}
            aria-label="Select Test Category"
          >
            <option value="">Select Test Category</option>
            {(options?.packageCategories || []).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>

      <Field>
        <Label htmlFor="tp-package">Test Case</Label>
        <SelectWrap>
          <Select
            id="tp-package"
            value={values.package || ''}
            onChange={(e)=>setAndAutoApply({ package: e.target.value || '' })}
            aria-label="Select Test Case"
          >
            <option value="">Select Test Case</option>
            {(options?.packages || []).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </SelectWrap>
      </Field>
    </>
  );

  const renderDefault = () => (
    <>
      <Field>
        <Label htmlFor="lab">Lab</Label>
        <SelectWrap>
          <Select id="lab" value={values.lab || ''} onChange={(e)=>setAndAutoApply({ lab: e.target.value || '' })}>
            <option value="">Select Lab</option>
            {options?.labs?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </SelectWrap>
      </Field>
    </>
  );

  const body = (preset === 'testPackages' || preset === 'testPackage')
    ? renderTestPackagesPreset()
    : renderDefault();

  return (
    <Overlay open={open} aria-hidden={!open} onClick={onClose}>
      <Drawer open={open} role="dialog" aria-modal="true" aria-labelledby="adv-filter-title" onClick={e => e.stopPropagation()}>
        <Header>
          <div id="adv-filter-title">{title}</div>
          <CloseBtn aria-label="Close" onClick={onClose}>✕</CloseBtn>
        </Header>
        <Body>{body}</Body>
        <Footer>
          <Button variant="danger" type="button" onClick={onReset}>Reset</Button>
        </Footer>
      </Drawer>
    </Overlay>
  );
}
