import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Stack,
  IconButton,
  Avatar,
  Typography,
  Divider,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: "Mohit",
    lastName: "Sharma",
    email: "mohit@example.com",
    title: "Product Manager",
    phone: "+1 (555) 123-4567",
    department: "Product",
    bio: "Passionate about building great products",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(profile);

  const handleChange = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = () => {
    setOriginalProfile(profile);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleReset = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="md">
        {/* Header with Back Button */}
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
              Profile Settings
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
              Manage your personal information
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: "#fff",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                textAlign: "center",
                border: "1px solid #e0e0e0",
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: "auto",
                  mb: 2,
                  backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  fontSize: 40,
                }}
              >
                {profile.firstName[0]}
                {profile.lastName[0]}
              </Avatar>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                {profile.title}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" sx={{ color: "#999" }}>
                Member since January 2024
              </Typography>
            </Paper>
          </Grid>

          {/* Form Card */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: "#fff",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #e0e0e0",
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                  Personal Information
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setIsEditing(!isEditing)}
                  sx={{ color: "#667eea", textTransform: "none", fontWeight: 600 }}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </Box>

              <Stack spacing={2.5}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                        First Name
                      </Typography>
                      <TextField
                        fullWidth
                        value={profile.firstName}
                        onChange={handleChange("firstName")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
                          mt: 0.5,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                            "& fieldset": { borderColor: "#e0e0e0" },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                        Last Name
                      </Typography>
                      <TextField
                        fullWidth
                        value={profile.lastName}
                        onChange={handleChange("lastName")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
                          mt: 0.5,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                            "& fieldset": { borderColor: "#e0e0e0" },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    value={profile.email}
                    onChange={handleChange("email")}
                    disabled={!isEditing}
                    size="small"
                    sx={{
                      mt: 0.5,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                        "& fieldset": { borderColor: "#e0e0e0" },
                      },
                    }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                        Title
                      </Typography>
                      <TextField
                        fullWidth
                        value={profile.title}
                        onChange={handleChange("title")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
                          mt: 0.5,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                            "& fieldset": { borderColor: "#e0e0e0" },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                        Department
                      </Typography>
                      <TextField
                        fullWidth
                        value={profile.department}
                        onChange={handleChange("department")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
                          mt: 0.5,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                            "& fieldset": { borderColor: "#e0e0e0" },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                    Phone
                  </Typography>
                  <TextField
                    fullWidth
                    value={profile.phone}
                    onChange={handleChange("phone")}
                    disabled={!isEditing}
                    size="small"
                    sx={{
                      mt: 0.5,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                        "& fieldset": { borderColor: "#e0e0e0" },
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={600} sx={{ color: "#666" }}>
                    Bio
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={profile.bio}
                    onChange={handleChange("bio")}
                    disabled={!isEditing}
                    size="small"
                    sx={{
                      mt: 0.5,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: isEditing ? "#fff" : "#f5f5f5",
                        "& fieldset": { borderColor: "#e0e0e0" },
                      },
                    }}
                  />
                </Box>

                {isEditing && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<Save size={18} />}
                        onClick={handleSave}
                        sx={{
                          backgroundColor: "#667eea",
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 1.5,
                          py: 1.2,
                          "&:hover": { backgroundColor: "#5568d3" },
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RotateCcw size={18} />}
                        onClick={handleReset}
                        sx={{
                          borderColor: "#e0e0e0",
                          color: "#666",
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 1.5,
                          py: 1.2,
                          "&:hover": { borderColor: "#ccc", backgroundColor: "#f5f5f5" },
                        }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}