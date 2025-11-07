// CollectorTestCaseForm.jsx
import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Global = createGlobalStyle`
  :root{
    --bg:#f6f7fb;
    --card:#ffffff;
    --ink:#1f2937;
    --muted:#6b7280;
    --primary:#4f46e5;
    --primary-ink:#ffffff;
    --line:#e5e7eb;
    --focus:#6366f1;
    --danger:#ef4444;
    --radius:10px;
    --gap:16px;
  }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, system-ui, Arial, sans-serif; color:var(--ink); background:var(--bg); }
`;

const Page = styled.div`
  padding: 28px;
  max-width: 1280px;
  margin: 0 auto;
`;

const HeaderBar = styled.div`
  display:flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
`;

const Title = styled.h1`
  font-size: 22px;
  margin: 0;
  font-weight: 600;
`;

const Actions = styled.div`
  display:flex;
  gap: 10px;
`;

const Button = styled.button`
  appearance: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 600;
  border: 1px solid ${props => (props.$variant === 'primary' ? 'var(--primary)' : 'var(--line)')};
  color: ${props => (props.$variant === 'primary' ? 'var(--primary-ink)' : 'var(--ink)')};
  background: ${props => (props.$variant === 'primary' ? 'var(--primary)' : '#fff')};
  cursor: pointer;
  &:hover { opacity: .95; }
  &:focus-visible{ outline: 3px solid var(--focus); outline-offset: 2px; }
`;

const Card = styled.section`
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  margin-bottom: 18px;
  overflow: hidden;
`;

const CardHead = styled.header`
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  display:flex;
  align-items:center;
  justify-content: space-between;
  h3{ margin:0; font-size: 16px; font-weight: 600; }
`;

const CardBody = styled.div`
  padding: 16px;
`;

const Grid = styled.div`
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--gap);
  @media (max-width: 900px){
    grid-template-columns: repeat(6, 1fr);
  }
  @media (max-width: 640px){
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Col = styled.div`
  grid-column: span ${props => props.$span ?? 12};
  @media (max-width: 900px){ grid-column: span ${props => Math.min(props.$span ?? 12, 6)}; }
  @media (max-width: 640px){ grid-column: span 4; }
`;

const Field = styled.label`
  display:block;
  width: 100%;
  small{ display:block; color: var(--muted); margin-top: 6px; }
`;

const Label = styled.span`
  display:block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width:100%;
  border: 1px solid var(--line);
  background:#fff;
  height: 40px;
  border-radius: 8px;
  padding: 0 12px;
  font-size:14px;
  &:focus{ outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
`;

const Select = styled.select`
  width:100%;
  border: 1px solid var(--line);
  height: 40px;
  border-radius: 8px;
  padding: 0 10px;
  background:#fff;
  font-size:14px;
  &:focus{ outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
`;

/* Quill styling wrapper to match cards/inputs */
const QuillField = styled.div`
  .ql-toolbar {
    border: 1px solid var(--line);
    border-bottom: 0;
    border-radius: 8px 8px 0 0;
    background: #fff;
  }
  .ql-container {
    border: 1px solid var(--line);
    border-radius: 0 0 8px 8px;
    background:#fff;
    min-height: 160px;
  }
  .ql-editor { min-height: 140px; font-size:14px; }
`;

/* React Quill config */
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

export default function CollectorTestCaseForm(){
  const [description, setDescription] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [specimenDetails, setSpecimenDetails] = useState('');

  return (
    <>
      <Global />
      <Page>
        <HeaderBar>
          <Title>Collector • Add Test Case</Title>
          <Actions>
            <Button $variant="ghost">Reset</Button>
            <Button $variant="primary">Save</Button>
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
                  <UploadBox>
                    <div>
                      <div>Drop or click to upload</div>
                      <small>PNG, JPG up to 5MB</small>
                    </div>
                  </UploadBox>
                </Field>
              </Col>
              <Col $span={9}>
                <Grid>
                  <Col $span={6}>
                    <Field>
                      <Label>Test Name</Label>
                      <Input placeholder="Enter test name" />
                    </Field>
                  </Col>
                  <Col $span={6}>
                    <Field>
                      <Label>Test Code</Label>
                      <Input placeholder="Unique code" />
                    </Field>
                  </Col>
                  <Col $span={6}>
                    <Field>
                      <Label>Category</Label>
                      <Select>
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
                      <Select>
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
                  <Label>Category</Label>
                  <Input placeholder="Enter category or section" />
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Lab</Label>
                  <Select>
                    <option value="">Select lab</option>
                    <option>Central Lab</option>
                    <option>Satellite Lab</option>
                  </Select>
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Host/IP</Label>
                  <Input placeholder="e.g., 10.0.0.12" />
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Test Request Time</Label>
                  <Input type="datetime-local" />
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
          <CardHead><h3>Test Guidlines PDF</h3></CardHead>
          <CardBody>
            <Grid>
              <Col $span={6}>
                <Field>
                  <Label>Instruction PDF</Label>
                  <Input type="file" accept=".pdf" />
                  <small>Upload any supporting document</small>
                </Field>
              </Col>
              <Col $span={6}>
                <Field>
                  <Label>Reference Link</Label>
                  <Input placeholder="https://..." />
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
                    <input type="checkbox" defaultChecked />
                    <span />
                  </Switch>
                  <span>Active</span>
                </Row>
              </Col>
              <Col $span={4}>
                <Label>Home Collection</Label>
                <Row>
                 <Switch>
                    <input type="checkbox" />
                    <span />
                  </Switch>
                   <span>Available</span>
                </Row>
              </Col>
              <Col $span={4}>
                <Label>Featured</Label>
                <Row>
                  <Switch>
                    <input type="checkbox" />
                    <span />
                  </Switch>
                  <span>Featured</span>
                </Row>
              </Col>
            </Grid>
            <FooterBar>
              <Button $variant="ghost">Cancel</Button>
              <Button $variant="primary">Submit</Button>
            </FooterBar>
          </CardBody>
        </Card>
      </Page>
    </>
  );
}

/* Reused components from earlier snippet */
const UploadBox = styled.div`
  border: 2px dashed var(--line);
  border-radius: 12px;
  background: #fafafa;
  height: 160px;
  display:flex;
  align-items:center;
  justify-content:center;
  color: var(--muted);
  text-align:center;
  padding: 10px;
`;
const Row = styled.div`
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: wrap;
`;
const Switch = styled.label`
  position: relative;
  width: 44px;
  height: 24px;
  display:inline-block;
  input{ display:none; }
  span{
    position:absolute; inset:0; background:#e5e7eb; border-radius:999px; transition:.2s;
  }
  span::after{
    content:"";
    position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%;
    background:#fff; box-shadow: 0 1px 2px rgba(0,0,0,.15); transition:.2s;
  }
  input:checked + span{ background: var(--primary); }
  input:checked + span::after{ transform: translateX(20px); }
`;
const FooterBar = styled.div`
  display:flex;
  justify-content:flex-end;
  gap: 10px;
  padding: 10px 0 2px;
`;
