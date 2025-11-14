// src/pages/collectors/CollectorDocumentCreate.jsx
import React, { useEffect, useRef, useState } from 'react';
import './collectorcommon.css';

// Routing
import { useParams, useNavigate } from 'react-router-dom';

// Firestore only
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <label className="clu-switch" aria-label={ariaLabel}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="clu-slider" />
    </label>
  );
}

export default function CollectorDocumentForm() {
  const { id } = useParams();           // if present => edit mode
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // controlled form state
  const [collectorId, setCollectorId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);

  // store existing file metadata when editing
  const [fileMetaDb, setFileMetaDb] = useState({ fileName: null, fileType: null, fileSize: null });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fileRef = useRef(null);

  // demo options — replace with API data
  const collectors = [
    { id: 'c1', name: 'Felix Harris' },
    { id: 'c2', name: 'Miles Warren' },
  ];
  const documents = [
    { id: 'id', label: 'Government-issued ID Proof' },
    { id: 'edu', label: 'Educational Certificates' },
    { id: 'contract', label: 'Signed Contract/Agreement' },
  ];

  const onChooseFile = () => fileRef.current?.click();

  // Load existing document for edit
  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    (async () => {
      try {
        const ref = doc(db, 'collector_documents', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert('Document not found');
          navigate(-1);
          return;
        }
        const d = snap.data();
        if (!mounted) return;
        setCollectorId(d.collectorId ?? '');
        setDocumentType(d.documentType ?? '');
        setIsVerified(!!d.isVerified);
        setIsActive(!!d.isActive);
        setFileMetaDb({
          fileName: d.fileName ?? null,
          fileType: d.fileType ?? null,
          fileSize: d.fileSize ?? null,
        });
      } catch (e) {
        console.error(e);
        setError('Failed to load document');
      }
    })();
    return () => { mounted = false; };
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Only metadata; no Storage
      const chosenMeta = file
        ? { fileName: file.name, fileType: file.type || null, fileSize: file.size ?? null }
        : fileMetaDb || { fileName: null, fileType: null, fileSize: null };

      const base = {
        collectorId,
        documentType,
        isVerified,
        isActive,
        ...chosenMeta,
      };

      if (isEdit) {
        await updateDoc(doc(db, 'collector_documents', id), {
          ...base,
          updatedAt: serverTimestamp(),
        });
        alert('Updated successfully');
        navigate("/collectors/document");
      } else {
        await addDoc(collection(db, 'collector_documents'), {
          ...base,
          createdAt: serverTimestamp(),
        });

        // reset form
        setCollectorId('');
        setDocumentType('');
        setIsVerified(false);
        setIsActive(true);
        setFile(null);
        setFileMetaDb({ fileName: null, fileType: null, fileSize: null });
        if (fileRef.current) fileRef.current.value = '';
        alert('Saved successfully');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="breadcrumbs">Dashboard › {isEdit ? 'Edit Collector Document' : 'New Collector Document'}</div>
        <button className="clu-btn outline" onClick={() => navigate(-1)}>
          ‹ Back
        </button>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="card-title">Basic Information</div>

        <div className="grid">
          {/* Select Collector */}
          <div className="field">
            <label className="label">
              Select Collector <span className="req">*</span>
            </label>
            <div className="select-like">
              <select
                className="select"
                value={collectorId}
                onChange={(e) => setCollectorId(e.target.value)}
                required
              >
                <option value="">Select Collector</option>
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="chev">▾</span>
            </div>
          </div>

          {/* Select Document + Add Document */}
          <div className="field">
            <label className="label">
              Select Document <span className="req">*</span>
              <button
                type="button"
                className="link-btn ms-2"
                onClick={() => console.log('Add Document modal')}
              >
                ⊕ Add Document
              </button>
            </label>
            <div className="select-like">
              <select
                className="select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                <option value="">Select Document</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              <span className="chev">▾</span>
            </div>
          </div>

          {/* Is Verify */}
          <div className="field">
            <label className="label">
              Is Verify <span className="req">*</span>
            </label>
            <div className="pill">
              <span>Verified</span>
              <Toggle checked={isVerified} onChange={setIsVerified} ariaLabel="Is Verified" />
            </div>
          </div>

          {/* Status */}
          <div className="field">
            <label className="label">Status</label>
            <div className="pill">
              <span>Active</span>
              <Toggle checked={isActive} onChange={setIsActive} ariaLabel="Status" />
            </div>
          </div>

          {/* Upload Document */}
          <div className="field col-span-2">
            <label className="label">Upload Document</label>
            <div className="file-row">
              <button type="button" className="clu-btn" onClick={onChooseFile}>
                Choose File
              </button>
              <span className="file-name">
                {file
                  ? file.name
                  : (fileMetaDb?.fileName || 'No file chosen')}
              </span>
              <input
                ref={fileRef}
                type="file"
                className="hidden-file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="actions">
          <button type="submit" className="clu-btn primary" disabled={saving}>
            {saving ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
}
