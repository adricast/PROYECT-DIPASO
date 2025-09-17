import React, { useState, useEffect, useMemo } from "react";
import "./../../styles/group-management.scss";
import type { Group } from "../../../../entities/api/groupAPI";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../../../../services/api/groupService";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";
import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import ReusableLight from "./../../../../components/layout/indicatorlight1ledLayout";
import { type GroupSyncStatus } from "../../../../entities/api/groupAPI";

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const statusColors: Record<GroupSyncStatus, { status: boolean; onlineColor?: string; offlineColor?: string; tooltip: string }> = {
    pending: { status: false, offlineColor: "#FF6347", tooltip: "Pendiente: Creado sin conexión." },
    synced: { status: true, onlineColor: "#32CD32", tooltip: "Sincronizado: Listo." },
    deleted: { status: false, offlineColor: "#A52A2A", tooltip: "Pendiente de eliminación." },
    "in-progress": { status: true, onlineColor: "#FFA500", tooltip: "Sincronizando..." },
    updated: { status: true, onlineColor: "#1E90FF", tooltip: "Pendiente: Actualizado sin conexión." },
  };

  const loadGroups = async () => {
    const data = await getGroups();
    setGroups(data);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const handleSyncComplete = () => {
      loadGroups();
    };

    const handleDeleted = () => {
      loadGroups();
    };

    const itemFailedHandler = ({ item }: { item: Group }) => {
      console.warn("⚠️ Grupo en estado pendiente:", item);
    };

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
        syncStatus: selectedGroup.syncStatus === "synced" ? "updated" : "pending",
      });
    } else {
      await createGroup({ groupName, description, users: [] });
    }
    setIsGroupDialogOpen(false);
    setSelectedGroup(null);
    loadGroups(); // ⬅️ Aseguramos que se recarguen los datos al guardar
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    await deleteGroup(itemToDelete as Group);
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    loadGroups(); // ⬅️ Aseguramos que se recarguen los datos al eliminar
  };

  const handleOpenGroupDialog = (group: Group | null = null) => {
    if (group && group.syncStatus !== "synced") {
      alert("No se puede editar un grupo que aún no está sincronizado.");
      return;
    }
    setSelectedGroup(group);
    setIsGroupDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: Group) => {
    if (item.syncStatus !== "synced") {
      alert("No se puede eliminar un grupo que no está sincronizado.");
      return;
    }
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const currentGroups = useMemo(() => {
    const indexOfLastGroup = currentPage * itemsPerPage;
    const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;
    return groups.slice(indexOfFirstGroup, indexOfLastGroup);
  }, [groups, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
            const isBlocked = g.syncStatus !== "synced";
            const lightProps = statusColors[g.syncStatus ?? "pending"] ?? { status: false, tooltip: "" };
            
            return (
              <div
                key={g.groupId || g.tempId}
                className={`group-item ${index % 2 === 0 ? 'even' : 'odd'}`}
              >
                <div className="item-content" onClick={() => handleOpenGroupDialog(g)}>
                  <ReusableLight
                    status={lightProps.status}
                    comment={lightProps.tooltip}
                    onlineColor={lightProps.onlineColor}
                    offlineColor={lightProps.offlineColor}
                    size={16}
                  />
                  <span className="group-name-text">
                    {g.groupName}
                  </span>
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

      <div className="pagination-dots">
        {currentPage > 1 && (
          <span className="arrow" onClick={() => paginate(currentPage - 1)}>
            ‹
          </span>
        )}
        {Array.from({ length: totalPages }, (_, i) => (
          <span
            key={i}
            className={`dot ${currentPage === i + 1 ? "active" : ""}`}
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </span>
        ))}
        {currentPage < totalPages && (
          <span className="arrow" onClick={() => paginate(currentPage + 1)}>
            ›
          </span>
        )}
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
};

export default GroupManagement;