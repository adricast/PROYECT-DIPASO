// src/pages/GroupUserManagementPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import GroupManagement  from "./groupusermanagement2";


const GroupUserManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(".."); // vuelve a la ruta padre relativa
    // o alternativamente: navigate(-1)
  };

  return (
     <div>
      <button className="btn-back" onClick={handleBack}>← Volver</button>
      <GroupManagement />
    </div>
  );
};

export default GroupUserManagementPage;
