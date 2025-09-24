import React from "react";
import { useNavigate } from "react-router-dom";
import UserManagement from "./usermanagement2";

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(".."); // vuelve a la ruta padre relativa: /dashboard/admin
    // o alternativamente: navigate(-1) también funciona
  };

  return (
    <div>
      <button className="btn-back" onClick={handleBack}>← Volver</button>
      <UserManagement />
    </div>
  );
};

export default UserManagementPage;
