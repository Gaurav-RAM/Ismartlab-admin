// src/pages/labs/CollectorPackagesForm.jsx
import React, { useState, useMemo } from 'react';
import styled, { css } from 'styled-components';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Firestore
import { db } from '../../firebase'; // <-- ensure this exports getFirestore(app)
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Page = styled.div`
  background: #f5f6fa;
  min-height: 100vh;
  padding: 16px 20px 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
`;

const Button = styled.button`
  height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  background: ${(p) => (p.variant === 'primary' ? '#3f51b5' : '#e0e0e0')};
  color: ${(p) => (p.variant === 'primary' ? '#fff' : '#111')};
  &:hover { filter: brightness(0.96); }
`;

const Card = styled.section`
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  margin-bottom: 16px;
`;

const CardHeader = styled.header`
  padding: 12px 16px;
  border-bottom: 1px solid #eef0f3;
  font-weight: 600;
  color: #374151;
`;

const CardBody = styled.div`
  padding: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 12.5px;
  color: #4b5563;
  margin-bottom: 6px;
`;

const Input = styled.input`
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 12px;
  background: #fff;
  &:focus {
    outline: 2px solid #3f51b533;
    border-color: #3f51b5;
  }
`;

const Select = styled.select`
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 10px;
  background: #fff;
  &:focus {
    outline: 2px solid #3f51b533;
    border-color: #3f51b5;
  }
`;

const UploadWrap = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  height: 170px;
  display: grid;
  place-items: center;
  background: #fafafa;
  text-align: center;
  color: #6b7280;
`;

const UploadBtn = styled.label`
  display: inline-block;
  padding: 8px 12px;
  background: #e8eaf6;
  color: #3f51b5;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 8px;
`;

const Helper = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
`;

const TwoColSpan = styled.div`
  grid-column: span 2;
  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const SwitchWrap = styled.label`
  position: relative;
  width: 48px;
  height: 26px;
  display: inline-block;
`;

const SwitchInput = styled.input.attrs({ type: 'checkbox' })`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #d1d5db;
  border-radius: 999px;
  transition: background 0.2s ease;
  &::after {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 3px;
    top: 3px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  ${SwitchInput}:checked + & { background: #10b981; }
  ${SwitchInput}:checked + &::after { transform: translateX(22px); }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 16px 16px;
`;

const RichEditor = styled.div`
  &:focus-within {
    outline: 2px solid #3f51b533;
    border-radius: 6px;
  }
  .ql-toolbar.ql-snow {
    border: 1px solid #d1d5db;
    border-radius: 6px 6px 0 0;
    background: #fff;
  }
  .ql-container.ql-snow {
    border: 1px solid #d1d5db;
    border-top: none;
    border-radius: 0 0 6px 6px;
    background: #fff;
  }
  .ql-editor { min-height: 140px; }
`;

export default function CollectorPackagesForm() {
  const [form, setForm] = useState({
    packageName: '',
    description: '',
    labId: '',
    testCaseId: '',
    price: '',
    startDate: '',
    endDate: '',
    discountActive: 'Inactive',
    discountPercent: '',
    status: 'Active',
    featured: false,
    homeCollection: false,
    imageFile: null,
    imagePreview: '',
  });

  const onChange = (key) => (e) => {
    const val = e?.target?.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageFile: file, imagePreview: url }));
  };

  // Firestore submit
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const priceNum = form.price === '' ? null : Number(form.price);
      const discountNum =
        form.discountActive === 'Active' && form.discountPercent !== ''
          ? Number(form.discountPercent)
          : null;

      const payload = {
        packageName: form.packageName.trim(),
        description: form.description, // HTML from Quill
        labId: form.labId || null,
        testCaseId: form.testCaseId || null,
        price: priceNum,
        period: {
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        },
        discount: {
          active: form.discountActive === 'Active',
          percent: discountNum,
        },
        status: form.status,
        flags: {
          featured: !!form.featured,
          homeCollection: !!form.homeCollection,
        },
        // Image uploads are not performed on Spark; keep only local preview filename if needed
        imageMeta: form.imageFile ? { name: form.imageFile.name } : null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'collector_packages'), payload);
      alert('Package saved');
       
      // reset minimal fields
      setForm((f) => ({
        ...f,
        packageName: '',
        description: '',
        labId: '',
        testCaseId: '',
        price: '',
        startDate: '',
        endDate: '',
        discountActive: 'Inactive',
        discountPercent: '',
        status: 'Active',
        featured: false,
        homeCollection: false,
        imageFile: null,
        imagePreview: '',
      }));
      navigate("testpackages")
    } catch (err) {
      console.error(err);
      alert('Failed to save package');
    }
  };

  const isValid =
    form.packageName.trim().length > 0 &&
    form.price !== '' &&
    form.startDate !== '' &&
    form.endDate !== '';

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        ['clean'],
      ],
    }),
    []
  );

  const quillFormats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'bullet',
      'indent',
      'link',
      'image',
    ],
    []
  );

  const onDescriptionChange = (value) => {
    setForm((f) => ({ ...f, description: value }));
  };

  return (
    <Page>
      <TopBar>
        <Button type="button">Back</Button>
        <Button type="submit" form="collector-packages-form" variant="primary" disabled={!isValid}>
          Save
        </Button>
      </TopBar>

      <form id="collector-packages-form" onSubmit={onSubmit}>
        {/* Basic Information */}
        <Card>
          <CardHeader>Basic Information</CardHeader>
          <CardBody>
            <Grid>
              <Field>
                <Label htmlFor="image">Package Image</Label>
                <UploadWrap>
                  <div>
                    {form.imagePreview ? (
                      <img
                        src={form.imagePreview}
                        alt="Preview"
                        style={{ maxHeight: 120, borderRadius: 8 }}
                      />
                    ) : (
                      <div>Drop or upload image</div>
                    )}
                    <div>
                      <UploadBtn htmlFor="image">Upload Image</UploadBtn>
                      <Input id="image" type="file" accept="image/*" onChange={onImage} style={{ display: 'none' }} />
                    </div>
                    <Helper>Recommended: 800×600 JPG/PNG</Helper>
                  </div>
                </UploadWrap>
              </Field>

              <div style={{display:"flex",flexDirection:"column"}}>
                <Field>
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    placeholder="Enter Package Name"
                    value={form.packageName}
                    onChange={onChange('packageName')}
                  />
                </Field>

                <TwoColSpan>
                  <Field>
                    <Label htmlFor="description">Description</Label>
                    <RichEditor>
                      <ReactQuill
                        id="description"
                        theme="snow"
                        value={form.description}
                        onChange={onDescriptionChange}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write a short description..."
                      />
                    </RichEditor>
                  </Field>
                </TwoColSpan>
              </div>
            </Grid>
          </CardBody>
        </Card>

        {/* Test Case Information */}
        <Card>
          <CardHeader>Test Case Information</CardHeader>
          <CardBody>
            <Grid>
              <Field>
                <Label htmlFor="labId">Lab</Label>
                <Select id="labId" value={form.labId} onChange={onChange('labId')}>
                  <option value="">Select Lab</option>
                  <option value="lab-1">CollectorLab A</option>
                  <option value="lab-2">CollectorLab B</option>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="testCaseId">Test Case</Label>
                <Select id="testCaseId" value={form.testCaseId} onChange={onChange('testCaseId')}>
                  <option value="">Select Test Case</option>
                  <option value="tc-1">CBC</option>
                  <option value="tc-2">Lipid Profile</option>
                </Select>
              </Field>
            </Grid>
          </CardBody>
        </Card>

        {/* Package Information */}
        <Card>
          <CardHeader>Package Information</CardHeader>
          <CardBody>
            <Grid>
              <Field>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter Price"
                  value={form.price}
                  onChange={onChange('price')}
                />
              </Field>

              <Field>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={onChange('startDate')}
                />
              </Field>

              <Field>
                <Label htmlFor="endDate">Expired Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={onChange('endDate')}
                />
              </Field>
            </Grid>
          </CardBody>
        </Card>

        {/* Discount Information */}
        <Card>
          <CardHeader>Discount Information</CardHeader>
          <CardBody>
            <Grid>
              <Field>
                <Label htmlFor="discountActive">Discount</Label>
                <Select
                  id="discountActive"
                  value={form.discountActive}
                  onChange={onChange('discountActive')}
                >
                  <option value="Inactive">Inactive</option>
                  <option value="Active">Active</option>
                </Select>
                <Helper>Enable to apply a percentage off the Price</Helper>
              </Field>

              <Field>
                <Label htmlFor="discountPercent">Discount Percent</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="0–100"
                  value={form.discountPercent}
                  onChange={onChange('discountPercent')}
                  disabled={form.discountActive !== 'Active'}
                />
              </Field>
            </Grid>
          </CardBody>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>Status</CardHeader>
          <CardBody>
            <Grid>
              <Field>
                <Label htmlFor="status">Status</Label>
                <Select id="status" value={form.status} onChange={onChange('status')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </Field>

              <Field>
                <Label>Featured</Label>
                <div>
                  <SwitchWrap aria-label="Featured">
                    <SwitchInput checked={form.featured} onChange={onChange('featured')} />
                    <SwitchSlider />
                  </SwitchWrap>
                </div>
              </Field>

              <Field>
                <Label>Home Collection</Label>
                <div>
                  <SwitchWrap aria-label="Home Collection">
                    <SwitchInput checked={form.homeCollection} onChange={onChange('homeCollection')} />
                    <SwitchSlider />
                  </SwitchWrap>
                </div>
              </Field>
            </Grid>
          </CardBody>
          <ActionsRow>
            <Button type="button">Back</Button>
            <Button type="submit" variant="primary" disabled={!isValid}>Save</Button>
          </ActionsRow>
        </Card>
      </form>
    </Page>
  );
}
