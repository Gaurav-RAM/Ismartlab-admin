import React, { useState } from 'react';
import styled from 'styled-components';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebase";

// Styled components (unchanged)
const HelpdeskCard = styled.div` ... `;
const SectionTitle = styled.div` ... `;
const Row = styled.div` ... `;
const FieldLabel = styled.label` ... `;
const StyledInput = styled.input` ... `;
const StyledFileInput = styled.input` display: none; `;
const FileUploadContainer = styled.div` ... `;
const FileButton = styled.label` ... `;
const FileText = styled.div` ... `;
const Col = styled.div` ... `;
const QuillWrapper = styled.div` ... `;
const SubmitButton = styled.button` ... `;

export default function HelpdeskForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent empty/HTML-only descriptions
    const plainText = message.replace(/<[^>]+>/g, '').trim();
    if (!subject.trim() || !plainText) return;

    try {
      // Pre-generate a doc ref to get the ID, then write it along with data
      const ticketsCol = collection(db, "helpdeskTickets");
      const ref = doc(ticketsCol); // auto-ID here [web:35]

      await setDoc(ref, {
        id: ref.id,
        subject,
        message, // HTML from Quill
        createdAt: serverTimestamp(), // server-side time [web:17]
        imageFileName: imageFile ? imageFile.name : null,
      }); // set with known ID [web:4]

      // Reset and go back
      setSubject('');
      setMessage('');
      setImageFile(null);
      navigate('/helpdesks');
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Helpdesks' }];

  return (
    <HelpdeskCard>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((b, i) => b.to
            ? <Link key={i} component={RouterLink} underline="hover" to={b.to}>{b.label}</Link>
            : <Typography key={i} color="textPrimary">{b.label}</Typography>
          )}
        </Breadcrumbs>
      </Box>
      <SectionTitle>Basic Information</SectionTitle>
      <form onSubmit={handleSubmit}>
        <Row>
          <Col>
            <FieldLabel htmlFor="subject">
              Subject <span>*</span>
            </FieldLabel>
            <StyledInput
              id="subject"
              type="text"
              maxLength={128}
              autoFocus
              required
              placeholder="Enter Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </Col>
          <Col>
            <FieldLabel htmlFor="file">Image</FieldLabel>
            <FileUploadContainer>
              <FileButton htmlFor="file-upload">Choose Files</FileButton>
              <StyledFileInput
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <FileText>
                {imageFile ? imageFile.name : 'No file chosen'}
              </FileText>
            </FileUploadContainer>
          </Col>
        </Row>
        <FieldLabel htmlFor="desc">
          Description <span>*</span>
        </FieldLabel>
        <QuillWrapper>
          <ReactQuill
            id="desc"
            theme="snow"
            value={message}
            onChange={setMessage}
            placeholder="Enter description"
            style={{ minHeight: 120, borderRadius: 7 }}
            required
          />
        </QuillWrapper>
        <SubmitButton style={{ marginTop: "47px" }} type="submit">Save</SubmitButton>
      </form>
    </HelpdeskCard>
  );
}
