import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Login from "./Pages/AuthN";
import Signup from "./Pages/AuthN";
import Dashboard from "./Pages/Dashboard";
import Events from "./Pages/Events";
import Schedule from "./Pages/Schedule";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/CommanComponents/UserAuth/Login.js" element={<Login />} />
        <Route path="/CommanComponents/UserAuth/Signup.js" element={<Signup />} />
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/events" element={<MainLayout><Events /></MainLayout>} />
        <Route path="/schedule" element={<MainLayout><Schedule /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
