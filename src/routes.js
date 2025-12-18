import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Login from "./Pages/AuthN";
import Signup from "./Pages/AuthN";
import Dashboard from "./Pages/Dashboard";
import Events from "./Pages/Events";
import Schedule from "./Pages/Schedule";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";
import AssignRoles from "./pages/admin/AssignRoles";
import CreateRole from "./pages/admin/CreateRole";
import EditRole from "./pages/admin/EditRole";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/CommanComponents/UserAuth/Login.js" element={<Login />} />
        <Route path="/CommanComponents/UserAuth/Signup.js" element={<Signup />} />
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/events" element={<MainLayout><Events /></MainLayout>} />
        <Route path="/schedule" element={<MainLayout><Schedule /></MainLayout>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/admin/users/:id/assign-roles" element={<AdminLayout><AssignRoles /></AdminLayout>} />
        <Route path="/admin/roles" element={<AdminLayout><AdminRoles /></AdminLayout>} />
        <Route path="/admin/roles/create" element={<AdminLayout><CreateRole /></AdminLayout>} />
        <Route path="/admin/roles/:id/edit" element={<AdminLayout><EditRole /></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
