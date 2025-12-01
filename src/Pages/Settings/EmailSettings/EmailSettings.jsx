import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Stack,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Users } from "lucide-react";
import EmailSelector from "../../../CommonComponents/EmailSelector/EmailSelector";

const sampleEmails = [
  { id: "e1", name: "Mohit Sharma", email: "mohit@example.com" },
  { id: "e2", name: "Asha Patel", email: "asha@example.com" },
  { id: "e3", name: "Design Team", email: "design@example.com" },
];

const sampleGroups = [
  { id: "g1", name: "Marketing", members: ["e1", "e2"] },
  { id: "g2", name: "Managers", members: ["e1"] },
  { id: "g3", name: "Designers", members: ["e3"] },
];

export default function EmailSettings() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState(sampleEmails);
  const [groups, setGroups] = useState(sampleGroups);
  const [tabValue, setTabValue] = useState(0);

  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [emailName, setEmailName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState("");

  const [isGroupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupError, setGroupError] = useState("");

  // EMAIL CRUD
  const openAddEmail = () => {
    setEditingEmail(null);
    setEmailName("");
    setEmailAddress("");
    setEmailError("");
    setEmailDialogOpen(true);
  };
  const openEditEmail = (e) => {
    setEditingEmail(e);
    setEmailName(e.name);
    setEmailAddress(e.email);
    setEmailError("");
    setEmailDialogOpen(true);
  };
  const saveEmail = () => {
    setEmailError("");
    if (!emailAddress.trim()) return setEmailError("Email required");
    if (!emailAddress.includes("@")) return setEmailError("Invalid email");
    if (editingEmail) {
      setEmails((prev) =>
        prev.map((p) =>
          p.id === editingEmail.id ? { ...p, name: emailName || emailAddress, email: emailAddress } : p
        )
      );
    } else {
      const id = `e${Date.now()}`;
      setEmails((prev) => [...prev, { id, name: emailName || emailAddress, email: emailAddress }]);
    }
    setEmailDialogOpen(false);
  };
  const deleteEmail = (id) => {
    setEmails((prev) => prev.filter((p) => p.id !== id));
    setGroups((prev) => prev.map((g) => ({ ...g, members: g.members.filter((m) => m !== id) })));
  };

  // GROUP CRUD
  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupMembers([]);
    setGroupError("");
    setGroupDialogOpen(true);
  };
  const openEditGroup = (g) => {
    setEditingGroup(g);
    setGroupName(g.name);
    const members = g.members.map((mId) => emails.find((e) => e.id === mId)).filter(Boolean);
    setGroupMembers(members);
    setGroupError("");
    setGroupDialogOpen(true);
  };
  const saveGroup = () => {
    setGroupError("");
    if (!groupName.trim()) return setGroupError("Group name required");
    const memberIds = groupMembers.map((m) => m.id);
    if (editingGroup) {
      setGroups((prev) =>
        prev.map((p) => (p.id === editingGroup.id ? { ...p, name: groupName, members: memberIds } : p))
      );
    } else {
      const id = `g${Date.now()}`;
      setGroups((prev) => [...prev, { id, name: groupName, members: memberIds }]);
    }
    setGroupDialogOpen(false);
  };
  const deleteGroup = (id) => setGroups((prev) => prev.filter((g) => g.id !== id));

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack direction="row" alignItems="center" gap={2} mb={4}>
          <IconButton
            onClick={() => navigate("/settings")}
            size="small"
            sx={{
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 1.5,
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            <ArrowLeft size={20} color="#333" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#1a1a1a" }}>
              Email Settings
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
              Manage email addresses and organize groups
            </Typography>
          </Box>
        </Stack>

        {/* Tabs */}
        <Paper
          sx={{
            mb: 3,
            backgroundColor: "#fff",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              "& .MuiTabs-indicator": { backgroundColor: "#667eea" },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                color: "#666",
                "&.Mui-selected": { color: "#667eea" },
              },
            }}
          >
            <Tab label="Email Addresses" icon={<Mail size={18} />} iconPosition="start" />
            <Tab label="Groups" icon={<Users size={18} />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Email Addresses Tab */}
        {tabValue === 0 && (
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#fff",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                  Saved Email Addresses
                </Typography>
                <Typography variant="caption" sx={{ color: "#666" }}>
                  {emails.length} email{emails.length !== 1 ? "s" : ""} saved
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={openAddEmail}
                variant="contained"
                sx={{
                  backgroundColor: "#667eea",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 1.5,
                  "&:hover": { backgroundColor: "#5568d3" },
                }}
              >
                Add Email
              </Button>
            </Stack>

            {emails.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Mail size={48} color="#ccc" style={{ margin: "0 auto", marginBottom: 16 }} />
                <Typography sx={{ color: "#999" }}>No email addresses saved yet</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#1a1a1a" }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1a1a1a", display: { xs: "none", sm: "table-cell" } }}>
                        Email Address
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emails.map((e) => (
                      <TableRow key={e.id} hover sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                        <TableCell sx={{ fontWeight: 600, color: "#1a1a1a" }}>{e.name}</TableCell>
                        <TableCell sx={{ color: "#666", display: { xs: "none", sm: "table-cell" } }}>
                          {e.email}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditEmail(e)}
                            sx={{
                              color: "#667eea",
                              "&:hover": { backgroundColor: "#f0f0f0" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteEmail(e.id)}
                            sx={{
                              color: "#ff6b6b",
                              "&:hover": { backgroundColor: "#ffe0e0" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        )}

        {/* Groups Tab */}
        {tabValue === 1 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                  Email Groups
                </Typography>
                <Typography variant="caption" sx={{ color: "#666" }}>
                  {groups.length} group{groups.length !== 1 ? "s" : ""} created
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={openAddGroup}
                variant="contained"
                sx={{
                  backgroundColor: "#667eea",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 1.5,
                  "&:hover": { backgroundColor: "#5568d3" },
                }}
              >
                New Group
              </Button>
            </Stack>

            {groups.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: "#fff",
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Users size={48} color="#ccc" style={{ margin: "0 auto", marginBottom: 16 }} />
                <Typography sx={{ color: "#999" }}>No groups created yet</Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {groups.map((g) => (
                  <Grid item xs={12} sm={6} md={4} key={g.id}>
                    <Card
                      sx={{
                        backgroundColor: "#fff",
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        transition: "all 0.3s",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} mb={2}>
                          <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                              {g.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#999" }}>
                              {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => openEditGroup(g)}
                              sx={{
                                color: "#667eea",
                                "&:hover": { backgroundColor: "#f0f0f0" },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteGroup(g.id)}
                              sx={{
                                color: "#ff6b6b",
                                "&:hover": { backgroundColor: "#ffe0e0" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {g.members.length === 0 ? (
                            <Chip label="No members" size="small" variant="outlined" />
                          ) : (
                            g.members.map((mId) => {
                              const em = emails.find((ee) => ee.id === mId);
                              return em ? (
                                <Chip
                                  key={mId}
                                  label={em.name}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#e8eaf6",
                                    color: "#667eea",
                                    fontWeight: 600,
                                  }}
                                />
                              ) : null;
                            })
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onClose={() => setEmailDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: "#1a1a1a" }}>
          {editingEmail ? "Edit Email Address" : "Add Email Address"}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                Name
              </Typography>
              <TextField
                fullWidth
                value={emailName}
                onChange={(e) => setEmailName(e.target.value)}
                placeholder="e.g. Mohit Sharma"
                size="small"
                sx={{
                  mt: 0.5,
                  "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="e.g. mohit@example.com"
                size="small"
                error={!!emailError}
                helperText={emailError}
                sx={{
                  mt: 0.5,
                  "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEmailDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveEmail}
            sx={{
              backgroundColor: "#667eea",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#5568d3" },
            }}
          >
            {editingEmail ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onClose={() => setGroupDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: "#1a1a1a" }}>
          {editingGroup ? "Edit Group" : "Create Group"}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                Group Name
              </Typography>
              <TextField
                fullWidth
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Marketing"
                size="small"
                error={!!groupError}
                helperText={groupError}
                sx={{
                  mt: 0.5,
                  "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                Select Members
              </Typography>
              <Box sx={{ mt: 1 }}>
                <EmailSelector
                  options={emails}
                  value={groupMembers}
                  onChange={(v) => setGroupMembers(v)}
                  label="Choose email addresses"
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGroupDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveGroup}
            sx={{
              backgroundColor: "#667eea",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#5568d3" },
            }}
          >
            {editingGroup ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}