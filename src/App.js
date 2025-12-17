import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Login from "./CommonComponents/UserAuth/Login";
import Signup from "./CommonComponents/UserAuth/Signup";
import AuthN from "./Pages/AuthN";
import Event from "./Pages/Event/Events";
import Dashboard from "./Pages/NewDashboard/Dashboard";
import DesignerDashboard from "./Pages/NewDashboard/DesignerDashboard";
import Schedule from "./Pages/Schedules/Schedule";
import EventDetailPage from "./Pages/Task/EventDetailPage";
import ForgotPassword from "./CommonComponents/UserAuth/ForgotPassword";
import TasksDetail from "./Pages/Task/TaskDetailPage";
import TaskList from "./Pages/Task/TaskList";
import Instagram from "./InstagramPost";
import ProtectedRoute, { RequirePermission } from "./Context/ProtectedRoute";
import { useUser } from "./Context/UserContext";
import { NotificationProvider } from "./Context/NotificationContext";
import ErrorBoundary from "./CommonComponents/ErrorBoundary";
import ChatLayout from "./Pages/Chat/NewChatLayout";
import { AdminProvider } from "./Pages/Admin/AdminContext";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminLogin from "./Pages/Admin/AdminLogin";
import AdminUsers from "./Pages/Admin/AdminUsers";
import AssignRoles from "./Pages/Admin/AssignRoles";
import AdminRoles from "./Pages/Admin/AdminRoles";
import CreateRole from "./Pages/Admin/CreateRole";
import EditRole from "./Pages/Admin/EditRole";

// Component to render appropriate dashboard based on user role
const DashboardRouter = () => {
  const { user } = useUser();
  const userRole = user?.roles[0]?.name;

  if (userRole === "Designer") {
    return <DesignerDashboard />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <Routes>
                      <Route path="/auth" element={<AuthN />} />
                      <Route
                        path="/dashboard"
                        element={
                          <RequirePermission resource="Dashboard" managementKey="Dashboard Management" action="Read">
                            <DashboardRouter />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/events"
                        element={
                          <RequirePermission resource="Events" managementKey="Event Management" action="Read">
                            <Event />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/schedule"
                        element={
                          <RequirePermission resource="Events" managementKey="Event Management" action="Read">
                            <Schedule />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/chat"
                        element={
                          <RequirePermission resource="Events" managementKey="Event Management" action="Read">
                            <ChatLayout />
                          </RequirePermission>
                        }
                      />
                      <Route path="/events/eventDetailPage" element={<EventDetailPage />} />
                      <Route path="/events/eventDetailPage/tasks" element={<TasksDetail />} />
                      <Route path="/tasks/list" element={<TaskList />} />
                      <Route path="/instagram" element={<Instagram />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/users/:id/roles" element={<AssignRoles />} />
                      <Route path="/admin/roles" element={<AdminRoles />} />
                      <Route path="/admin/roles/create" element={<CreateRole />} />
                      <Route path="/admin/roles/:id/edit" element={<EditRole />} />
                    </Routes>
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />

        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
