import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import "./../../styles/group-management.scss";
import type { Group, GroupSyncStatus } from "../../../../entities/api/groupAPI";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../../../../services/api/groupService";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";
import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import ReusableLight from "./../../../../components/layout/indicatorlight1ledLayout";
import { useKeyboardShortcut } from "./../../../../hooks/functions/useKeyboardShoartcut";
import { SHORTCUTS } from "./../../../../config/shortcuts/keyShortcuts";

const GroupManagement = forwardRef<any, any>((props, ref) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const statusColors: Record<GroupSyncStatus, { status: boolean; onlineColor?: string; offlineColor?: string; tooltip: string }> = {
    "pending": { status: false, offlineColor: "#FF6347", tooltip: "Pendiente: Creado sin conexión." },
    "synced": { status: true, onlineColor: "#32CD32", tooltip: "Sincronizado: Listo." },
    "deleted": { status: false, offlineColor: "#A52A2A", tooltip: "Pendiente de eliminación." },
    "in-progress": { status: true, onlineColor: "#FFA500", tooltip: "Sincronizando..." },
    "updated": { status: true, onlineColor: "#1E90FF", tooltip: "Pendiente: Actualizado sin conexión." },
    "failed": { status: false, offlineColor: "#808080", tooltip: "Error de sincronización." },
    "backend": { status: true, onlineColor: "#32CD32", tooltip: "Grupo de backend." },
  };

  const loadGroups = async () => {
    const data = await getGroups();
    setGroups(data);
    if (data.length > 0) setSelectedGroup(data[0]);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const handleSyncComplete = () => loadGroups();
    const handleDeleted = () => loadGroups();
    const itemFailedHandler = ({ item }: { item: Group }) => console.warn("⚠️ Grupo en estado pendiente:", item);

    groupSensor.on("item-synced", handleSyncComplete);
    groupSensor.on("itemDeleted", handleDeleted);
    groupSensor.on("item-failed", itemFailedHandler);
    return () => {
      groupSensor.off("item-synced", handleSyncComplete);
      groupSensor.off("itemDeleted", handleDeleted);
      groupSensor.off("item-failed", itemFailedHandler);
    };
  }, []);

  const handleCreateOrUpdateGroup = async (groupName: string, description: string) => {
    if (selectedGroup) {
      await updateGroup({
        ...selectedGroup,
        groupName,
        description,
        syncStatus: selectedGroup.syncStatus === "synced" || selectedGroup.syncStatus === "backend" ? "updated" : selectedGroup.syncStatus,
      });
    } else {
      // ✅ CORRECCIÓN: Se elimina 'syncStatus' porque 'createGroup' lo asigna internamente.
      await createGroup({ groupName, description, users: [] });
    }
    setIsGroupDialogOpen(false);
    setSelectedGroup(null);
    loadGroups();
  };
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    await deleteGroup(itemToDelete as Group);
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    loadGroups();
  };

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

  const handleNewFromShortcut = () => handleOpenGroupDialog();
  const handleSaveFromShortcut = () => {
    if (isGroupDialogOpen && selectedGroup) {
      handleCreateOrUpdateGroup(selectedGroup.groupName, selectedGroup.description || "");
    }
  };
  const handleEditFromShortcut = () => {
    if (selectedGroup) handleOpenGroupDialog(selectedGroup);
  };
  const handleDeleteFromShortcut = () => {
    if (selectedGroup) handleOpenDeleteDialog(selectedGroup);
  };

  useKeyboardShortcut(SHORTCUTS.NEW_FORM.keys, handleNewFromShortcut);
  useKeyboardShortcut(SHORTCUTS.SAVE_FORM.keys, handleSaveFromShortcut);
  useKeyboardShortcut(SHORTCUTS.DELETE_ITEM.keys, handleDeleteFromShortcut);
  useKeyboardShortcut(SHORTCUTS.EDIT_FORM.keys, handleEditFromShortcut);

  useImperativeHandle(ref, () => ({
    handleOpenGroupModal: handleOpenGroupDialog,
    handleSaveFromShortcut,
    handleDeleteFromShortcut,
    handleEditFromShortcut,
    isGroupDialogOpen,
    isDeleteDialogOpen,
  }));

  const currentGroups = useMemo(() => {
    const indexOfLastGroup = currentPage * itemsPerPage;
    const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;
    return groups.slice(indexOfFirstGroup, indexOfLastGroup);
  }, [groups, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGroupDialogOpen || isDeleteDialogOpen) return;
      if (["ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const currentIndex = selectedGroup
          ? currentGroups.findIndex(
              (g) =>
                (g.tempId === selectedGroup.tempId && g.groupId === selectedGroup.groupId) || g.tempId === selectedGroup.tempId
            )
          : -1;
        let newIndex = currentIndex;
        if (event.key === "ArrowDown") newIndex = Math.min(currentIndex + 1, currentGroups.length - 1);
        if (event.key === "ArrowUp") newIndex = Math.max(currentIndex - 1, 0);
        if (currentGroups[newIndex]) setSelectedGroup(currentGroups[newIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGroups, selectedGroup, isGroupDialogOpen, isDeleteDialogOpen]);

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
                key={g.groupId ?? g.tempId}
                className={`group-item ${index % 2 === 0 ? "even" : "odd"} ${
                  selectedGroup?.groupId === g.groupId || selectedGroup?.tempId === g.tempId ? "selected" : ""
                }`}
                onClick={() => setSelectedGroup(g)}
              >
                <div className="item-content">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGroupDialog(g);
                    }}
                  >
                    <MdEdit size={16} />
                  </button>
                  <button
                    className="delete-button action-btn"
                    disabled={isBlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteDialog(g);
                    }}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pagination-dots">
        {currentPage > 1 && <span className="arrow" onClick={() => paginate(currentPage - 1)}>‹</span>}
        {Array.from({ length: totalPages }, (_, i) => (
          <span key={i} className={`dot ${currentPage === i + 1 ? "active" : ""}`} onClick={() => paginate(i + 1)}>
            {i + 1}
          </span>
        ))}
        {currentPage < totalPages && <span className="arrow" onClick={() => paginate(currentPage + 1)}>›</span>}
      </div>

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
