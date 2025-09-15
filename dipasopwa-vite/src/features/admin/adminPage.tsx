import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import OptionCard from "../../components/layout/optioncardLayout";
import { FaUsers, FaUserFriends, FaUserPlus, FaBell, FaTags } from "react-icons/fa";
import "../../pages/styles/generalPage.scss";

const AdminPage: React.FC = () => {
  const location = useLocation();
  const isSubRoute = location.pathname !== "/dashboard/admin"; // si hay subruta activa

  return (
    <div className="page-container">
    
      {/* Solo mostrar menú si NO hay subruta activa */}
      {!isSubRoute && (
        <div className="options-grid">
          <Link to="usermanagement">
            <OptionCard label="Gestión de Usuarios" icon={<FaUsers size={30} />} color="#4f46e5" />
          </Link>
          <Link to="groupmanagement">
            <OptionCard label="Gestión de Grupo de Personas" icon={<FaUserFriends size={30} />} color="#059669" />
          </Link>
          <Link to="assigngroups">
            <OptionCard label="Asignar Grupos de Personas" icon={<FaUserPlus size={30} />} color="#b03f8e" />
          </Link>
          <Link to="notifications">
            <OptionCard label="Reglas de Notificación" icon={<FaBell size={30} />} color="#1d4781" />
          </Link>
          <Link to="promotions">
            <OptionCard label="Gestión de Promociones" icon={<FaTags size={30} />} color="#1c6844ff" />
          </Link>
        </div>
      )}

      {/* Renderizar la subpágina */}
      <Outlet />
    </div>
  );
};

export default AdminPage;
