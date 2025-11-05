// src/pages/Appointments.jsx
import React from 'react';
import {
  Box,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, Outlet, Link as RouterLink } from 'react-router-dom';
import DataPageWrapper from "/src/components/DataPageWrapper.jsx";

const rows = [
  {
    id: 22,
    dateTime: '2025-10-31T16:30:00',
    customer: { name: 'John Doe', email: 'john@gmail.com' },
    lab: { name: 'Advanced Diagnostics Lab', email: 'info@diagnostics.com' },
    collector: { name: 'Liam Long', email: 'vendor@gmail.com' },
    testCase: 'Prostate-Specific Antigen (PSA)',
    totalAmount: 74.2,
    paymentStatus: 'Pending',
    status: 'Accepted',
  },
  {
    id: 18,
    dateTime: '2025-10-29T23:00:00',
    customer: { name: 'Robert Martin', email: 'robert@gmail.com' },
    lab: { name: 'Spectrum Health Diagnostics', email: 'diagnostics@spectrum.com' },
    collector: { name: 'Liam Long', email: 'vendor@gmail.com' },
    testCase: 'Hemoglobin A1C',
    totalAmount: 74.2,
    paymentStatus: 'Pending',
    status: 'Accepted',
  },
  {
    id: 2,
    dateTime: '2025-10-19T12:18:00',
    customer: { name: 'Tracy Jones', email: 'tracy@gmail.com' },
    lab: { name: 'Precision Medical Lab', email: 'support@medlab.com' },
    collector: { name: 'Liam Long', email: 'vendor@gmail.com' },
    testCase: 'Essential Health & Wellness Package',
    totalAmount: 331.9,
    paymentStatus: 'Pending',
    status: 'In Progress',
  },
  {
    id: 17,
    dateTime: '2025-10-28T15:30:00',
    customer: { name: 'Brian Shaw', email: 'brian@gmail.com' },
    lab: { name: 'Precision Medical Lab', email: 'support@medlab.com' },
    collector: { name: 'Amy Ellis', email: 'amy@gmail.com' },
    testCase: 'Blood Glucose Test',
    totalAmount: 42.1,
    paymentStatus: 'Pending',
    status: 'Accepted',
  },
  {
    id: 16,
    dateTime: '2025-10-27T22:00:00',
    customer: { name: 'John Doe', email: 'john@gmail.com' },
    lab: { name: 'Spectrum Health Diagnostics', email: 'diagnostics@spectrum.com' },
    collector: { name: 'Liam Long', email: 'vendor@gmail.com' },
    testCase: 'Creatinine Clearance Test',
    totalAmount: 127.7,
    paymentStatus: 'Pending',
    status: 'Accepted',
  },
];

const NameEmailCell = ({ person }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Avatar sx={{ width: 30, height: 30 }}>
      {person.name.split(' ').map((s) => s[0]).join('')}
    </Avatar>
    <Stack spacing={0}>
      <Typography variant="body2" fontWeight={600}>{person.name}</Typography>
      <Typography variant="caption" color="text.secondary">{person.email}</Typography>
    </Stack>
  </Stack>
);

export default function CollectorListPage() {
  const [action, setAction] = React.useState('');
  const [query, setQuery] = React.useState('');

  // Programmatic navigation
  const navigate = useNavigate(); // useNavigate hook [web:1][web:2]
  const handleNew = () => {
    navigate('collectorlist');

  };

  const columns = React.useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 80, valueFormatter: ({ value }) => `#${value}` },
      {
        field: 'dateTime',
        headerName: 'Date & Time',
        width: 160,
        valueFormatter: ({ value }) =>
          new Date(value).toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        sortComparator: (v1, v2) => new Date(v1).getTime() - new Date(v2).getTime(),
      },
      { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 200, sortable: false, renderCell: (p) => <NameEmailCell person={p.value} /> },
      { field: 'lab', headerName: 'Lab', flex: 1.1, minWidth: 220, sortable: false, renderCell: (p) => <NameEmailCell person={p.value} /> },
      { field: 'collector', headerName: 'Collector', flex: 1, minWidth: 200, sortable: false, renderCell: (p) => <NameEmailCell person={p.value} /> },
      { field: 'testCase', headerName: 'Test Case', flex: 1.4, minWidth: 260 },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        width: 120,
        type: 'number',
        valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment Status',
        width: 140,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.value}
            color={p.value === 'Pending' ? 'warning' : p.value === 'Paid' ? 'success' : 'error'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        sortable: false,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.value}
            color={p.value === 'Accepted' ? 'success' : p.value === 'In Progress' ? 'info' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Action',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: () => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton size="small" color="primary"><VisibilityOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  const filteredRows = React.useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [
        r.customer.name,
        r.customer.email,
        r.lab.name,
        r.lab.email,
        r.collector.name,
        r.collector.email,
        r.testCase,
        String(r.id),
      ].some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  const initialState = {
    pagination: { paginationModel: { pageSize: 5, page: 0 } },
    sorting: { sortModel: [{ field: 'dateTime', sort: 'desc' }] },
  };

  return (
       <DataPageWrapper
      title="Collectors"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Collectors" }
      ]}
      rows={filteredRows}
      columns={columns}
      onNew={() => navigate("new")}
      bulkActions={[
        { value: "markPaid", label: "Mark Paid" },
        { value: "cancel", label: "Cancel" },
        { value: "email", label: "Send Email" },
      ]}
    />
  );
}
