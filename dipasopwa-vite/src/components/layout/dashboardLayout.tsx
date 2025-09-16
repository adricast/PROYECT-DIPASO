import React, { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import "../styles/dashboardLayout.scss";
import { authService } from "./../../services/api/authService"; // ⬅️ IMPORTACIÓN CORREGIDA
import Nav from "./navLayout";
import  NetworkStatusDisplay from './../../pages/networkstatusdisplayPage'; // ⬅️ Importa el componente

import {
  FaHome,
  FaChartLine,
  FaBox,
  FaFileInvoiceDollar,
  FaCashRegister,
  FaCog,
  FaShieldAlt,
} from "react-icons/fa";
import Breadcrumbs from "./breadcrumbsLayout";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("03");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const branches = [
    { id: "03", name: "Mall del Sur" },
    { id: "04", name: "San Marino" },
    { id: "05", name: "Recreo" },
  ];

  const userName = "Nahin Castro";

  const menuItems = [
    { label: "Inicio", path: "/dashboard", icon: <FaHome /> },
    { label: "Facturación", path: "/dashboard/billing", icon: <FaFileInvoiceDollar /> },
    { label: "Caja", path: "/dashboard/cashregister", icon: <FaCashRegister /> },
    { label: "Inventario", path: "/dashboard/inventary", icon: <FaBox /> },
    { label: "Auditoría y Seguridad", path: "/dashboard/audit", icon: <FaShieldAlt /> },
    { label: "Reportes y Analiticas", path: "/dashboard/report", icon: <FaChartLine /> },
    { label: "Administración", path: "/dashboard/admin", icon: <FaCog /> },
  ];

  // ⬅️ FUNCIÓN CORREGIDA
  const onLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const pathParts = location.pathname.split("/").filter(Boolean);

  const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    users: "Usuarios",
    inventary: "Inventario",
    billing: "Facturación",
    cashregister: "Caja",
    audit: "Auditoría y Seguridad",
    report: "Reportes",
    admin: "Administración",
    usermanagement: "Gestión de Usuarios",
  };

  const breadcrumbs = pathParts.map((part, idx) => {
    const url = "/" + pathParts.slice(0, idx + 1).join("/");
    const label =
      routeLabels[part.toLowerCase()] ||
      part.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return { label, url };
  });

  return (
    <div className="dashboard-container">
      
      
      {/* Sidebar Izquierda */}
      <aside className="desktop">
        <div className={`branch-selector ${dropdownOpen ? "open" : ""}`}>
          <div className="branch-card selected" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="branch-id">{branches.find((b) => b.id === selectedBranch)?.id}</div>
            <div className="branch-name">{branches.find((b) => b.id === selectedBranch)?.name}</div>
          </div>
      
          <div className="branch-dropdown">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className={`branch-card ${branch.id === selectedBranch ? "selected" : ""}`}
                onClick={() => {
                  setSelectedBranch(branch.id);
                  setDropdownOpen(false);
                }}
              >
                <div className="branch-id">{branch.id}</div>
                <div className="branch-name">{branch.name}</div>
              </div>
            ))}
          </div>
        </div>

        <Nav items={menuItems} vertical={true} />

        <div className={`user-profile ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
          <img
            src="https://www.dropbox.com/scl/fi/1sg0k9814ewulaq4xz97b/desarrollomovil2.png?raw=1"
            alt="Usuario"
          />
          <span className="username">{userName}</span>
          <div className="menu">
            <button onClick={() => navigate("/profile")}>Perfil</button>
            <button onClick={onLogout}>Cerrar sesión</button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="main-content" >

      
       
        <header>
          
        
          <Breadcrumbs
            items={breadcrumbs}
            activeColor="#059669"
            textColor="#2c3e50"
            separator="→"
          />
        <div className="status-indicators" style={
            {
              height: 16,
              backgroundColor: "yellow",
              marginRight:95,
            
            }
          }>
            <NetworkStatusDisplay />
          </div>
       
        </header>
         
        <main>
          <Outlet context={{ userName, selectedBranch, branches }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;