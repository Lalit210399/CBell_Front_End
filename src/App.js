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
// import StepForm from "./CommonComponents/MultiStepForm";
import EventDetailPage from "./Pages/Task/EventDetailPage";
import ForgotPassword from "./CommonComponents/UserAuth/ForgotPassword";
import TasksDetail from "./Pages/Task/TaskDetailPage";
import TaskList from "./Pages/Task/TaskList";
import Instagram from "./InstagramPost";
import ProtectedRoute, { RequirePermission } from "./Context/ProtectedRoute";
import { useUser } from "./Context/UserContext";
import { NotificationProvider } from "./Context/NotificationContext";
import { EmailGroupsProvider } from "./Context/EmailGroupsContext";
import ErrorBoundary from "./CommonComponents/ErrorBoundary"; 
import ChatLayout from "./Pages/Chat/NewChatLayout";
import GuestInviteValidationPage from "./Pages/Guest/GuestInviteValidation";
import GuestTaskReviewPage from "./Pages/Guest/GuestTaskReview";
import Settings from "./Pages/Settings/Settings";

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
          <Route
            path="/guest/invite-validation/:inviteId"
            element={<GuestInviteValidationPage />}
          />
          <Route
            path="/guest/approvals/:inviteId"
            element={<GuestInviteValidationPage />}
          />
          <Route
            path="/guest/tasks/:inviteId"
            element={<GuestTaskReviewPage />}
          />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <NotificationProvider>
                  <EmailGroupsProvider>
                  <MainLayout>
                    <Routes>
                      <Route path="/auth" element={<AuthN />} />
                      <Route
                        path="/dashboard"
                        element={
                          <RequirePermission
                            resource="Dashboard"
                            managementKey="Dashboard Management"
                            action="Read"
                          >
                            <DashboardRouter />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/events"
                        element={
                          <RequirePermission
                            resource="Events"
                            managementKey="Event Management"
                            action="Read"
                          >
                            <Event />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/schedule"
                        element={
                          <RequirePermission
                            resource="Events"
                            managementKey="Event Management"
                            action="Read"
                          >
                            <Schedule />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/chat"
                        element={
                          <RequirePermission
                            resource="Events"
                            managementKey="Event Management"
                            action="Read"
                          >
                            <ChatLayout />
                          </RequirePermission>
                        }
                      />
                      <Route
                      path="/settings"
                      element={<Settings />}
                    />
                    {/* <Route path="/events/stepForm" element={<StepForm />} /> */}
                      {/* <Route path="/dashboard/stepForm" element={<StepForm />} /> */}
                      {/* <Route path="/schedule/stepForm" element={<StepForm />} /> */}
                      <Route
                        path="/events/eventDetailPage"
                        element={<EventDetailPage />}
                      />
                      <Route
                        path="/events/eventDetailPage/tasks"
                        element={<TasksDetail />}
                      />
                      <Route path="/tasks/list" element={<TaskList />} />
                      <Route path="/instagram" element={<Instagram />} />
                    </Routes>
                  </MainLayout>
                </EmailGroupsProvider>
            </NotificationProvider>
            </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
