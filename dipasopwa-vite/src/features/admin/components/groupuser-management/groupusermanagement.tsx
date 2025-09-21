// src/components/groupmanagement/groupusermanagement.tsx
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import "./../../styles/group-management.scss";
import type { Group, GroupSyncStatus } from "../../../../entities/api/groupAPI";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../../../../workers/syncGroupWorker";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";
import { networkSensor } from "../../../../hooks/sensors/networkSensor";
import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import ReusableLight from "./../../../../components/layout/indicatorlight1ledLayout";
import { useKeyboardShortcut } from "./../../../../hooks/functions/useKeyboardShoartcut";
import { SHORTCUTS } from "./../../../../config/shortcuts/keyShortcuts";

const GroupManagement = forwardRef<any, any>((props, ref) => {
  // Estados principales
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Colores y estados visuales según el estado de sincronización
 
  
  const statusColors: Record<GroupSyncStatus, { status: boolean; color: string; tooltip: string }> = {
  // Estado final: La acción está completa y sincronizada.
  "synced": { status: true, color: "#32CD32", tooltip: "Sincronizado correctamente." }, // Verde
  "backend": { status: true, color: "#32CD32", tooltip: "Sincronizado con el backend." }, // Verde
  
  // Estados intermedios: La acción se está procesando o está pendiente.
  "in-progress": { status: true, color: "#FFA500", tooltip: "Sincronizando la acción..." }, // Naranja (indicando proceso)
  "pending": { status: true, color: "#1E90FF", tooltip: "Pendiente: La acción se sincronizará pronto." }, // Azul (indicando espera)
  "updated": { status: true, color: "#1E90FF", tooltip: "Pendiente: Cambios listos para sincronizar." }, // Azul
  
  // Estados de problema: La acción no se completó.
  "failed": { status: false, color: "#FF6347", tooltip: "Error: La acción no se pudo sincronizar." }, // Rojo
  "deleted": { status: false, color: "#A52A2A", tooltip: "Pendiente de eliminación." }, // Marrón-Rojo (indicando acción irreversible)
};
  
  //******************************************/
  // INDEXED: PRINCIPAL PARA MODULOS OFFLINE*/
  //****************************************/
  
  //----------------------------------------------------------------------

  // Función para cargar grupos desde IndexedDB o backend
  const loadGroups = async () => {
    const data = await getGroups();
    setGroups(data);

    // Actualiza el grupo seleccionado si existe
    if (selectedGroup) {
      const updatedSelected = data.find(g => g.id === selectedGroup.id);
      setSelectedGroup(updatedSelected || null);
    } else if (data.length > 0) {
      setSelectedGroup(data[0]);
    } else {
      setSelectedGroup(null);
    }
  };

  // Carga inicial de grupos
  useEffect(() => {
    loadGroups();
  }, []);
  //----------------------------------------------------------------------

  // =============================
  // Gestión de eventos online/offline y sincronización
  // =============================
  useEffect(() => {
    // Cada vez que se dispara un evento de red o de sincronización
    // recargamos los grupos para reflejar el estado actual
    const handleSyncEvent = () => loadGroups();

    // Suscripción a eventos de sincronización de grupos
    groupSensor.on("item-synced", handleSyncEvent);
    groupSensor.on("itemDeleted", handleSyncEvent);
    groupSensor.on("item-failed", handleSyncEvent);
    groupSensor.on("sync-success", handleSyncEvent);
    groupSensor.on("sync-failure", handleSyncEvent);

    // Suscripción a eventos de cambio de red
    networkSensor.on("online", handleSyncEvent);     // navegador detecta conexión
    networkSensor.on("offline", handleSyncEvent);     // navegador pierde conexión
    networkSensor.on("server-online", handleSyncEvent);// API vuelve a estar disponible
    networkSensor.on("server-offline", handleSyncEvent);// API cae

    // Limpieza de eventos al desmontar
    return () => {
      groupSensor.off("item-synced", handleSyncEvent);
      groupSensor.off("itemDeleted", handleSyncEvent);
      groupSensor.off("item-failed", handleSyncEvent);
      groupSensor.off("sync-success", handleSyncEvent);
      groupSensor.off("sync-failure", handleSyncEvent);

      networkSensor.off("online", handleSyncEvent);
      networkSensor.off("offline", handleSyncEvent);
      networkSensor.off("server-online", handleSyncEvent);
      networkSensor.off("server-offline", handleSyncEvent);
    };
  }, [selectedGroup]);

  // =============================
  // Funciones CRUD (Modificadas para Optimistic UI)
  // =============================
  const handleCreateOrUpdateGroup = async (groupName: string, description: string) => {
    if (selectedGroup && selectedGroup.id) {
      // ✅ ACTUALIZACIÓN: Optimistic UI para "Actualizar"
      const updatedGroup = { ...selectedGroup, groupName, description, syncStatus: "updated" as GroupSyncStatus };
      setGroups(prevGroups => prevGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      setSelectedGroup(updatedGroup);
      await updateGroup(updatedGroup);
    } else {
      // ✅ ACTUALIZACIÓN: Optimistic UI para "Crear"
      const newGroup = { groupName, description, lastModifiedAt: new Date().toISOString() };
      const tempId = new Date().getTime().toString(); // Genera un ID temporal para la UI
      setGroups(prevGroups => [...prevGroups, { ...newGroup, id: tempId, syncStatus: "pending" as GroupSyncStatus, users: [] }]);
      await createGroup(newGroup);
    }
    setIsGroupDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    // ✅ ACTUALIZACIÓN: Optimistic UI para "Eliminar"
    // Marca el elemento como eliminado en la UI en lugar de eliminarlo de la lista.
    const groupToDelete = { ...itemToDelete, syncStatus: "deleted" as GroupSyncStatus };
    setGroups(prevGroups => prevGroups.map(g => g.id === groupToDelete.id ? groupToDelete : g));
    await deleteGroup(groupToDelete);
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // =============================
  // Funciones para abrir dialogs
  // =============================
  const handleOpenGroupDialog = (group: Group | null = null) => {
    if (group && (group.syncStatus === "in-progress" || group.syncStatus === "deleted")) {
      alert("No se puede editar un grupo que está en proceso de sincronización o marcado para eliminación.");
      return;
    }
    setSelectedGroup(group);
    setIsGroupDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: Group) => {
    if (item.syncStatus === "in-progress" || item.syncStatus === "deleted") {
      alert("No se puede eliminar un grupo que ya está en proceso de sincronización o marcado para eliminación.");
      return;
    }
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // =============================
  // Atajos de teclado
  // =============================
  const handleNewFromShortcut = () => handleOpenGroupDialog();
  const handleSaveFromShortcut = () => {
    if (isGroupDialogOpen) {
      const dialog = document.getElementById("group-dialog-form") as HTMLFormElement;
      if (dialog) {
        const groupName = (dialog.querySelector("input[name='groupName']") as HTMLInputElement)?.value;
        const description = (dialog.querySelector("input[name='description']") as HTMLInputElement)?.value;
        if (groupName) handleCreateOrUpdateGroup(groupName, description);
      }
    }
  };
  const handleEditFromShortcut = () => { if (selectedGroup) handleOpenGroupDialog(selectedGroup); };
  const handleDeleteFromShortcut = () => { if (selectedGroup) handleOpenDeleteDialog(selectedGroup); };

  useKeyboardShortcut(SHORTCUTS.NEW_FORM.keys, handleNewFromShortcut);
  useKeyboardShortcut(SHORTCUTS.SAVE_FORM.keys, handleSaveFromShortcut);
  useKeyboardShortcut(SHORTCUTS.DELETE_ITEM.keys, handleDeleteFromShortcut);
  useKeyboardShortcut(SHORTCUTS.EDIT_FORM.keys, handleEditFromShortcut);

  // =============================
  // Exponer funciones a ref externo
  // =============================
  useImperativeHandle(ref, () => ({
    handleOpenGroupModal: handleOpenGroupDialog,
    handleSaveFromShortcut,
    handleDeleteFromShortcut,
    handleEditFromShortcut,
    isGroupDialogOpen,
    isDeleteDialogOpen,
  }));

  // =============================
  // Paginación
  // =============================
  const currentGroups = useMemo(() => {
    const indexOfLastGroup = currentPage * itemsPerPage;
    const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;
    return groups.slice(indexOfFirstGroup, indexOfLastGroup);
  }, [groups, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // =============================
  // Navegación con teclas arriba/abajo
  // =============================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGroupDialogOpen || isDeleteDialogOpen) return;
      if (["ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const currentIndex = selectedGroup ? currentGroups.findIndex(g => g.id === selectedGroup.id) : -1;
        let newIndex = currentIndex;
        if (event.key === "ArrowDown") newIndex = Math.min(currentIndex + 1, currentGroups.length - 1);
        if (event.key === "ArrowUp") newIndex = Math.max(currentIndex - 1, 0);
        if (currentGroups[newIndex]) setSelectedGroup(currentGroups[newIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGroups, selectedGroup, isGroupDialogOpen, isDeleteDialogOpen]);

  // =============================
  // Render
  // =============================
  return (
    <div className="group-management table-wrapper">
      <div className="header-actions">
        <h2>Gestión de Grupos</h2>
        <button className="add-button action-btn" onClick={() => handleOpenGroupDialog()}>
          <FaPlus size={16} />
        </button>
      </div>

      <div className="table-container">
        <div className="groups-list">
          {currentGroups.map((g, index) => {
            const isBlocked = g.syncStatus === "in-progress" || g.syncStatus === "deleted";
            const lightProps = statusColors[g.syncStatus as keyof typeof statusColors] ?? { status: false, tooltip: "" };
            return (
              <div
                key={g.id}
                className={`group-item ${index % 2 === 0 ? "even" : "odd"} ${selectedGroup?.id === g.id ? "selected" : ""}`}
                onClick={() => setSelectedGroup(g)}
              >
                <div className="item-content">
                  {/* Luz LED que indica online/offline según estado de sincronización */}
                  <ReusableLight
                    status={lightProps.status}
                    comment={lightProps.tooltip}
                    onlineColor={lightProps.onlineColor}
                    offlineColor={lightProps.offlineColor}
                    size={16}
                  />
                  <span className="group-name-text">{g.groupName}</span>
                </div>
                <div className="item-actions">
                  <button
                    className="edit-button action-btn"
                    disabled={isBlocked}
                    onClick={(e) => { e.stopPropagation(); handleOpenGroupDialog(g); }}
                  >
                    <MdEdit size={16} />
                  </button>
                  <button
                    className="delete-button action-btn"
                    disabled={isBlocked}
                    onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(g); }}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paginación */}
      <div className="pagination-dots">
        {currentPage > 1 && <span className="arrow" onClick={() => paginate(currentPage - 1)}>‹</span>}
        {Array.from({ length: totalPages }, (_, i) => (
          <span key={i} className={`dot ${currentPage === i + 1 ? "active" : ""}`} onClick={() => paginate(i + 1)}>
              {i + 1}
          </span>
        ))}
        {currentPage < totalPages && <span className="arrow" onClick={() => paginate(currentPage + 1)}>›</span>}
      </div>

      {/* Dialogs */}
      <AddEditGroupDialog
        open={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        group={selectedGroup}
        onSave={handleCreateOrUpdateGroup}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteItem}
        item={itemToDelete}
      />
    </div>
  );
});

export default GroupManagement;