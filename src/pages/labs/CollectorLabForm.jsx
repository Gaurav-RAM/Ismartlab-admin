import React, { useEffect, useRef, useState } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Firestore
import { db } from "../../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// Router
import { useNavigate, useParams } from "react-router-dom";

/* ------------ Theme + Global Styles ------------ */
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
  },
  radius: { sm: "6px", md: "10px", lg: "12px" },
  shadow: { sm: "0 1px 2px rgba(0,0,0,0.04)", md: "0 6px 18px rgba(17,24,39,0.08)" },
  space: (n) => `${4 * n}px`,
  font: {
    base:
      "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  gridGap: "16px",
};

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body { margin: 0; font-family: ${p => p.theme.font.base}; color: ${p => p.theme.colors.text}; background: ${p => p.theme.colors.bg}; }
  :focus-visible { outline: 2px solid ${p => p.theme.colors.primary}; outline-offset: 2px; }
`;

/* ------------ Styled components ------------ */
const Page = styled.div`min-height: 100%; padding: ${p => p.theme.space(8)}; display: flex; justify-content: center;`;
const Frame = styled.div`width: 100%;`;
const Card = styled.div`background: ${p => p.theme.colors.card}; border: 1px solid ${p => p.theme.colors.border}; border-radius: ${p => p.theme.radius.lg}; box-shadow: ${p => p.theme.shadow.md};`;
const HeaderRow = styled.div`display: flex; align-items: center; justify-content: space-between; padding: ${p => p.theme.space(5)} ${p => p.theme.space(6)}; border-bottom: 1px solid ${p => p.theme.colors.line};`;
const Title = styled.h2`margin: 0; font-size: 20px; font-weight: 600;`;
const CloseButton = styled.button`padding: ${p => p.theme.space(2)} ${p => p.theme.space(4)}; border-radius: ${p => p.theme.radius.sm}; border: 1px solid ${p => p.theme.colors.border}; background: #fff; cursor: pointer;`;
const Body = styled.div`padding: ${p => p.theme.space(6)}; display: grid; gap: 28px;`;
const Section = styled.section`border: 1px solid ${p => p.theme.colors.border}; border-radius: ${p => p.theme.radius.md};`;
const SectionHead = styled.div`background: #fafafa; border-bottom: 1px solid ${p => p.theme.colors.border}; padding: ${p => p.theme.space(4)} ${p => p.theme.space(5)}; font-weight: 600;`;
const SectionBody = styled.div`padding: ${p => p.theme.space(5)}; display: grid; gap: ${p => p.theme.gridGap};`;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(12, 1fr); gap: ${p => p.theme.gridGap};
  @media (max-width: 1024px) { grid-template-columns: repeat(6, 1fr); }
  @media (max-width: 640px) { grid-template-columns: repeat(1, 1fr); }
`;
const Col = styled.div`
  grid-column: span ${p => p.span || 12};
  @media (max-width: 1024px) { grid-column: span ${p => Math.min(p.span || 12, 6)}; }
  @media (max-width: 640px) { grid-column: 1 / -1; }
`;
const Field = styled.label`display: grid; gap: 8px;`;
const Label = styled.span`font-size: 13px; color: ${p => p.theme.colors.muted};`;
const Input = styled.input`
  height: 40px; padding: 0 12px; border-radius: ${p => p.theme.radius.sm}; border: 1px solid ${p => p.theme.colors.border}; background: #fff; transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 4px ${p => p.theme.colors.focus}; outline: none; }
  &[type="file"] { padding: 8px 12px; height: auto; }
`;
const Select = styled.select`
  height: 40px; padding: 0 10px; border-radius: ${p => p.theme.radius.sm}; border: 1px solid ${p => p.theme.colors.border}; background: #fff;
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 4px ${p => p.theme.colors.focus}; outline: none; }
`;
const TextArea = styled.textarea`
  min-height: 120px; padding: 10px 12px; border-radius: ${p => p.theme.radius.sm}; border: 1px solid ${p => p.theme.colors.border}; resize: vertical;
  &:focus { border-color: ${p => p.theme.colors.primary}; box-shadow: 0 0 0 4px ${p => p.theme.colors.focus}; outline: none; }
`;
const DropZone = styled.button`
  width: 100%; aspect-ratio: 16 / 9; border: 1px dashed ${p => p.theme.colors.border}; border-radius: ${p => p.theme.radius.md}; background: #fafafa;
  display: grid; place-items: center; color: ${p => p.theme.colors.muted}; cursor: pointer;
`;
const ToggleWrap = styled.div`display: flex; align-items: center; gap: 10px;`;
const Switch = styled.button`
  width: 46px; height: 26px; border-radius: 26px; border: 1px solid ${p => p.theme.colors.border};
  background: ${p => (p.$on ? p.theme.colors.primary : "#e5e7eb")}; position: relative; transition: background .2s ease; cursor: pointer;
  &::after { content: ""; position: absolute; top: 2px; left: ${p => (p.$on ? "22px" : "2px")}; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: ${p => p.theme.shadow.sm}; transition: left .2s ease; }
`;
const Radios = styled.div`
  display: flex; align-items: center; gap: 22px;
  label { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
`;
const Footer = styled.div`padding: ${p => p.theme.space(5)} ${p => p.theme.space(6)}; border-top: 1px solid ${p => p.theme.colors.line}; display: flex; justify-content: flex-end;`;
const Primary = styled.button`padding: 10px 18px; border-radius: ${p => p.theme.radius.sm}; border: 1px solid ${p => p.theme.colors.primary}; background: ${p => p.theme.colors.primary}; color: #fff; font-weight: 600; cursor: pointer;`;
const QuillEditor = styled(ReactQuill)`
  .ql-toolbar { border: 1px solid ${p => p.theme?.colors?.border ?? "#e5e7eb"}; border-radius: ${p => p.theme?.radius?.sm ?? "6px"} ${p => p.theme?.radius?.sm ?? "6px"} 0 0; background: #fafafa; }
  .ql-container { border: 1px solid ${p => p.theme?.colors?.border ?? "#e5e7eb"}; border-top: none; border-radius: 0 0 ${p => p.theme?.radius?.sm ?? "6px"} ${p => p.theme?.radius?.sm ?? "6px"}; min-height: 160px; background: #fff; }
`;

/* ------------ Component (Create + Edit) ------------ */
export default function CollectorLabForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const fileInput = useRef(null);

  // State
  const [active, setActive] = useState(true);
  const [desc, setDesc] = useState("");

  const [labName, setLabName] = useState("");
  const [labCode, setLabCode] = useState("");

  const [tax, setTax] = useState("");
  const [taxId, setTaxId] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [country, setCountry] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseExpiry, setLicenseExpiry] = useState("");

  const [accreditationType, setAccreditationType] = useState("");
  const [accreditationFile, setAccreditationFile] = useState(null);
  const [accreditationExpiry, setAccreditationExpiry] = useState("");

  const [paymentMode, setPaymentMode] = useState("Manual");
  const [logoFile, setLogoFile] = useState(null);

  // Existing filenames (to preserve on edit when no new file chosen)
  const [logoName, setLogoName] = useState("");
  const [licenseFileName, setLicenseFileName] = useState("");
  const [accreditationFileName, setAccreditationFileName] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetAll = () => {
    setActive(true);
    setDesc("");
    setLabName("");
    setLabCode("");
    setTax("");
    setTaxId("");
    setPhone("");
    setEmail("");
    setTimeSlot("");
    setAddr1("");
    setAddr2("");
    setCountry("");
    setStateName("");
    setCity("");
    setPostal("");
    setLicenseNumber("");
    setLicenseFile(null);
    setLicenseExpiry("");
    setAccreditationType("");
    setAccreditationFile(null);
    setAccreditationExpiry("");
    setPaymentMode("Manual");
    setLogoFile(null);
    setLogoName("");
    setLicenseFileName("");
    setAccreditationFileName("");
    if (fileInput.current) fileInput.current.value = "";
  };

  // Load existing doc in edit mode
  useEffect(() => {
    const load = async () => {
      if (!isEdit || !id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "labs", id));
        if (!snap.exists()) {
          alert("Lab not found");
          navigate("/labs");
          return;
        }
        const d = snap.data() || {};
        setActive(Boolean(d.active));
        setDesc(d.desc || "");
        setLabName(d.labName || "");
        setLabCode(d.labCode || "");
        setTax(d.tax || "");
        setTaxId(d.taxId || "");
        setPhone(d.phone || "");
        setEmail(d.email || "");
        setTimeSlot(d.timeSlot || "");
        setAddr1(d.address?.line1 || "");
        setAddr2(d.address?.line2 || "");
        setCountry(d.address?.country || "");
        setStateName(d.address?.state || "");
        setCity(d.address?.city || "");
        setPostal(d.address?.postal || "");
        setLicenseNumber(d.license?.number || "");
        setLicenseExpiry(d.license?.expiry || "");
        setAccreditationType(d.accreditation?.type || "");
        setAccreditationExpiry(d.accreditation?.expiry || "");
        setPaymentMode(d.paymentMode || "Manual");

        // preserve existing filenames for display/fallback
        setLogoName(d.logoFileName || "");
        setLicenseFileName(d.license?.fileName || "");
        setAccreditationFileName(d.accreditation?.fileName || "");
      } catch (e) {
        console.error(e);
        alert("Failed to load lab");
        navigate("/labs");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, id, navigate]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        active,
        desc,
        labName: labName.trim(),
        labCode: labCode.trim(),

        tax,
        taxId: taxId.trim(),

        phone: phone.trim(),
        email: email.trim(),
        timeSlot,

        address: {
          line1: addr1.trim(),
          line2: addr2.trim(),
          country,
          state: stateName,
          city,
          postal: postal.trim(),
        },

        license: {
          number: licenseNumber.trim(),
          fileName: licenseFile?.name ?? (licenseFileName || null),
          expiry: licenseExpiry || null,
        },

        accreditation: {
          type: accreditationType,
          fileName: accreditationFile?.name ?? (accreditationFileName || null),
          expiry: accreditationExpiry || null,
        },

        logoFileName: logoFile?.name ?? (logoName || null),
        paymentMode,
      };

      if (isEdit && id) {
        await updateDoc(doc(db, "labs", id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "labs"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        resetAll();
      }
      navigate("/labs");
    } catch (e) {
      console.error(e);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Frame>
          <Card aria-label={isEdit ? "Edit Lab" : "New Lab"}>
            <HeaderRow>
              <Title>{isEdit ? "Edit Lab" : "New Lab"}</Title>
              <CloseButton type="button" onClick={() => navigate(-1)}>
                Close
              </CloseButton>
            </HeaderRow>

            <Body aria-busy={loading}>
              {/* Basic Information */}
              <Section>
                <SectionHead>Lab Logo</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={5}>
                      <Field style={{ width: "97%" }}>
                        <input
                          ref={fileInput}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          aria-label="Upload Lab Logo"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                        <DropZone
                          type="button"
                          onClick={() => fileInput.current?.click()}
                          aria-label="Open logo uploader"
                          title={logoFile?.name || logoName || "Click to upload"}
                        >
                          {logoFile?.name || logoName || "Click to upload"}
                        </DropZone>
                      </Field>

                      <div style={{ height: 16 }} />
                      <ToggleWrap>
                        <Label>Status</Label>
                        <Switch
                          type="button"
                          aria-pressed={active}
                          $on={active}
                          onClick={() => setActive((v) => !v)}
                          title={active ? "Active" : "Inactive"}
                        />
                        <span>{active ? "Active" : "Inactive"}</span>
                      </ToggleWrap>
                    </Col>

                    <Col span={7}>
                      <Grid>
                        <Col span={6}>
                          <Field>
                            <Label>Lab Name</Label>
                            <Input
                              placeholder="Enter Lab Name"
                              value={labName}
                              onChange={(e) => setLabName(e.target.value)}
                            />
                          </Field>
                        </Col>

                        <Col span={6}>
                          <Field>
                            <Label>Lab Code</Label>
                            <Input
                              placeholder="Enter Lab Code"
                              value={labCode}
                              onChange={(e) => setLabCode(e.target.value)}
                            />
                          </Field>
                        </Col>

                        <Col span={12}>
                          <Field>
                            <Label>Description</Label>
                            <QuillEditor
                              theme="snow"
                              value={desc}
                              onChange={setDesc}
                              placeholder="Write a brief description..."
                            />
                          </Field>
                        </Col>
                      </Grid>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>

              {/* Vendor & Tax Information */}
              <Section>
                <SectionHead>Vendor &amp; Tax Information</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={6}>
                      <Field>
                        <Label>Tax</Label>
                        <Select
                          value={tax}
                          onChange={(e) => setTax(e.target.value)}
                        >
                          <option value="" disabled>
                            Select Tax
                          </option>
                          <option>GST</option>
                          <option>VAT</option>
                          <option>None</option>
                        </Select>
                      </Field>
                    </Col>

                    <Col span={6}>
                      <Field>
                        <Label>Tax Identification Number</Label>
                        <Input
                          placeholder="Enter Tax Identification Number"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                        />
                      </Field>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>

              {/* Other Information */}
              <Section>
                <SectionHead>Other Information</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={4}>
                      <Field>
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="Enter Phone Number"
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </Field>
                    </Col>
                    <Col span={4}>
                      <Field>
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          placeholder="Enter Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </Field>
                    </Col>
                    <Col span={4}>
                      <Field>
                        <Label>Time Slot</Label>
                        <Select
                          value={timeSlot}
                          onChange={(e) => setTimeSlot(e.target.value)}
                        >
                          <option value="" disabled>
                            Select Time Slot
                          </option>
                          <option>Morning</option>
                          <option>Afternoon</option>
                          <option>Evening</option>
                        </Select>
                      </Field>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>

              {/* Address Information */}
              <Section>
                <SectionHead>Address Information</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={6}>
                      <Field>
                        <Label>Address Line 1</Label>
                        <Input
                          placeholder="Enter Address Line 1"
                          value={addr1}
                          onChange={(e) => setAddr1(e.target.value)}
                        />
                      </Field>
                    </Col>
                    <Col span={6}>
                      <Field>
                        <Label>Address Line 2</Label>
                        <Input
                          placeholder="Enter Address Line 2"
                          value={addr2}
                          onChange={(e) => setAddr2(e.target.value)}
                        />
                      </Field>
                    </Col>

                    <Col span={3}>
                      <Field>
                        <Label>Country</Label>
                        <Select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        >
                          <option value="" disabled>
                            Select Country
                          </option>
                          <option>India</option>
                          <option>USA</option>
                          <option>UK</option>
                        </Select>
                      </Field>
                    </Col>
                    <Col span={3}>
                      <Field>
                        <Label>State</Label>
                        <Select
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                        >
                          <option value="" disabled>
                            Select State
                          </option>
                          <option>Karnataka</option>
                          <option>Maharashtra</option>
                          <option>Gujarat</option>
                        </Select>
                      </Field>
                    </Col>
                    <Col span={3}>
                      <Field>
                        <Label>City</Label>
                        <Select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        >
                          <option value="" disabled>
                            Select City
                          </option>
                          <option>Bengaluru</option>
                          <option>Mumbai</option>
                          <option>Ahmedabad</option>
                        </Select>
                      </Field>
                    </Col>
                    <Col span={3}>
                      <Field>
                        <Label>Postal Code</Label>
                        <Input
                          placeholder="Enter Postal Code"
                          value={postal}
                          onChange={(e) =>
                            setPostal(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </Field>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>

              {/* License Information */}
              <Section>
                <SectionHead>License Information</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={5}>
                      <Field>
                        <Label>License Number</Label>
                        <Input
                          placeholder="Enter License Number"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                        />
                      </Field>
                    </Col>
                    <Col span={4}>
                      <Field>
                        <Label>License Document</Label>
                        <Input
                          type="file"
                          onChange={(e) =>
                            setLicenseFile(e.target.files?.[0] || null)
                          }
                        />
                        {licenseFileName && !licenseFile && (
                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            Current: {licenseFileName}
                          </span>
                        )}
                      </Field>
                    </Col>
                    <Col span={3}>
                      <Field>
                        <Label>License Expiry Date</Label>
                        <Input
                          type="date"
                          value={licenseExpiry}
                          onChange={(e) => setLicenseExpiry(e.target.value)}
                        />
                      </Field>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>

              {/* Accreditation Information */}
              <Section>
                <SectionHead>Accreditation Information</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={5}>
                      <Field>
                        <Label>Accreditation Type</Label>
                        <Select
                          value={accreditationType}
                          onChange={(e) => setAccreditationType(e.target.value)}
                        >
                          <option value="" disabled>
                            Select Accreditation Type
                          </option>
                          <option>NABL</option>
                          <option>CAP</option>
                          <option>Other</option>
                        </Select>
                      </Field>
                    </Col>
                    <Col span={4}>
                      <Field>
                        <Label>Accreditation Certificate</Label>
                        <Input
                          type="file"
                          onChange={(e) =>
                            setAccreditationFile(e.target.files?.[0] || null)
                          }
                        />
                        {accreditationFileName && !accreditationFile && (
                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            Current: {accreditationFileName}
                          </span>
                        )}
                      </Field>
                    </Col>
                    <Col span={3}>
                      <Field>
                        <Label>Accreditation Expiry Date</Label>
                        <Input
                          type="date"
                          value={accreditationExpiry}
                          onChange={(e) =>
                            setAccreditationExpiry(e.target.value)
                          }
                        />
                      </Field>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>

              {/* Payment Information */}
              <Section>
                <SectionHead>Payment Information</SectionHead>
                <SectionBody>
                  <Grid>
                    <Col span={12}>
                      <Field as="div">
                        <Label>Payment Modes Accepted</Label>
                        <Radios role="radiogroup" aria-label="Payment Modes">
                          <label>
                            <input
                              type="radio"
                              name="pay"
                              checked={paymentMode === "Manual"}
                              onChange={() => setPaymentMode("Manual")}
                            />{" "}
                            Manual
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="pay"
                              checked={paymentMode === "Online"}
                              onChange={() => setPaymentMode("Online")}
                            />{" "}
                            Online
                          </label>
                        </Radios>
                      </Field>
                    </Col>
                  </Grid>
                </SectionBody>
              </Section>
            </Body>

            <Footer>
              <Primary type="button" onClick={handleSave} disabled={saving || loading}>
                {saving
                  ? isEdit
                    ? "Updating…"
                    : "Saving…"
                  : isEdit
                  ? "Update"
                  : "Save"}
              </Primary>
            </Footer>
          </Card>
        </Frame>
      </Page>
    </ThemeProvider>
  );
}
