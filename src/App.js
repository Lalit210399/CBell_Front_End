import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Login from "./CommonComponents/UserAuth/Login";
import Signup from "./CommonComponents/UserAuth/Signup";
import AuthN from "./Pages/AuthN";
import Event from "./Pages/Event/Events";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Schedule from "./Pages/Schedules/Schedule";
import StepForm from "./CommonComponents/MultiStepForm";
import EventDetailPage from "./Pages/Task/EventDetailPage";
import ForgotPassword from "./CommonComponents/UserAuth/ForgotPassword";
import TasksDetail from "./Pages/Task/TaskDetailPage";
import Instagram from "./InstagramPost";
// import ProtectedRoute from "./Context/ProtectedRoute"; 

function App() {
  return (
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
            // <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/auth" element={<AuthN />} />
                  <Route path="/events" element={<Event />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/events/stepForm" element={<StepForm />} />
                  <Route path="/dashboard/stepForm" element={<StepForm />} />
                  <Route path="/schedule/stepForm" element={<StepForm />} />
                  <Route path="/events/eventDetailPage" element={<EventDetailPage />} />
                  <Route path="/events/eventDetailPage/tasks" element={<TasksDetail />} />
                  <Route path="/instagram" element={<Instagram />} />
                  {/* Add more protected routes here */}
                </Routes>
              </MainLayout>
            // </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
