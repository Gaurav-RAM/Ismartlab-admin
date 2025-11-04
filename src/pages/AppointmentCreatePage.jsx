// src/features/appointments/AppointmentCreatePage.jsx
import React from "react";
import {
  Container,
  Stack,
  Grid,
  Typography,
  Divider,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  FormLabel,
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { db } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Height } from "@mui/icons-material";

const labelSx = { fontWeight: 600 };
const fieldSize = "small";
const fieldItemSx = { minWidth: 337 };
const fieldItemSxl = { minWidth: "100%", Height: "400px" };

export default function AppointmentCreatePage({ onCreate }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    customer: null,
    members: [],
    lab: null,
    testType: "",
    testPackage: "",
    dateTime: dayjs(), // single source of truth
    coupon: "",
    collectionType: "",
    file: null,
    symptomsHtml: "",
  });

  const customers = [
    { id: 1, name: "John Doe", email: "john@gmail.com" },
    { id: 2, name: "Robert Martin", email: "robert@gmail.com" },
  ];
  const labs = [
    { id: 1, name: "Advanced Diagnostics Lab" },
    { id: 2, name: "Spectrum Health Diagnostics" },
    { id: 3, name: "Precision Medical Lab" },
  ];
  const testTypes = ["Blood", "Urine", "Imaging"];
  const testPackages = [
    "Hemoglobin A1C",
    "Blood Glucose Test",
    "Creatinine Clearance Test",
    "PSA",
    "Essential Health & Wellness Package",
  ];
  const coupons = ["WELCOME10", "SAVE15", "FESTIVE5"];
  const collections = ["At Lab", "Home Visit", "Pickup at Clinic"];

  const canSave =
    form.customer &&
    form.lab &&
    form.testPackage &&
    form.dateTime &&
    form.collectionType;

  const handleFile = (e) =>
    setForm((f) => ({ ...f, file: e.target.files?.[0] || null }));

  const reset = () =>
    setForm({
      customer: null,
      members: [],
      lab: null,
      testType: "",
      testPackage: "",
      dateTime: dayjs(),
      coupon: "",
      collectionType: "",
      file: null,
      symptomsHtml: "",
    });

  const handleClose = () => {
    reset();
    navigate("/appointments");
  };

  // Split date/time while keeping one source of truth
  const setDatePart = (newDate) => {
    if (!newDate) return;
    setForm((f) => ({
      ...f,
      dateTime: dayjs(f.dateTime)
        .year(newDate.year())
        .month(newDate.month())
        .date(newDate.date()),
    }));
  };

  const setTimePart = (newTime) => {
    if (!newTime) return;
    setForm((f) => ({
      ...f,
      dateTime: dayjs(f.dateTime)
        .hour(newTime.hour())
        .minute(newTime.minute())
        .second(0)
        .millisecond(0),
    }));
  };

  const slotAvailable = false;

  const handleSubmit = async () => {
    if (!canSave || submitting) return;
    try {
      setSubmitting(true);

      const dt = form.dateTime?.toDate
        ? form.dateTime.toDate()
        : new Date(form.dateTime);

      const payload = {
        customer: form.customer
          ? {
              id: form.customer.id ?? null,
              name: form.customer.name,
              email: form.customer.email,
            }
          : null,
        members: Array.isArray(form.members)
          ? form.members.map((m) => ({
              id: m.id ?? null,
              name: m.name,
              email: m.email,
            }))
          : [],
        lab: form.lab ? { id: form.lab.id ?? null, name: form.lab.name } : null,
        testType: form.testType || null,
        testPackage: form.testPackage,
        dateTime: Timestamp.fromDate(dt),
        coupon: form.coupon || null,
        collectionType: form.collectionType,
        symptomsHtml: form.symptomsHtml || "",
        fileName: form.file?.name ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "Pending",
        paymentStatus: "Pending",
        totalAmount: null,
      };

      const ref = await addDoc(collection(db, "appointments"), payload);
      onCreate?.({ id: ref.id, ...payload });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header with actions */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            New Appointment
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={`Total Appointment Amount $0.00`}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Button onClick={handleClose} disabled={submitting}>
              Back
            </Button>
            <Button
              variant="contained"
              disabled={!canSave || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </Stack>

        {/* Appointment Details */}
        <Typography fontWeight={700} mb={1}>
          Appointment Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container  spacing={2}>
          {/* Customer */}
          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel id="customer-label" required sx={{ fontWeight: 600 }}>
                Customer
              </FormLabel>
              <Autocomplete
                size={fieldSize}
                value={form.customer}
                onChange={(_, v) => setForm({ ...form, customer: v })}
                options={customers}
                getOptionLabel={(o) => o?.name ?? ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Customer"
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "customer-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          {/* Other Members */}
          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel id="members-label" sx={{ fontWeight: 600 }}>
                Select Other Members
              </FormLabel>
              <Autocomplete
                multiple
                size={fieldSize}
                value={form.members}
                onChange={(_, v) => setForm({ ...form, members: v })}
                options={customers}
                getOptionLabel={(o) => o?.name ?? ""}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.email}
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search members"
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "members-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          {/* Lab */}
          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel id="lab-label" required sx={{ fontWeight: 600 }}>
                Lab
              </FormLabel>
              <Autocomplete
                size={fieldSize}
                value={form.lab}
                onChange={(_, v) => setForm({ ...form, lab: v })}
                options={labs}
                getOptionLabel={(o) => o?.name ?? ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Lab"
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "lab-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          {/* Row 2 */}
          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel id="test-type-label" required sx={{ fontWeight: 600 }}>
                Test Type
              </FormLabel>

              <Autocomplete
                size={fieldSize}
                // options: simple strings
                placeholder={"Test Type"}
                options={testTypes}
                value={form.testType || null}
                onChange={(_, v) => setForm({ ...form, testType: v || "" })}
                // when options are strings, this keeps equality stable
                isOptionEqualToValue={(option, value) => option === value}
                // optional quality-of-life
                clearOnEscape
                disableCloseOnSelect={false}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Test Type"
                    // aria linkage to the external label
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "test-type-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel id="testpkg-label" required sx={{ fontWeight: 600 }}>
                Test/Package
              </FormLabel>
              <Autocomplete
                size={fieldSize}
                value={form.testPackage}
                onChange={(_, v) => setForm({ ...form, testPackage: v || "" })}
                options={testPackages}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Test/Package"
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "testpkg-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormLabel id="lab-label" required sx={{ fontWeight: 600 }}>
              Appointment Date
            </FormLabel>
            <DatePicker
              value={form.dateTime}
              placeholder={"select date"}
              onChange={setDatePart}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: fieldSize,
                  InputLabelProps: { sx: labelSx },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={fieldItemSx}>
            <FormLabel id="appt-time-label" required sx={{ fontWeight: 600 }}>
              Appointment Time
            </FormLabel>

            <TimePicker
              value={form.dateTime}
              onChange={setTimePart}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: fieldSize,
                  placeholder: !slotAvailable
                    ? "Slot not available"
                    : "Select time",
                  InputLabelProps: { sx: labelSx },
                },
              }}
            />
          </Grid>
        </Grid>
        <Typography fontWeight={700} mt={4} mb={1}>
          Coupon Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel id="coupon-code-label" sx={{ fontWeight: 600 }}>
                Coupon Code
              </FormLabel>

              <Autocomplete
                size={fieldSize}
                options={coupons}
                value={form.coupon || null}
                onChange={(_, v) => setForm({ ...form, coupon: v || "" })}
                isOptionEqualToValue={(option, value) => option === value}
                clearOnEscape
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Coupon Code"
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "coupon-code-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>

        <Typography fontWeight={700} mt={4} mb={1}>
          Other Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel
                id="collection-type-label"
                required
                sx={{ fontWeight: 600 }}
              >
                Collection Type
              </FormLabel>
              <Autocomplete
                size={fieldSize}
                options={collections}
                value={form.collectionType || null}
                onChange={(_, v) =>
                  setForm({ ...form, collectionType: v || "" })
                }
                isOptionEqualToValue={(option, value) => option === value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Collection Type"
                    inputProps={{
                      ...params.inputProps,
                      "aria-labelledby": "collection-type-label",
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} sx={fieldItemSx}>
            <FormControl fullWidth size={fieldSize}>
              <FormLabel sx={{ fontWeight: 600 }}>Medical Report</FormLabel>
                            <Grid item xs={12} md={4}>
                  <TextField
                  style={{height: "40px"}}
                    id="medical_report"
                    type="file"
                    fullWidth
                    inputProps={{ accept: '*' }}
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0] ?? null;
                      setMedicalReport(file);
                    }}
                  />
                </Grid>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sx={fieldItemSxl}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Symptoms
            </Typography>
            <ReactQuill
              theme="snow"
              value={form.symptomsHtml}
              onChange={(v) => setForm({ ...form, symptomsHtml: v })}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            py: 2,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            disabled={!canSave || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
