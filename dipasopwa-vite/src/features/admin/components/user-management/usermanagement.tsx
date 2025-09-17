import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "./../../../../components/layout/datatableLayout";
import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import GenericButton from "./../../../../components/layout/buttonLayout";
import { FaUserEdit, FaTrash, FaPlus } from "react-icons/fa";
import ReusableLight from "../../../../components/layout/indicatorlight1ledLayout";

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Estados para el control de los modales ---
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // --- Datos Ficticios (Usuarios) ---
  const users = [
    { id: 1, name: "Juan Pérez", email: "juan.perez@example.com", role: "Admin", status: true },
    { id: 2, name: "Ana Gómez", email: "ana.gomez@example.com", role: "Manager", status: false },
    { id: 3, name: "Carlos Ruiz", email: "carlos.ruiz@example.com", role: "User", status: true },
    { id: 4, name: "María López", email: "maria.lopez@example.com", role: "User", status: true },
    { id: 5, name: "Pedro Ramírez", email: "pedro.ramirez@example.com", role: "User", status: false },
  ];

  // --- Manejadores de los modales ---
  const handleOpenAddEditModal = (user: any | null) => {
    setCurrentUser(user);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDeleteModal = (user: any) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentUser(null);
  };

  const handleSaveUser = (groupName: string, description: string) => {
    console.log("Datos guardados del modal:", { groupName, description });
    // Aquí iría tu lógica para guardar o actualizar los datos del usuario
    handleCloseModals();
  };

  const handleConfirmDelete = () => {
    console.log(`Usuario eliminado: ${currentUser.name}`);
    // Aquí iría tu lógica para eliminar el usuario del estado o de la base de datos
    handleCloseModals();
  };

  // --- Definición de Columnas ---
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Nombre", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Rol", accessor: "role" },
    {
      header: "Estado",
      accessor: "status",
      renderCell: (row: any) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ReusableLight
            status={row.status}
            comment={row.status ? "En línea" : "Desconectado"}
          />
        </div>
      ),
    },
  ];

  // --- Definición de Acciones (Modificar y Eliminar) ---
  const actions = [
    {
      label: "Modificar",
      icon: <FaUserEdit />,
      action: (user: any) => handleOpenAddEditModal(user),
      buttonBgColor: "#2ecc71",
      buttonTextColor: "#ffffff",
    },
    {
      label: "Eliminar",
      icon: <FaTrash />,
      action: (user: any) => handleOpenDeleteModal(user),
      buttonBgColor: "#e74c3c",
      buttonTextColor: "#ffffff",
    },
  ];

  // --- Acciones Masivas (para la selección) ---
  const bulkActions = [
    {
      label: "Eliminar Seleccionados",
      icon: <FaTrash />,
      action: (selectedUsers: any[]) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedUsers.length} usuarios?`)) {
          alert(`Eliminando usuarios con IDs: ${selectedUsers.map(u => u.id).join(", ")}`);
        }
      },
    },
  ];
  
  // La función handleSave se ha eliminado porque no se está utilizando en el código
  // Si en el futuro necesitas un botón de "Guardar" que no sea el del modal,
  // puedes agregarla de nuevo.

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <GenericButton label="Guardar" onClick={() => handleOpenAddEditModal(null)} icon={<FaPlus />} bgColor={'#624A89'} textColor={'#fff'} />
      </div>

      <DataTable
        columns={columns}
        data={users}
        actions={actions}
        enableSelection={true}
        bulkActions={bulkActions}
      />

      {/* --- Integración de los modales --- */}
      <AddEditGroupDialog
        open={isAddEditModalOpen}
        onClose={handleCloseModals}
        group={currentUser}
        onSave={handleSaveUser}
      />

      <DeleteConfirmationDialog
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        item={currentUser}
      />
    </div>
  );
};

export default UserManagementPage;