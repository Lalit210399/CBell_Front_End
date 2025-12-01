import React from "react";
import {
  Box,
  Container,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Box mb={6}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#1a1a1a", mb: 1 }}>
            Settings
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Manage your account preferences and preferences
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Settings Card */}
          <Grid item xs={12} sm={6}>
            <Card
              sx={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 2.5,
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: "100%",
                "&:hover": {
                  boxShadow: "0 12px 24px rgba(102, 126, 234, 0.15)",
                  transform: "translateY(-4px)",
                  borderColor: "#667eea",
                },
              }}
              onClick={() => navigate("/settings/profile")}
            >
              <CardActionArea>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      p: 2,
                      backgroundColor: "#f0f2ff",
                      borderRadius: 2,
                      width: "fit-content",
                      mx: "auto",
                    }}
                  >
                    <User size={40} color="#667eea" strokeWidth={1.5} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#1a1a1a", mb: 1 }}>
                    Profile Settings
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6 }}>
                    Update your personal information, title, and profile details
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Email Settings Card */}
          <Grid item xs={12} sm={6}>
            <Card
              sx={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 2.5,
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: "100%",
                "&:hover": {
                  boxShadow: "0 12px 24px rgba(102, 126, 234, 0.15)",
                  transform: "translateY(-4px)",
                  borderColor: "#667eea",
                },
              }}
              onClick={() => navigate("/settings/email")}
            >
              <CardActionArea>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      p: 2,
                      backgroundColor: "#f0f2ff",
                      borderRadius: 2,
                      width: "fit-content",
                      mx: "auto",
                    }}
                  >
                    <Mail size={40} color="#667eea" strokeWidth={1.5} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#1a1a1a", mb: 1 }}>
                    Email Settings
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6 }}>
                    Manage email addresses and organize recipient groups
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}