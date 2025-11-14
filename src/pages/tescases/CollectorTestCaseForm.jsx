// src/pages/collectors/CollectorTestCaseForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { db } from '../../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

/* ---------- styles (unchanged) ---------- */
const Global = createGlobalStyle`
  :root{
    --bg:#f6f7fb; --card:#ffffff; --ink:#1f2937; --muted:#6b7280;
    --primary:#4f46e5; --primary-ink:#ffffff; --line:#e5e7eb; --focus:#6366f1;
    --danger:#ef4444; --radius:10px; --gap:16px;
  }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, system-ui, Arial, sans-serif; color:var(--ink); background:var(--bg); }
`;
const Page = styled.div` padding: 28px; max-width: 1280px; margin: 0 auto; `;
const HeaderBar = styled.div` display:flex; justify-content: space-between; align-items: center; margin-bottom: 18px; `;
const Title = styled.h1` font-size: 22px; margin: 0; font-weight: 600; `;
const Actions = styled.div` display:flex; gap: 10px; `;
const Button = styled.button`
  appearance: none; border-radius: 8px; padding: 10px 14px; font-weight: 600;
  border: 1px solid ${p => (p.$variant === 'primary' ? 'var(--primary)' : 'var(--line)')};
  color: ${p => (p.$variant === 'primary' ? 'var(--primary-ink)' : 'var(--ink)')};
  background: ${p => (p.$variant === 'primary' ? 'var(--primary)' : '#fff')};
  cursor: pointer; &:hover { opacity: .95; } &:focus-visible{ outline: 3px solid var(--focus); outline-offset: 2px; }
`;
const Card = styled.section` background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 18px; overflow: hidden; `;
const CardHead = styled.header`
  padding: 14px 16px; border-bottom: 1px solid var(--line); display:flex; align-items:center; justify-content: space-between;
  h3{ margin:0; font-size: 16px; font-weight: 600; }
`;
const CardBody = styled.div` padding: 16px; `;
const Grid = styled.div`
  display:grid; grid-template-columns: repeat(12, 1fr); gap: var(--gap);
  @media (max-width: 900px){ grid-template-columns: repeat(6, 1fr); }
  @media (max-width: 640px){ grid-template-columns: repeat(4, 1fr); }
`;
const Col = styled.div`
  grid-column: span ${p => p.$span ?? 12};
  @media (max-width: 900px){ grid-column: span ${p => Math.min(p.$span ?? 12, 6)}; }
  @media (max-width: 640px){ grid-column: span 4; }
`;
const Field = styled.label` display:block; width: 100%; small{ display:block; color: var(--muted); margin-top: 6px; } `;
const Label = styled.span` display:block; font-size: 12px; color: var(--muted); margin-bottom: 8px; `;
const Input = styled.input`
  width:100%; border: 1px solid var(--line); background:#fff; height: 40px; border-radius: 8px; padding: 0 12px; font-size:14px;
  &:focus{ outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
`;
const Select = styled.select`
  width:100%; border: 1px solid var(--line); height: 40px; border-radius: 8px; padding: 0 10px; background:#fff; font-size:14px;
  &:focus{ outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
`;
const QuillField = styled.div`
  .ql-toolbar { border: 1px solid var(--line); border-bottom: 0; border-radius: 8px 8px 0 0; background: #fff; }
  .ql-container { border: 1px solid var(--line); border-radius: 0 0 8px 8px; background:#fff; min-height: 160px; }
  .ql-editor { min-height: 140px; font-size:14px; }
`;
const UploadBox = styled.div`
  border: 2px dashed var(--line); border-radius: 12px; background: #fafafa; height: 160px;
  display:flex; align-items:center; justify-content:center; color: var(--muted); text-align:center; padding: 10px; cursor: pointer;
`;
const Row = styled.div` display:flex; gap: 10px; align-items:center; flex-wrap: wrap; `;
const Switch = styled.label`
  position: relative; width: 44px; height: 24px; display:inline-block;
  input{ display:none; } span{ position:absolute; inset:0; background:#e5e7eb; border-radius:999px; transition:.2s; }
  span::after{ content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow: 0 1px 2px rgba(0,0,0,.15); transition:.2s; }
  input:checked + span{ background: var(--primary); } input:checked + span::after{ transform: translateX(20px); }
`;
const FooterBar = styled.div` display:flex; justify-content:flex-end; gap: 10px; padding: 10px 0 2px; `;

/* ---------- quill ---------- */
const quillModules = {
  toolbar: [
    [{ header: [1,2,3,4,5,6,false] }],
    ['bold','italic','underline','strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link','blockquote','code-block','clean']
  ]
};
const quillFormats = [
  'header','bold','italic','underline','strike','color','background',
  'script','list','bullet','indent','align','link','blockquote','code-block'
];

/* ---------- collection + helpers ---------- */
const COLLECTION = 'collector_test_cases';
const lc = (s) => (s ?? '').toString().trim().toLowerCase();

export default function CollectorTestCaseForm(){
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // state
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [category, setCategory] = useState('');
  const [testType, setTestType] = useState('');
  const [description, setDescription] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [specimenDetails, setSpecimenDetails] = useState('');
  const [section, setSection] = useState('');
  const [lab, setLab] = useState('');
  const [hostIp, setHostIp] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [refLink, setRefLink] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const pdfRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imgError, setImgError] = useState('');
  const imgRef = useRef(null);
  const [active, setActive] = useState(true);
  const [homeCollection, setHomeCollection] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // image picker
  const onPickImage = () => imgRef.current?.click();
  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = ['image/png', 'image/jpeg'];
    if (!valid.includes(file.type)) {
      setImgError('Only PNG or JPG allowed');
      setImageFile(null);
      setImagePreview('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImgError('Max size 5MB');
      setImageFile(null);
      setImagePreview('');
      return;
    }
    setImgError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // reset
  const resetAll = () => {
    setTestName(''); setTestCode(''); setCategory(''); setTestType('');
    setDescription(''); setGeneralNotes(''); setInstructions(''); setSpecimenDetails('');
    setSection(''); setLab(''); setHostIp(''); setRequestTime('');
    setRefLink(''); setPdfFile(null); if (pdfRef.current) pdfRef.current.value = '';
    setActive(true); setHomeCollection(false); setFeatured(false);
    setImageFile(null); setImagePreview(''); setImgError(''); if (imgRef.current) imgRef.current.value = '';
  };

  // load for edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const ref = doc(db, COLLECTION, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert('Document not found');
          navigate('/test-cases');
          return;
        }
        const d = snap.data();
        setTestName(d.testName ?? d.test?.name ?? '');
        setTestCode(d.testCode ?? d.test?.code ?? '');
        setCategory(d.category ?? d.category?.name ?? '');
        setTestType(d.testType ?? d.test?.type ?? '');
        setDescription(d.description ?? '');
        setGeneralNotes(d.generalNotes ?? '');
        setInstructions(d.instructions ?? '');
        setSpecimenDetails(d.specimenDetails ?? '');
        setSection(d.details?.section ?? '');
        setLab(d.details?.lab ?? d.lab?.name ?? '');
        setHostIp(d.details?.hostIp ?? '');
        setRequestTime(d.details?.requestTime ?? '');
        setRefLink(d.attachments?.referenceLink ?? '');
        // existing file names (no upload on Spark)
        if (d.image?.name) setImagePreview(''); // no URL available, keep blank
        setActive(Boolean(d.flags?.active ?? d.active ?? true));
        setHomeCollection(Boolean(d.flags?.homeCollection ?? false));
        setFeatured(Boolean(d.flags?.featured ?? false));
      } catch (e) {
        console.error(e);
        alert('Failed to load document');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, navigate]);

  // build payload (shared for add/update)
  const buildPayload = () => {
    const imageMeta = imageFile ? { name: imageFile.name } : null;
    const pdfMeta = pdfFile ? { name: pdfFile.name } : null;

    // lowercase fields for case-insensitive prefix search
    const testName_lc = lc(testName);
    const labName_lc = lc(lab);
    const categoryName_lc = lc(category);
    const searchKeys_lc = [testName, lab, category].filter(Boolean).map(lc).join(' | ');

    // include optional nested maps for compatibility
    return {
      testName: testName.trim(),
      testCode: testCode.trim(),
      category,
      testType,
      description,
      generalNotes,
      instructions,
      specimenDetails,
      details: {
        section,
        lab,
        hostIp,
        requestTime: requestTime || null,
      },
      attachments: {
        instructionPdfName: pdfMeta?.name || null,
        referenceLink: refLink.trim() || null,
      },
      image: imageMeta,
      flags: { active, homeCollection, featured },

      // derived fields for search
      testName_lc,
      labName_lc,
      categoryName_lc,
      searchKeys_lc,

      // helpful nested mirrors
      test: { name: testName.trim(), code: testCode.trim(), type: testType || null },
      lab: lab ? { name: lab } : null,
      categoryObj: category ? { name: category } : null,
    };
  };

  const handleSave = async () => {
    if (saving) return;
    if (!testName.trim() || !testCode.trim()) {
      alert('Please enter Test Name and Test Code');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        const ref = doc(db, COLLECTION, id);
        await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, COLLECTION), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      navigate('/testcases');
    } catch (e) {
      console.error(e);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <>
      <Global />
      <Page>
        <HeaderBar>
          <Title>Collector • {isEdit ? 'Edit Test Case' : 'Add Test Case'}</Title>
          <Actions>
            {!isEdit && <Button $variant="ghost" onClick={resetAll}>Reset</Button>}
            <Button $variant="primary" onClick={handleSave} disabled={saving || loading}>
              {saving ? (isEdit ? 'Updating…' : 'Saving…') : (isEdit ? 'Update' : 'Save')}
            </Button>
            <Button $variant="ghost" onClick={()=>navigate('/test-cases')}>Back</Button>
          </Actions>
        </HeaderBar>

        {/* Basic Information */}
        <Card>
          <CardHead><h3>Basic Information</h3></CardHead>
          <CardBody>
            <Grid>
              <Col $span={3}>
                <Field>
                  <Label>Test Case Image</Label>
                  <UploadBox
                    role="button"
                    tabIndex={0}
                    onClick={()=>!loading && onPickImage()}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !loading && onPickImage()}
                    title="Click to upload"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div>
                        <div>Drop or click to upload</div>
                        <small>PNG, JPG up to 5MB</small>
                      </div>
                    )}
                  </UploadBox>
                  <input
                    ref={imgRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    style={{ display: 'none' }}
                    onChange={onImageChange}
                    disabled={loading}
                  />
                  {imgError ? <small style={{ color: 'var(--danger)' }}>{imgError}</small> : null}
                </Field>
              </Col>
              <Col $span={9}>
                <Grid>
                  <Col $span={6}>
                    <Field>
                      <Label>Test Name</Label>
                      <Input placeholder="Enter test name" value={testName} onChange={e => setTestName(e.target.value)} disabled={loading} />
                    </Field>
                  </Col>
                  <Col $span={6}>
                    <Field>
                      <Label>Test Code</Label>
                      <Input placeholder="Unique code" value={testCode} onChange={e => setTestCode(e.target.value)} disabled={loading} />
                    </Field>
                  </Col>
                  <Col $span={6}>
                    <Field>
                      <Label>Category</Label>
                      <Select value={category} onChange={e => setCategory(e.target.value)} disabled={loading}>
                        <option value="">Select category</option>
                        <option>Hematology</option>
                        <option>Biochemistry</option>
                        <option>Microbiology</option>
                      </Select>
                    </Field>
                  </Col>
                  <Col $span={6}>
                    <Field>
                      <Label>Test Type</Label>
                      <Select value={testType} onChange={e => setTestType(e.target.value)} disabled={loading}>
                        <option value="">Select type</option>
                        <option>Manual</option>
                        <option>Automated</option>
                      </Select>
                    </Field>
                  </Col>
                </Grid>
              </Col>
            </Grid>
            <Col $span={12}>
              <Field>
                <Label>Description</Label>
                <QuillField>
                  <ReactQuill
                    theme="snow"
                    placeholder="Write description..."
                    value={description}
                    onChange={setDescription}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </QuillField>
              </Field>
            </Col>
          </CardBody>
        </Card>

        {/* Test Details */}
        <Card>
          <CardHead><h3>Test Details</h3></CardHead>
          <CardBody>
            <Grid>
              <Col $span={6}>
                <Field>
                  <Label>Category/Section</Label>
                  <Input placeholder="Enter category or section" value={section} onChange={e=>setSection(e.target.value)} disabled={loading} />
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Lab</Label>
                  <Select value={lab} onChange={e=>setLab(e.target.value)} disabled={loading}>
                    <option value="">Select lab</option>
                    <option>Central Lab</option>
                    <option>Satellite Lab</option>
                  </Select>
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Host/IP</Label>
                  <Input placeholder="e.g., 10.0.0.12" value={hostIp} onChange={e=>setHostIp(e.target.value)} disabled={loading} />
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Test Request Time</Label>
                  <Input type="datetime-local" value={requestTime} onChange={e=>setRequestTime(e.target.value)} disabled={loading} />
                </Field>
              </Col>
            </Grid>
          </CardBody>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHead><h3>Additional Information</h3></CardHead>
          <CardBody>
            <Grid>
              <Col $span={12}>
                <Field>
                  <Label>Test Instructions</Label>
                  <QuillField>
                    <ReactQuill
                      theme="snow"
                      placeholder="Write notes..."
                      value={generalNotes}
                      onChange={setGeneralNotes}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </QuillField>
                </Field>
              </Col>
              <Col $span={12}>
                <Field>
                  <Label>Additional Notes</Label>
                  <QuillField>
                    <ReactQuill
                      theme="snow"
                      placeholder="Write test instructions..."
                      value={instructions}
                      onChange={setInstructions}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </QuillField>
                </Field>
              </Col>
              <Col $span={12}>
                <Field>
                  <Label>Test Restriction</Label>
                  <QuillField>
                    <ReactQuill
                      theme="snow"
                      placeholder="Write specimen details..."
                      value={specimenDetails}
                      onChange={setSpecimenDetails}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </QuillField>
                </Field>
              </Col>
            </Grid>
          </CardBody>
        </Card>

        {/* Attachments */}
        <Card $span={12}>
          <CardHead><h3>Test Guidelines PDF</h3></CardHead>
          <CardBody>
            <Grid>
              <Col $span={6}>
                <Field>
                  <Label>Instruction PDF</Label>
                  <Input
                    ref={pdfRef}
                    type="file"
                    accept=".pdf"
                    onChange={e=>setPdfFile(e.target.files?.[0] || null)}
                    disabled={loading}
                  />
                  <small>Upload any supporting document</small>
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Reference Link</Label>
                  <Input placeholder="https://..." value={refLink} onChange={e=>setRefLink(e.target.value)} disabled={loading} />
                </Field>
              </Col>
            </Grid>
          </CardBody>
        </Card>

        {/* Settings */}
        <Card>
          <CardHead><h3>Settings</h3></CardHead>
          <CardBody>
            <Grid>
              <Col $span={4}>
                <Label>Status</Label>
                <Row>
                  <Switch>
                    <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
                    <span />
                  </Switch>
                  <span>Active</span>
                </Row>
              </Col>
              <Col $span={4}>
                <Label>Home Collection</Label>
                <Row>
                  <Switch>
                    <input type="checkbox" checked={homeCollection} onChange={e=>setHomeCollection(e.target.checked)} />
                    <span />
                  </Switch>
                  <span>Available</span>
                </Row>
              </Col>
              <Col $span={4}>
                <Label>Featured</Label>
                <Row>
                  <Switch>
                    <input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)} />
                    <span />
                  </Switch>
                  <span>Featured</span>
                </Row>
              </Col>
            </Grid>
            <FooterBar>
              <Button $variant="ghost" onClick={() => navigate('/test-cases')}>Cancel</Button>
              <Button $variant="primary" onClick={handleSave} disabled={saving || loading}>
                {saving ? (isEdit ? 'Updating…' : 'Submitting…') : (isEdit ? 'Update' : 'Submit')}
              </Button>
            </FooterBar>
          </CardBody>
        </Card>
      </Page>
    </>
  );
}
