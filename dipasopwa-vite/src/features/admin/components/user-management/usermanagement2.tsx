'use client';

import React, { useState } from "react";
// Importa el componente ReusableDataTable que creamos
import ReusableDataTable from "./../../../../components/layout/datatableLayout2";
import GenericButton from "./../../../../components/layout/buttonLayout";
import { FaPlus } from "react-icons/fa";
// Importa ReusableLight si lo necesitas, pero no es parte de la lógica principal de la tabla
import ReusableLight from "../../../../components/layout/indicatorlight1ledLayout";

const UserManagementPage: React.FC = () => {
  // --- Estados para los datos y modales ---
  // Usa un estado para los usuarios para poder modificarlos
  const [users, setUsers] = useState([
    { id: 1, name: "Juan Pérez", email: "juan.perez@example.com", role: "Admin", status: true },
    { id: 2, name: "Ana Gómez", email: "ana.gomez@example.com", role: "Manager", status: false },
    { id: 3, name: "Carlos Ruiz", email: "carlos.ruiz@example.com", role: "User", status: true },
    { id: 4, name: "María López", email: "maria.lopez@example.com", role: "User", status: true },
    { id: 5, name: "Pedro Ramírez", email: "pedro.ramirez@example.com", role: "User", status: false },
  ]);

  // --- Funciones para manejar las acciones de la tabla ---

  // Función para guardar (crear o editar) un usuario
  const handleSaveUser = (updatedUser: any) => {
    // Si el usuario ya tiene un ID, es una edición
    if (updatedUser.id) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      console.log('Usuario actualizado:', updatedUser);
    } else {
      // Si no tiene ID, es un nuevo usuario
      const newUser = { ...updatedUser, id: Date.now() }; // Asigna un ID temporal
      setUsers(prevUsers => [...prevUsers, newUser]);
      console.log('Nuevo usuario creado:', newUser);
    }
  };

  // Función para eliminar un solo usuario
  const handleDeleteUser = (id: string | number) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
    console.log(`Usuario con ID ${id} eliminado.`);
  };

  // Función para eliminar múltiples usuarios
  const handleBulkDeleteUsers = (ids: (string | number)[]) => {
    setUsers(prevUsers => prevUsers.filter(user => !ids.includes(user.id)));
    console.log(`Usuarios con IDs [${ids.join(', ')}] eliminados.`);
  };

  // --- Columnas para ReusableDataTable ---
  const userColumns = [
    { field: "id", header: "ID" },
    { field: "name", header: "Nombre" },
    { field: "email", header: "Email" },
    { field: "role", header: "Rol" },
    {
      field: "status",
      header: "Estado",
      // El 'body' renderiza el componente ReusableLight
      body: (row: any) => (
        <div className="flex justify-center">
          <ReusableLight
            status={row.status}
            comment={row.status ? "En línea" : "Desconectado"}
          />
        </div>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-end items-center mb-5">
        <GenericButton
          label="Agregar Usuario"
          // Puedes usar ReusableDataTable para manejar la creación también
          onClick={() => {
            // Lógica para abrir un modal de adición si lo necesitas
            console.log("Acción de agregar usuario");
          }}
          icon={<FaPlus />}
          bgColor="#624A89"
          textColor="#fff"
        />
      </div>

      <div className="shadow-lg rounded-lg overflow-hidden">
        {/* --- Componente ReusableDataTable --- */}
        <ReusableDataTable
          title="Gestión de Usuarios"
          data={users}
          columns={userColumns}
          onSave={handleSaveUser}
          onDelete={handleDeleteUser}
          onBulkDelete={handleBulkDeleteUsers}
        />
      </div>
    </div>
  );
};

export default UserManagementPage;