import styled from 'styled-components';
import React, { useEffect, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";

import { db } from "../../firebase";  // Your Firebase config export

const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Helpdesks', to: '/helpdesks' }, { label: 'Helpdesk Detail' }];

const QuillWrapper = styled.div`
  margin-bottom: 18px;
  .ql-container {
    border-radius: 8px;
    min-height: 100px;
    border: 1px solid #d1d5db;
    font-size: 16px;
  }
  .ql-toolbar {
    border-radius: 8px 8px 0 0;
    border: 1px solid #d1d5db;
    background: #f7f7fb;
  }
`;

const Container = styled.div`
  background: #fafafb;
  min-height: 100vh;
  padding: 40px;
`;

const FlexRow = styled.div`
  display: flex;
  gap: 32px;
  margin-top: 24px;
`;

const Card = styled.div`
  background: #fff;
  box-shadow: 0 2px 8px rgba(30, 40, 90, 0.04);
  border-radius: 12px;
  padding: 32px 24px;
  min-width: 340px;
  flex: 1;
`;

const Title = styled.h2`
  font-size: 20px;
  color: #2a3557;
  margin-bottom: 16px;
`;

const Label = styled.div`
  color: #a0aec0;
  font-size: 15px;
`;

const Value = styled.div`
  color: #232a3c;
  font-size: 16px;
  font-weight: 500;
`;

const Status = styled.span`
  background: #29cf6a;
  color: #fff;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  margin-left: 10px;
`;

const FormRow = styled.div`
  margin-bottom: 18px;
`;

const FileInput = styled.input`
  display: block;
  margin-bottom: 12px;
`;

const ButtonRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 16px;
`;

const Button = styled.button`
  background: ${({ danger }) => (danger ? "#ff5f5f" : "#425af2")};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(60, 80, 180, 0.05);
  &:hover {
    background: ${({ danger }) => (danger ? "#d93131" : "#293ea2")};
  }
`;

const BackButton = styled.button`
  background: #e6e8ef;
  color: #232a3c;
  border: none;
  border-radius: 6px;
  padding: 7px 20px;
  font-size: 15px;
  margin-bottom: 24px;
  cursor: pointer;
`;

// Helper: safely format Firestore Timestamp/Date/number/string
const formatTimestamp = (ts) => {
  if (!ts) return '—';
  if (typeof ts?.toDate === 'function') return ts.toDate().toLocaleString(); // Firestore Timestamp -> JS Date -> string
  if (ts instanceof Date) return ts.toLocaleString();
  if (typeof ts === 'number') return new Date(ts).toLocaleString(); // epoch ms
  return String(ts); // already a string
};

export default function HelpdeskView() {
  const { id } = useParams(); // expect route: /helpdesks/:id
  const navigate = useNavigate();
  const storage = getStorage();

  const [details, setDetails] = useState(null);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch helpdesk data from Firestore
useEffect(() => {
  const run = async () => {
    if (!id || typeof id !== 'string') {
      console.warn('Missing or invalid id from route params:', id);
      alert('Invalid or missing id');
      navigate('/helpdesks');
      return;
    }
    const cleanId = id.trim();
    console.log('Fetching doc at helpdeskTickets/', cleanId);

    try {
      const snap = await getDoc(doc(db, 'helpdeskTickets', cleanId));
      console.log('exists:', snap.exists());
      if (snap.exists()) {
        const data = snap.data();
        setDetails(data);
        setDescription(data.note || '');
      } else {
        alert('Helpdesk not found');
        navigate('/helpdesks');
      }
    } catch (err) {
      console.error('getDoc error:', err);
      alert(err.message);
      navigate('/helpdesks');
    }
  };
  run();
}, [id, navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Save changes to Firestore (note and image)
  const handleSave = async () => {
    setLoading(true);
    let imageUrl = details?.imageUrl || "";
    if (file) {
      const storageRef = ref(storage, `helpdesks/${id}/${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }
    const docRef = doc(db, "helpdeskTickets", id);
    await updateDoc(docRef, {
      note: description,
      imageUrl,
    });
    setLoading(false);
    navigate('/helpdesks');
  };

  // Mark as closed and save
  const handleMarkAsClosed = async () => {
    setLoading(true);
    let imageUrl = details?.imageUrl || "";
    if (file) {
      const storageRef = ref(storage, `helpdesks/${id}/${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }
    const docRef = doc(db, "helpdeskTickets", id);
    await updateDoc(docRef, {
      status: "closed",
      note: description,
      imageUrl,
    });
    setLoading(false);
    navigate('/helpdesks');
  };

  if (loading || !details) return <Container><p>Loading...</p></Container>;

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((b, i) =>
            b.to
              ? <Link key={i} component={RouterLink} underline="hover" to={b.to}>{b.label}</Link>
              : <Typography key={i} color="textPrimary">{b.label}</Typography>
          )}
        </Breadcrumbs>
      </Box>
      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <BackButton onClick={() => navigate('/helpdesks')}>&lt;&lt; Back</BackButton>
      </div>
      <FlexRow>
        <Card>
          <Title>Helpdesk Detail</Title>
          <FormRow><Label>ID:</Label> <Value>{id}</Value></FormRow>
          <FormRow><Label>Date & Time:</Label> <Value>{formatTimestamp(details.createdAt || details.datetime)}</Value></FormRow>
          <FormRow><Label>Name:</Label> <Value>{details.name}</Value></FormRow>
          <FormRow><Label>Mode:</Label> <Value>{details.mode || '-'}</Value></FormRow>
          <hr style={{ margin: '16px 0', border: 'none', borderBottom: '1px solid #ececec' }} />
          <FormRow>
            <Label>Subject:</Label>
            <Value>
              {details.subject} <Status style={{ background: details.status === 'open' ? "#29cf6a" : "#ff5f5f" }}>{details.status?.toUpperCase()}</Status>
            </Value>
          </FormRow>
          <FormRow>
            <Label>Description:</Label>
            <div>
              {details.imageUrl && <img src={details.imageUrl} alt="User" style={{ width: '45px', borderRadius: '8px', marginRight: '10px' }} />}
              <span dangerouslySetInnerHTML={{ __html: details.description }} />
            </div>
          </FormRow>
        </Card>

        <Card>
          <Title>Note</Title>
          <FormRow>
            <Label>Image</Label>
            <FileInput type="file" onChange={handleFileChange} />
          </FormRow>
          <FormRow>
            <Label>Description <span style={{ color: '#f34' }}> *</span></Label>
            <QuillWrapper>
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Enter description..."
              />
            </QuillWrapper>
          </FormRow>
          <ButtonRow>
            <Button danger disabled={loading} onClick={handleMarkAsClosed}>Mark as Closed</Button>
            <Button disabled={loading} onClick={handleSave}>Save</Button>
          </ButtonRow>
        </Card>
      </FlexRow>
    </Container>
  );
}
