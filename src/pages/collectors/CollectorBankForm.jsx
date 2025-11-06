// src/pages/AddCollectorBank.jsx
import React, { useState } from 'react';
import './collectorcommon.css';

// Firestore imports
import { db } from '../../firebase.js'; // adjust the path if your firebase file is elsewhere
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

  const invalid = (name) => touched[name] && !form[name];
  const canSave = required.every(k => String(form[k]).trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(required.reduce((a, k) => ({ ...a, [k]: true }), {}));
    if (!canSave || saving) return;

    try {
      setSaving(true);

      // Prepare payload (fields already normalized in onChange handlers)
      const payload = {
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim(),
        ifsc: form.ifsc.trim(),
        accountNumber: form.accountNumber.trim(),
        phone: form.phone.trim(),
        collector: form.collector,
        active: !!form.active,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'collector_banks'), payload);

      // Reset form
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
    <div className="page">
      <div className="page-head">
        <nav className="breadcrumb">
          <span>Dashboard</span>
          <span className="sep">»</span>
          <span className="here">Add Collector Banks</span>
        </nav>

        <button className="btn ghost" onClick={() => window.history.back()}>
          ‹ Back
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">Basic Information</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Bank Name */}
          <div className="field">
            <label className="label">
              Bank Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${invalid('bankName') ? 'error' : ''}`}
              placeholder="Enter Bank Name"
              value={form.bankName}
              onChange={(e) => setField('bankName', e.target.value)}
              onBlur={() => onBlur('bankName')}
            />
            {invalid('bankName') && <div className="hint">Bank Name is required.</div>}
          </div>

          {/* Branch Name */}
          <div className="field">
            <label className="label">
              Branch Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${invalid('branchName') ? 'error' : ''}`}
              placeholder="Enter Branch Name"
              value={form.branchName}
              onChange={(e) => setField('branchName', e.target.value)}
              onBlur={() => onBlur('branchName')}
            />
            {invalid('branchName') && <div className="hint">Branch Name is required.</div>}
          </div>

          {/* IFSC Code */}
          <div className="field">
            <label className="label">
              IFSC Code <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${invalid('ifsc') ? 'error' : ''}`}
              placeholder="Enter IFSC Code"
              value={form.ifsc}
              onChange={(e) => setField('ifsc', e.target.value.toUpperCase())}
              onBlur={() => onBlur('ifsc')}
              maxLength={11}
            />
            {invalid('ifsc') && <div className="hint">IFSC Code is required.</div>}
          </div>

          {/* Account Number */}
          <div className="field">
            <label className="label">
              Account Number <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${invalid('accountNumber') ? 'error' : ''}`}
              placeholder="Enter Account Number"
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value.replace(/\D/g, ''))}
              onBlur={() => onBlur('accountNumber')}
              inputMode="numeric"
            />
            {invalid('accountNumber') && <div className="hint">Account Number is required.</div>}
          </div>

          {/* Phone Number */}
          <div className="field">
            <label className="label">
              Phone Number <span className="req">*</span>
            </label>
            <input
              type="tel"
              className={`input ${invalid('phone') ? 'error' : ''}`}
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))}
              onBlur={() => onBlur('phone')}
              inputMode="tel"
              maxLength={15}
            />
            {invalid('phone') && <div className="hint">Phone Number is required.</div>}
          </div>

          {/* Collector */}
          <div className="field">
            <label className="label">
              Collector <span className="req">*</span>
            </label>
            <div className={`select ${invalid('collector') ? 'error' : ''}`}>
              <select
                value={form.collector}
                onChange={(e) => setField('collector', e.target.value)}
                onBlur={() => onBlur('collector')}
              >
                <option value="" disabled>
                  Select Collector
                </option>
                <option value="collector_1">Collector 1</option>
                <option value="collector_2">Collector 2</option>
                <option value="collector_3">Collector 3</option>
              </select>
              <span className="chev">▾</span>
            </div>
            {invalid('collector') && <div className="hint">Collector is required.</div>}
          </div>

          {/* Status (full row) */}
          <div className="field full">
            <label className="label">Status</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField('active', e.target.checked)}
              />
              <span className="slider" />
              <span className="switch-label">{form.active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="actions full">
            <button type="submit" className="btn primary" disabled={!canSave || saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <footer className="footer-note">
        Kivilab: Your Ultimate Entertainment Hub (v1.2.1)
      </footer>
    </div>
  );
}
