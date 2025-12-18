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
import CreateUser from "./Pages/Admin/CreateUser";
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
          path="/auth"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <AuthN />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <RequirePermission resource="Dashboard" managementKey="Dashboard Management" action="Read">
                      <DashboardRouter />
                    </RequirePermission>
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <RequirePermission resource="Events" managementKey="Event Management" action="Read">
                      <Event />
                    </RequirePermission>
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <RequirePermission resource="Events" managementKey="Event Management" action="Read">
                      <Schedule />
                    </RequirePermission>
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <RequirePermission resource="Events" managementKey="Event Management" action="Read">
                      <ChatLayout />
                    </RequirePermission>
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/eventDetailPage"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <EventDetailPage />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/eventDetailPage/tasks"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <TasksDetail />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/list"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <TaskList />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instagram"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <Instagram />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <AdminLogin />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <AdminUsers />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/create"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <CreateUser />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id/roles"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <AssignRoles />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <AdminRoles />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles/create"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <CreateRole />
                  </MainLayout>
                </NotificationProvider>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles/:id/edit"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <NotificationProvider>
                  <MainLayout>
                    <EditRole />
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
