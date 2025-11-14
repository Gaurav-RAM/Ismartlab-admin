// src/pages/labs/CollectorForm.attractive.jsx
// DB-only (no Storage). Supports Create and Edit based on /collectors/new vs /collectors/edit/:id

import React from 'react';
import dayjs from 'dayjs';
import {
  Avatar, Box, Breadcrumbs, Button, Container, Divider, FormControl, FormControlLabel,
  FormHelperText, FormLabel, Grid, IconButton, InputAdornment, Link as MUILink, MenuItem,
  Paper, Radio, RadioGroup, Select, Switch, TextField, Typography, CssBaseline
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { Visibility, VisibilityOff, Upload, ArrowBack } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useParams } from 'react-router-dom';

import {
  collection, addDoc, serverTimestamp, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

// ---------- memoized helpers ----------
const SectionHeader = React.memo(function SectionHeader({ title }) {
  return (
    <Box sx={{ py: 1, px: 2, color: '#fff',
      background: 'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-primary-dark))',
      borderTopLeftRadius: 1.5, borderTopRightRadius: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>{title}</Typography>
    </Box>
  );
});
const SectionBody = React.memo(function SectionBody({ children }) {
  return <Paper sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, p: 2, bgcolor: 'background.paper' }}>{children}</Paper>;
});
// --------------------------------------------------------------

// Theme with input focus/hover background removed
const appTheme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: '#3F6FFF', dark: '#2649C4' },
    secondary: { main: '#7856FF' },
    background: { default: '#F7F8FB', paper: '#FFFFFF' },
    divider: alpha('#1F2A44', 0.12),
    text: { primary: '#1F2A44', secondary: alpha('#1F2A44', 0.7) }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'input:-webkit-autofill': {
          WebkitTextFillColor: 'inherit',
          transition: 'background-color 9999s ease-out',
          WebkitBoxShadow: '0 0 0px 1000px transparent inset'
        }
      }
    },
    MuiTextField: { defaultProps: { size: 'small', variant: 'outlined', fullWidth: true, autoComplete: 'off' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: 'transparent',
          '& .MuiOutlinedInput-notchedOutline': { transition: 'border-color .2s ease' },
          '&.Mui-focused': { backgroundColor: 'transparent' }, '&:hover:not(.Mui-focused)': { backgroundColor: 'transparent' } },
        input: { backgroundColor: 'transparent' }
      }
    },
    MuiButton: { defaultProps: { variant: 'contained' }, styleOverrides: { root: { textTransform: 'none', borderRadius: 10, boxShadow: 'none' } } },
    MuiPaper: { defaultProps: { variant: 'outlined', elevation: 0 }, styleOverrides: { root: { borderColor: 'var(--mui-palette-divider)', boxShadow: '0 2px 12px rgba(31,42,68,0.06)' } } }
  }
});

export default function CollectorForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const LIST_PATH = '/collectors';

  // UI state
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Form state (left)
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [dob, setDob] = React.useState(null); // dayjs instance
  const [gender, setGender] = React.useState('male');
  const [preview, setPreview] = React.useState(null);
  const [photoDataUrl, setPhotoDataUrl] = React.useState(null);

  // Form state (right)
  const [statusActive, setStatusActive] = React.useState(true);
  const [lab, setLab] = React.useState('');
  const [education, setEducation] = React.useState('');
  const [degree, setDegree] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [experience, setExperience] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [stateVal, setStateVal] = React.useState('');
  const [city, setCity] = React.useState('');

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result); setPhotoDataUrl(reader.result); };
    reader.readAsDataURL(file);
  };

  // Load on edit
  React.useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    (async () => {
      try {
        const ref = doc(db, 'collectors', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) { alert('Collector not found'); navigate(LIST_PATH, { replace: true }); return; }
        const d = snap.data();
        if (!mounted) return;
        setFirstName(d.firstName ?? '');
        setLastName(d.lastName ?? '');
        setEmail(d.email ?? '');
        setUsername(d.username ?? '');
        setContactNumber(d.contactNumber ?? '');
        setDob(d.dob ? dayjs(d.dob.toDate ? d.dob.toDate() : d.dob) : null);
        setGender(d.gender ?? 'male');
        setPreview(d.photoDataUrl ?? null);
        setPhotoDataUrl(d.photoDataUrl ?? null);
        setStatusActive(!!d.statusActive);
        setLab(d.lab ?? '');
        setEducation(d.education ?? '');
        setDegree(d.degree ?? '');
        setBio(d.bio ?? '');
        setExperience(d.experience ?? '');
        setAddress(d.address ?? '');
        setCountry(d.country ?? '');
        setStateVal(d.state ?? '');
        setCity(d.city ?? '');
      } catch (e) {
        console.error(e); alert('Failed to load collector');
      }
    })();
    return () => { mounted = false; };
  }, [isEdit, id, navigate]);

  // Save (create or update)
  const handleSave = async () => {
    if (!firstName || !lastName || !email || !username) { alert('Please fill required fields'); return; }
    if (!isEdit && (!password || (confirmPassword && confirmPassword !== password))) { alert('Provide valid password and confirmation'); return; }

    setLoading(true);
    try {
      const base = {
        firstName, lastName, email, username, contactNumber, gender, lab, statusActive,
        education, degree, bio, experience, address, country, state: stateVal, city,
        photoDataUrl: photoDataUrl || null,
        dob: dob ? (dayjs.isDayjs(dob) ? dob.toDate() : dob) : null,
      };

      if (isEdit) {
        await updateDoc(doc(db, 'collectors', id), { ...base, updatedAt: serverTimestamp() });
        navigate(LIST_PATH, { replace: true, state: { updatedId: id, toast: 'Collector updated' } });
      } else {
        const newRef = await addDoc(collection(db, 'collectors'), { ...base, password, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        navigate(LIST_PATH, { replace: true, state: { createdId: newRef.id, toast: 'Collector created' } });
      }
    } catch (e) {
      console.error(e); alert('Save failed');
    } finally { setLoading(false); }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
          <Container maxWidth="xl">
            {/* Header */}
            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Grid item>
                <Breadcrumbs aria-label="breadcrumb" separator="›" sx={{ fontSize: 12, color: 'text.secondary' }}>
                  <MUILink underline="hover" color="inherit" href="#">Dashboard</MUILink>
                  <Typography color="text.secondary" fontSize={12}>{isEdit ? 'Edit Collector' : 'New Collector'}</Typography>
                </Breadcrumbs>
              </Grid>
              <Grid item>
                <Button color="primary" variant="outlined" startIcon={<ArrowBack />} sx={{ textTransform: 'none' }}
                        onClick={() => navigate(LIST_PATH, { replace: true })}>
                  Back
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* LEFT */}
              <Grid item xs={12} md={6}>
                <SectionHeader title="Basic Information" />
                <SectionBody>
                  <Grid container spacing={2}>
                    {/* Photo */}
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%' }}>
                        <FormControl fullWidth>
                          <FormLabel sx={{ mb: 1 }}>Profile Image</FormLabel>
                          <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, height: 180,
                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                                     bgcolor: '#fafafa', mb: 2, transition: 'all .2s ease',
                                     ':hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}>
                            {preview ? <Avatar src={preview} alt="Profile" sx={{ width: 96, height: 96 }} />
                                     : <Avatar sx={{ width: 96, height: 96, bgcolor: 'grey.300', color: 'text.secondary' }} />}
                          </Box>
                          <Button component="label" size="small" startIcon={<Upload />}>
                            Upload Image
                            <input hidden accept="image/*" type="file" onChange={handleUpload} />
                          </Button>
                        </FormControl>
                      </Paper>
                    </Grid>

                    {/* Inputs */}
                    <Grid item xs={12} md={8}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <FormLabel htmlFor="firstName">First Name</FormLabel>
                            <TextField id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter first name" />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <FormLabel htmlFor="lastName">Last Name</FormLabel>
                            <TextField id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter last name" />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <TextField id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <FormLabel htmlFor="username">Username</FormLabel>
                            <TextField id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
                          </FormControl>
                        </Grid>

                        {/* Passwords are only for create */}
                        {!isEdit && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <FormLabel htmlFor="password">Password</FormLabel>
                                <TextField
                                  id="password"
                                  placeholder="Enter password"
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(v => !v)} edge="end" size="small">
                                          {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                                <TextField
                                  id="confirmPassword"
                                  type={showConfirm ? 'text' : 'password'}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Re-enter password"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirm(v => !v)} edge="end" size="small">
                                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </FormControl>
                            </Grid>
                          </>
                        )}

                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <FormLabel htmlFor="contactNumber">Contact Number</FormLabel>
                            <TextField id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Enter contact number" />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <FormLabel htmlFor="dob">Date Of Birth</FormLabel>
                            <DatePicker
                              value={dob}
                              onChange={(v) => setDob(v)}
                              slotProps={{ textField: { id: 'dob', fullWidth: true, placeholder: 'Enter date of birth', size: 'small' } }}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <FormLabel sx={{ mb: 0.5 }}>Gender</FormLabel>
                            <RadioGroup row value={gender} onChange={(e) => setGender(e.target.value)}>
                              <FormControlLabel value="male" control={<Radio size="small" />} label="Male" />
                              <FormControlLabel value="female" control={<Radio size="small" />} label="Female" />
                              <FormControlLabel value="other" control={<Radio size="small" />} label="Other" />
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </SectionBody>
              </Grid>

              {/* RIGHT */}
              <Grid item xs={12} md={6}>
                <SectionHeader title="Vendor & Lab Information" />
                <SectionBody>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth>
                        <FormLabel htmlFor="lab">Select Lab</FormLabel>
                        <Select
                          id="lab" value={lab} onChange={(e) => setLab(e.target.value)}
                          displayEmpty renderValue={(value) => (value ? value : 'Select lab')} size="small">
                          <MenuItem value="">Select lab</MenuItem>
                          <MenuItem value="Lab A">Lab A</MenuItem>
                          <MenuItem value="Lab B">Lab B</MenuItem>
                          <MenuItem value="Lab C">Lab C</MenuItem>
                        </Select>
                        <FormHelperText>Select lab</FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>
                </SectionBody>

                <Box sx={{ mt: 3 }}>
                  <SectionHeader title="Other Information" />
                  <SectionBody>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="education">Education</FormLabel>
                          <TextField id="education" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Enter education" />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="degree">Degree</FormLabel>
                          <TextField id="degree" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="Enter degree" />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="bio">Bio</FormLabel>
                          <TextField id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write a short bio" multiline minRows={3} />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="experience">Experience</FormLabel>
                          <TextField id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Enter experience" />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <FormLabel>Status</FormLabel>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch size="small" checked={statusActive} onChange={(e) => setStatusActive(e.target.checked)} />
                            <Typography variant="body2" color="text.secondary">{statusActive ? 'Active' : 'Inactive'}</Typography>
                          </Box>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="address">Address</FormLabel>
                          <TextField id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" multiline minRows={3} />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="country">Country</FormLabel>
                          <Select
                            id="country" value={country}
                            onChange={(e) => { setCountry(e.target.value); setStateVal(''); setCity(''); }}
                            displayEmpty renderValue={(value) => (value ? value : 'Select country')} size="small">
                            <MenuItem value="">Select country</MenuItem>
                            <MenuItem value="India">India</MenuItem>
                            <MenuItem value="USA">USA</MenuItem>
                            <MenuItem value="UK">UK</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="state">State</FormLabel>
                          <Select
                            id="state" value={stateVal} onChange={(e) => setStateVal(e.target.value)}
                            displayEmpty renderValue={(value) => (value ? value : 'Select state')} size="small" disabled={!country}>
                            <MenuItem value="">Select state</MenuItem>
                            <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                            <MenuItem value="Karnataka">Karnataka</MenuItem>
                            <MenuItem value="Gujarat">Gujarat</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <FormLabel htmlFor="city">City</FormLabel>
                          <Select
                            id="city" value={city} onChange={(e) => setCity(e.target.value)}
                            displayEmpty renderValue={(value) => (value ? value : 'Select city')} size="small" disabled={!stateVal}>
                            <MenuItem value="">Select city</MenuItem>
                            <MenuItem value="Mumbai">Mumbai</MenuItem>
                            <MenuItem value="Pune">Pune</MenuItem>
                            <MenuItem value="Nashik">Nashik</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </SectionBody>
                </Box>
              </Grid>
            </Grid>

            {/* Footer actions */}
            <Box sx={{ position: { xs: 'static', md: 'sticky' }, bottom: 0, mt: 3, py: 2,
                       bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider',
                       display: 'flex', justifyContent: 'flex-end' }}>
              <Button color="primary" sx={{ px: 4 }} onClick={handleSave} disabled={loading}>
                {loading ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
              </Button>
            </Box>

          </Container>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
