import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../src/features/login/loginPage";
import DashboardLayout from "../src/components/layout/dashboardLayout";
import DashboardPage from "../src/pages/dashboardPage";
import UserPage from "../src/features/users/userPage";
import InventaryPage from "./features/inventary/inventoryPage";
import { authSensor } from "./hooks/sensors/authSensor";
import { initAuthService } from "./services/api/authService"; // ⬅️ IMPORTACIÓN CORREGIDA
import BillingPage from "./features/billing/billingPage";
import CashregisterPage from "./features/cashregister/cashregisterPage";
import AuditoryPage from "./features/auditory/auditPage";
import ReportPage from "./features/report/reportPage";
import AdminPage from "./features/admin/adminPage";
import UserManagementPage from "./features/admin/components/user-management/usermanagementPage";
import GroupUserManagementPage from "./features/admin/components/groupuser-management/groupusermanagementPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    initAuthService(); // ⬅️ LLAMADA A LA FUNCIÓN CORREGIDA
    const handleSynced = () => setIsAuthenticated(true);
    const handleFailed = () => setIsAuthenticated(false);
    const handleFailure = () => setIsAuthenticated(false);
    const handleDeleted = () => setIsAuthenticated(false);

    authSensor.on("item-synced", handleSynced);
    authSensor.on("item-failed", handleFailed);
    authSensor.on("sync-failure", handleFailure);
    authSensor.on("itemDeleted", handleDeleted);

    return () => {
      authSensor.off("item-synced", handleSynced);
      authSensor.off("item-failed", handleFailed);
      authSensor.off("sync-failure", handleFailure);
      authSensor.off("itemDeleted", handleDeleted);
    };
  }, []);

  if (isAuthenticated === null) return <div>Cargando...</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

      <Route path="/dashboard" element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UserPage />} />
        <Route path="inventary" element={<InventaryPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="cashregister" element={<CashregisterPage />} />
        <Route path="audit" element={<AuditoryPage />} />
        <Route path="report" element={<ReportPage />} />

        {/* Admin con rutas hijas */}
        <Route path="admin" element={<AdminPage />}>
          <Route path="usermanagement" element={<UserManagementPage />} />
          <Route path="groupmanagement" element={<GroupUserManagementPage />} />
          {/* Aquí puedes agregar más submódulos de admin */}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;