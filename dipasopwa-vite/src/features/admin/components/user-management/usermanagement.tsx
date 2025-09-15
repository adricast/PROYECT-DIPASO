// src/pages/UserManagement.tsx
import React from "react";
import DataTable, { type Column } from "../../../../components/layout/datatableLayout";

const UserManagement: React.FC = () => {
  const columns: Column[] = [
    { key: "id", label: "ID", width: "50px" },
    { key: "username", label: "Usuario" },
    { key: "name", label: "Nombre" },
    { key: "role", label: "Rol" },
    { key: "status", label: "Estado" },
  ];

  const data = [
    { id: 1, username: "nahin.castro", name: "Nahin Castro", role: "Supervisor", status: "Activo" },
    { id: 2, username: "ana.lopez", name: "Ana López", role: "Administrador", status: "Activo" },
    { id: 3, username: "jose.perez", name: "José Pérez", role: "Usuario", status: "Inactivo" },
    { id: 4, username: "maria.gomez", name: "María Gómez", role: "Usuario", status: "Activo" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "15px" }}>Administración de Usuarios</h2>
      <DataTable
        columns={columns}
        data={data}
        headerColor="#3498db"
        rowColor="#ffffff"
        altRowColor="#ecf0f1"
      />
    </div>
  );
};

export default UserManagement;
