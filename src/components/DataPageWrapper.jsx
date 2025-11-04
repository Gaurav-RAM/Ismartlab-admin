import React from "react";
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
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { DataGrid } from "@mui/x-data-grid";
import { Link as RouterLink } from "react-router-dom";

export default function DataPageWrapper({
  title,
  breadcrumbs,          // [{label: , to: }, ...]
  columns,
  rows,
  onNew,
  bulkActions = [],
  showAdvancedFilter = true,
}) {
  const [action, setAction] = React.useState("");
  const [query, setQuery] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();

    return rows.filter((r) =>
      Object.values(r).some((val) =>
        typeof val === "string" && val.toLowerCase().includes(q)
      )
    );
  }, [query, rows]);

  return (
    <Box p={2.5} component={Paper} elevation={0}>
      <Stack spacing={2.5}>
        {/* Breadcrumbs */}
        <Breadcrumbs>
          {breadcrumbs?.map((b, i) =>
            b.to ? (
              <Link key={i} component={RouterLink} underline="hover" to={b.to}>
                {b.label}
              </Link>
            ) : (
              <Typography key={i}>{b.label}</Typography>
            )
          )}
        </Breadcrumbs>

        {/* Toolbar */}
        <Stack
          direction="row"
          justifyContent="space-between"
          gap={2}
          flexWrap="wrap"
        >
          {/* Left actions */}
          <Stack direction="row" spacing={1}>
            {bulkActions.length > 0 && (
              <>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Action</InputLabel>
                  <Select
                    label="Action"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {bulkActions.map((a) => (
                      <MenuItem key={a.value} value={a.value}>
                        {a.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button variant="contained" size="small">Apply</Button>
              </>
            )}

            <Button
              startIcon={<DownloadRoundedIcon />}
              variant="outlined"
              size="small"
            >
              Export
            </Button>
          </Stack>

          {/* Search + New + Filter */}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />

            <Button onClick={onNew} startIcon={<AddIcon />} variant="contained" size="small">
              New
            </Button>

            {showAdvancedFilter && (
              <Button
                startIcon={<FilterListIcon />}
                variant="contained"
                color="error"
                size="small"
              >
                Advanced Filter
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Table */}
        <Box sx={{ height: 520, border: "1px solid #ddd", borderRadius: 1 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            checkboxSelection
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
