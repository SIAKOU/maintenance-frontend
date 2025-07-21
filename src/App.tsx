// src/App.tsx

import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Machines from "./pages/Machines";
import MaintenanceSchedules from "./pages/MaintenanceSchedules";
import UsersProtected from "./pages/Users";
import SettingsProtected from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const ProtectedLayout = () => (
  <ProtectedRoute>
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
);

const AdminLayout = () => (
  <ProtectedRoute requiredRole="admin">
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/machines" element={<Machines />} />
        <Route path="/maintenance" element={<MaintenanceSchedules />} />
        <Route path="/settings" element={<SettingsProtected />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/users" element={<UsersProtected />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
