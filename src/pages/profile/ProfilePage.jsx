// src/ProfilePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { auth, db } from "../../firebase";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, Bytes } from "firebase/firestore";

/* ------- layout & theme ------- */
const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  body { margin: 0; }
`;

const PageWrap = styled.div`
  height: 100dvh;                 /* fixed to visible viewport */
  background: #f5f6fa;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;               /* body doesn't scroll */
`;

const Shell = styled.div`
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: grid;
  grid-template-columns: 260px 1fr;
  overflow: hidden;
  min-height: 0;                  /* allow inner scrolls */
`;

const Sidebar = styled.aside`
  background: #fafbfc;
  border-right: 1px solid #eef0f3;
  padding: 20px;
  overflow: auto;
`;

const SideTitle = styled.div`
  font-size: 14px;
  color: #7a869a;
  margin-bottom: 12px;
`;

const SideButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid ${p => (p.$active ? "#4069ff" : "#e5e7eb")};
  background: ${p => (p.$active ? "rgba(64,105,255,0.08)" : "#fff")};
  color: ${p => (p.$active ? "#1f2937" : "#374151")};
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s ease;
  &:hover { border-color: #4069ff; }
`;

const Content = styled.main`
  padding: 24px 24px 28px 24px;
  overflow: auto;                 /* panel scrolls */
  min-height: 0;
`;

const Header = styled.h2`
  margin: 0 0 18px;
  font-size: 20px;
  color: #111827;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border: 1px solid #eef0f3;
  border-radius: 10px;
  padding: 18px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div` display: flex; flex-direction: column; `;
const Label = styled.label` font-size: 13px; color: #374151; margin-bottom: 6px; `;

const TextInput = styled.input`
  height: 42px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  background: #f9fafb;
  color: #111827;
  &:focus { border-color: #4069ff; background: #fff; }
`;

const TextArea = styled.textarea`
  min-height: 104px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  background: #f9fafb;
  color: #111827;
  resize: vertical;
  &:focus { border-color: #4069ff; background: #fff; }
`;

const Select = styled.select`
  height: 42px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  background: #f9fafb;
  color: #111827;
  &:focus { border-color: #4069ff; background: #fff; }
  appearance: none;
`;

const RadioRow = styled.div` display: flex; gap: 16px; align-items: center; height: 42px; `;
const Radio = styled.input.attrs({ type: "radio" })``;

const RightWrap = styled(Card)` display: flex; flex-direction: column; align-items: center; gap: 14px; `;

const AvatarBox = styled.div`
  width: 180px;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  background: #f3f4f6;
  display: grid;
  place-items: center;

  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

const UploadBtn = styled.label`
  display: inline-block;
  padding: 10px 14px;
  border-radius: 8px;
  background: #4069ff;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

const HiddenFile = styled.input.attrs({ type: "file", accept: "image/*" })` display: none; `;

const Actions = styled.div` display: flex; justify-content: flex-end; margin-top: 18px; `;
const SaveBtn = styled.button`
  padding: 12px 20px; border-radius: 8px; border: 1px solid #4069ff; background: #4069ff;
  color: #fff; font-weight: 600; cursor: pointer; &:hover { filter: brightness(0.98); }
`;

const Error = styled.div` color: #b91c1c; font-size: 12px; margin-top: 6px; `;

/* Change Password */
const PasswordCard = styled(Card)` max-width: 980px; `;
const PasswordField = styled(TextInput).attrs({ type: "password" })``;
const SubmitBtn = styled(SaveBtn)` background: #8089e6; border-color: #8089e6; `;

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    dob: "",
    address: "",
    country: "",
    state: "",
    city: "",
  });

  // Avatar: local file + preview URL generated from file or bytes read from Firestore
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");
  const currentObjectUrl = useRef("");

  // Change Password state
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState("");

  // Auth gate + load Firestore profile (including avatarBytes)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : {};
        setValues({
          firstName: d.firstName ?? "",
          lastName: d.lastName ?? "",
          email: user.email ?? d.email ?? "",
          phone: d.phone ?? "",
          gender: d.gender ?? "male",
          dob: d.dob ?? "",
          address: d.address ?? "",
          country: d.country ?? "",
          state: d.state ?? "",
          city: d.city ?? "",
        });

        // Recreate a preview URL from Firestore Bytes
        if (d.avatarBytes) {
          const u8 = d.avatarBytes.toUint8Array();
          const blob = new Blob([u8], { type: d.avatarMime || "image/jpeg" });
          const url = URL.createObjectURL(blob);
          if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
          currentObjectUrl.current = url;
          setAvatarPreview(url);
        } else {
          setAvatarPreview("");
        }
      } finally {
        setLoading(false);
      }
    });
    return () => {
      if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
      unsub();
    };
  }, []);

  // Local preview for a chosen file
  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    currentObjectUrl.current = url;
    setAvatarPreview(url);
  };

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const onGender = (e) => setValues((v) => ({ ...v, gender: e.target.value }));

  // Save profile to Firestore, writing avatarBytes using Firestore Bytes type
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setError("");
    try {
      const patch = { ...values };

      if (avatarFile) {
        const buffer = await avatarFile.arrayBuffer();
        const u8 = new Uint8Array(buffer);
        const fsBytes = Bytes.fromUint8Array(u8);         // Firestore Bytes
        patch.avatarBytes = fsBytes;
        patch.avatarMime = avatarFile.type || "image/jpeg";
      }

      await setDoc(doc(db, "users", uid), patch, { merge: true }); // partial update
      alert("Saved!");
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  // Change password with reauthentication
  const onPwSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwOk("");
    if (pw.newPassword.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pw.newPassword !== pw.confirmPassword) { setPwError("Passwords do not match."); return; }
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No user");
      const cred = EmailAuthProvider.credential(user.email, pw.oldPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pw.newPassword);
      setPwOk("Password updated successfully.");
      setPw({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.message || "Password update failed");
    }
  };

  const cities = useMemo(
    () => ["Bombuflat", "Port Blair", "Bombooflat", "BOMBUFALT".toUpperCase()],
    []
  );

  return (
    <PageWrap>
      <GlobalStyle />
      <Shell>
        <Sidebar>
          <SideTitle>My Profile</SideTitle>
          <SideButton $active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
            Personal Info
          </SideButton>
          <SideButton $active={activeTab === "password"} onClick={() => setActiveTab("password")}>
            Change Password
          </SideButton>
        </Sidebar>

        <Content>
          {activeTab === "profile" ? (
            <>
              <Header>Personal Info</Header>
              {loading ? (
                <div>Loading…</div>
              ) : (
                <Layout>
                  <Card as="form" onSubmit={onSubmit}>
                    <FormGrid>
                      <Field>
                        <Label>First Name *</Label>
                        <TextInput name="firstName" value={values.firstName} onChange={onChange} />
                      </Field>
                      <Field>
                        <Label>Last Name *</Label>
                        <TextInput name="lastName" value={values.lastName} onChange={onChange} />
                      </Field>
                      <Field>
                        <Label>Email *</Label>
                        <TextInput type="email" name="email" value={values.email} onChange={onChange} />
                      </Field>
                      <Field>
                        <Label>Contact Number *</Label>
                        <TextInput name="phone" value={values.phone} onChange={onChange} />
                      </Field>

                      <Field>
                        <Label>Gender</Label>
                        <RadioRow>
                          <label><Radio name="gender" value="male" checked={values.gender==="male"} onChange={onGender}/> Male</label>
                          <label><Radio name="gender" value="female" checked={values.gender==="female"} onChange={onGender}/> Female</label>
                          <label><Radio name="gender" value="other" checked={values.gender==="other"} onChange={onGender}/> Other</label>
                        </RadioRow>
                      </Field>

                      <Field>
                        <Label>Date Of Birth *</Label>
                        <TextInput type="date" name="dob" value={values.dob} onChange={onChange} />
                      </Field>

                      <Field style={{ gridColumn: "1 / -1" }}>
                        <Label>Address</Label>
                        <TextArea name="address" value={values.address} onChange={onChange} />
                      </Field>

                      <Field>
                        <Label>Country *</Label>
                        <Select name="country" value={values.country} onChange={onChange}>
                          <option>Afghanistan</option>
                          <option>India</option>
                          <option>United States</option>
                        </Select>
                      </Field>

                      <Field>
                        <Label>State *</Label>
                        <Select name="state" value={values.state} onChange={onChange}>
                          <option>Andaman and Nicobar Islands</option>
                          <option>Delhi</option>
                          <option>Maharashtra</option>
                        </Select>
                      </Field>

                      <Field>
                        <Label>City *</Label>
                        <Select name="city" value={values.city} onChange={onChange}>
                          {cities.map((c) => <option key={c}>{c}</option>)}
                        </Select>
                      </Field>
                    </FormGrid>

                    <Actions>
                      <SaveBtn type="submit">Save</SaveBtn>
                    </Actions>

                    {error && <Error>{error}</Error>}
                  </Card>

                  <RightWrap>
                    <AvatarBox>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile preview" />
                      ) : (
                        <span style={{ color: "#6b7280", fontSize: 14 }}>No image</span>
                      )}
                    </AvatarBox>

                    <UploadBtn htmlFor="avatar">Upload Image</UploadBtn>
                    <HiddenFile id="avatar" onChange={onPickAvatar} />
                    <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                      Image is saved inside your Firestore document as Bytes when you click Save.
                    </div>
                  </RightWrap>
                </Layout>
              )}
            </>
          ) : (
            <>
              <Header>Change Password</Header>
              <PasswordCard as="form" onSubmit={onPwSubmit}>
                <Field style={{ marginBottom: 14 }}>
                  <Label>Old Password*</Label>
                  <PasswordField
                    name="oldPassword"
                    placeholder="Enter Old Password"
                    value={pw.oldPassword}
                    onChange={(e) => setPw((x) => ({ ...x, oldPassword: e.target.value }))}
                    required
                  />
                </Field>

                <Field style={{ marginBottom: 14 }}>
                  <Label>New Password*</Label>
                  <PasswordField
                    name="newPassword"
                    placeholder="Enter New Password"
                    value={pw.newPassword}
                    onChange={(e) => setPw((x) => ({ ...x, newPassword: e.target.value }))}
                    required
                  />
                </Field>

                <Field style={{ marginBottom: 14 }}>
                  <Label>Confirm Password*</Label>
                  <PasswordField
                    name="confirmPassword"
                    placeholder="Enter Confirm Password"
                    value={pw.confirmPassword}
                    onChange={(e) => setPw((x) => ({ ...x, confirmPassword: e.target.value }))}
                    required
                  />
                </Field>

                {pwError && <Error>{pwError}</Error>}
                {pwOk && <div style={{ color: "#059669", fontSize: 12 }}>{pwOk}</div>}

                <Actions>
                  <SubmitBtn type="submit">Submit</SubmitBtn>
                </Actions>
              </PasswordCard>
            </>
          )}
        </Content>
      </Shell>
    </PageWrap>
  );
};

export default ProfilePage;
