// src/pages/labs/CollectorLab.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import CollectorListUnified from "../../components/CollectorListUnified";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";

// Firestore
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  writeBatch,
  updateDoc, // optional (not required when batching)
} from "firebase/firestore";
import { db } from "../../firebase";

// helper to read nested props like "address.city"
const getByPath = (obj, path) =>
  path.split(".").reduce((a, k) => (a ? a[k] : undefined), obj);

// styled-components SortHeader
const ThButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0;
  padding: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
`;

const SortIcon = styled.span`
  width: 10px;
  height: 12px;
  position: relative;
  display: inline-block;

  &::before,
  &::after {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
  }

  /* Up arrow */
  &::before {
    border-bottom: 6px solid
      ${({ $active, $dir }) =>
        $active && $dir === "asc" ? "#fff" : "rgba(255,255,255,0.45)"};
    margin-bottom: 2px;
  }

  /* Down arrow */
  &::after {
    border-top: 6px solid
      ${({ $active, $dir }) =>
        $active && $dir === "desc" ? "#fff" : "rgba(255,255,255,0.45)"};
  }
`;

function SortHeader({ label, path, sortBy, sortDir, onChange }) {
  const next = () => {
    if (sortBy !== path) return onChange(path, "asc");
    if (sortDir === "asc") return onChange(path, "desc");
    return onChange(null, null);
  };
  const active = sortBy === path;
  return (
    <ThButton onClick={next} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <SortIcon $active={active} $dir={sortDir} aria-hidden="true" />
    </ThButton>
  );
}

export default function CollectorLab() {
  const navigate = useNavigate();

  // local UI state for header controls
  const [action, setAction] = useState("");
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [applying, setApplying] = useState(false);

  // labs from Firestore
  const [labs, setLabs] = useState([]);

  // subscribe to labs in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "labs"), (snap) => {
      const next = snap.docs.map((d) => {
        const v = d.data() || {};
        return {
          id: d.id,
          labCode: v.labCode || "",
          labName: v.labName || "",
          active: Boolean(v.active),
          paymentMode: v.paymentMode || "",
          phone: v.phone || "",
          email: v.email || "",
          // createdAt may be a Timestamp; format to ISO/date string for display
          createdAt:
            v.createdAt?.toDate?.().toISOString?.().slice(0, 10) ||
            v.createdAt ||
            "",
        };
      });
      setLabs(next);
    });
    return () => unsub();
  }, []);

  const breadcrumbs = [
    { label: "Dashboard", to: "/" },
    { label: "Labs" },
  ];

  const bulkActions = [
    { value: "enable", label: "Enable" },
    { value: "disable", label: "Disable" },
    { value: "delete", label: "Delete" },
  ];

  const filterOptions = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const handleApply = async () => {
    if (!action) return;
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert("Select at least one lab");
      return;
    }
    if (
      action === "delete" &&
      !window.confirm(`Delete ${ids.length} lab(s)? This cannot be undone.`)
    ) {
      return;
    }
    setApplying(true);
    try {
      if (action === "enable" || action === "disable") {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.update(doc(db, "labs", id), { active: action === "enable" });
        });
        await batch.commit();
      } else if (action === "delete") {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.delete(doc(db, "labs", id));
        });
        await batch.commit();
      }
      // clear selection after apply
      setSelected(new Set());
      setAction("");
    } catch (e) {
      console.error(e);
      alert("Failed to apply action. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const handleRowDelete = async (r) => {
    if (!window.confirm(`Delete "${r.labName || r.labCode}"?`)) return;
    try {
      await deleteDoc(doc(db, "labs", r.id));
      // no need to update local state; onSnapshot will refresh
    } catch (e) {
      console.error(e);
      alert("Failed to delete. Please try again.");
    }
  };

  const handleExport = () => {
    // Optional: implement CSV export of current "rows"
    alert("Export not implemented in this snippet.");
  };

  const renderLabHeader = () => (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 2.5 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((b, i) =>
            b.to ? (
              <Link key={i} component={RouterLink} underline="hover" to={b.to}>
                {b.label}
              </Link>
            ) : (
              <Typography key={i}>{b.label}</Typography>
            )
          )}
        </Breadcrumbs>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              displayEmpty
              value={action}
              onChange={(e) => setAction(e.target.value)}
              renderValue={(val) =>
                val
                  ? bulkActions.find((a) => a.value === val)?.label ?? ""
                  : "No action"
              }
              aria-label="Bulk action"
            >
              <MenuItem value="">
                <em>No action</em>
              </MenuItem>
              {bulkActions.map((a) => (
                <MenuItem key={a.value} value={a.value}>
                  {a.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="small"
            disabled={!action || applying}
            onClick={handleApply}
          >
            {applying ? "Applying…" : "Apply"}
          </Button>

          <Button
            startIcon={<DownloadRoundedIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              displayEmpty
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              renderValue={(val) =>
                !val
                  ? "All"
                  : filterOptions.find((f) => f.value === val)?.label ?? "All"
              }
              aria-label="Quick filter"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {filterOptions.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="search labs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 320 }}
            aria-label="Search"
          />

          <Button
            onClick={() => {
              navigate("/labs/new");
            }}
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
          >
            New
          </Button>

          <Button
            startIcon={<FilterListIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={() => {}}
          >
            Advanced Filter
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // sorting state
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const onSortChange = (path, dir) => {
    setSortBy(path);
    setSortDir(dir);
  };

  // apply search / quick filter (basic)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return labs.filter((c) => {
      const statusOk = quickFilter
        ? (quickFilter === "active" ? c.active : !c.active)
        : true;
      const text = [
        c.labCode,
        c.labName,
        c.paymentMode,
        c.phone,
        c.email,
        c.createdAt,
        c.active ? "active" : "inactive",
      ]
        .join(" ")
        .toLowerCase();
      const textOk = !q ? true : text.includes(q);
      return statusOk && textOk;
    });
  }, [labs, query, quickFilter]);

  // apply sorting
  const rows = useMemo(() => {
    if (!sortBy || !sortDir) return filtered.slice();
    const copy = filtered.slice();
    copy.sort((a, b) => {
      const av = getByPath(a, sortBy);
      const bv = getByPath(b, sortBy);
      const A = av == null ? "" : av;
      const B = bv == null ? "" : bv;
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  // selection state (checkbox column)
  const [selected, setSelected] = useState(() => new Set());
  const visibleIds = rows.map((r) => r.id);
  const allOnPageSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAllOnPage = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) visibleIds.forEach((id) => next.add(id));
      else visibleIds.forEach((id) => next.delete(id));
      return next;
    });
  };
  const toggleOne = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // table head WITH checkbox column
  const renderHead = () => (
    <tr>
      <th style={{ width: 40 }}>
        <input
          type="checkbox"
          checked={allOnPageSelected}
          onChange={(e) => toggleAllOnPage(e.target.checked)}
          aria-label="Select all on page"
        />
      </th>

      <th
        aria-sort={
          sortBy === "labCode"
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <SortHeader
          label="Lab Code"
          path="labCode"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>

      <th
        aria-sort={
          sortBy === "labName"
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <SortHeader
          label="Lab Name"
          path="labName"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>

      <th
        aria-sort={
          sortBy === "paymentMode"
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <SortHeader
          label="Payment Mode"
          path="paymentMode"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>

      <th
        aria-sort={
          sortBy === "createdAt"
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <SortHeader
          label="Created"
          path="createdAt"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>

      <th
        aria-sort={
          sortBy === "active"
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <SortHeader
          label="Status"
          path="active"
          sortBy={sortBy}
          sortDir={sortDir}
          onChange={onSortChange}
        />
      </th>

      <th>Action</th>
    </tr>
  );

  return (
    <CollectorListUnified
      variant=""
      title="Collector Labs"
      rows={rows}
      total={rows.length}
      page={1}
      pageSize={10}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      onSearch={() => {}}
      onOpenAdvancedFilter={() => {}}
      onExport={() => {}}
      headerSlot={renderLabHeader}
      renderHead={renderHead}
      renderRow={(r) => (
        <tr key={r.id}>
          {/* row WITH checkbox cell */}
          <td style={{ width: 40 }}>
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={(e) => toggleOne(r.id, e.target.checked)}
              aria-label={`Select row ${r.labCode}`}
            />
          </td>

          <td>{r.labCode}</td>
          <td>{r.labName}</td>
          <td>{r.paymentMode || "-"}</td>
          <td>{r.createdAt || "-"}</td>
          <td>{r.active ? "Active" : "Inactive"}</td>
          <td>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="edit"
                  onClick={() => navigate(`/labs/${r.id}/edit`)}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  aria-label="delete"
                  onClick={() => handleRowDelete(r)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </td>
        </tr>
      )}
    />
  );
}
