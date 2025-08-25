// src/App.tsx

import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
        <Routes location={location}>
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
      </motion.div>
    </AnimatePresence>
  );
};

export default App;
