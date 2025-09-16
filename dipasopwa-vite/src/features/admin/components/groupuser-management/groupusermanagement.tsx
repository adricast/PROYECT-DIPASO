import React, { useState, useEffect } from "react";
import "./../../styles/group-management.scss";
import type { Group } from "../../../../entities/api/groupAPI";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../../../../services/api/groupService";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";
import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import { FaPlus, FaTrash } from "react-icons/fa6";
import ReusableLight from "./../../../../components/layout/indicatorlight1ledLayout"; // import del nuevo componente

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Colores parametrizados según el estado
  const statusColors: Record<string, { status: boolean; onlineColor?: string; offlineColor?: string }> = {
    pending: { status: false, offlineColor: "#FF6347" },       // rojo tomate
    synced: { status: true, onlineColor: "#32CD32" },          // verde lima
    deleted: { status: false, offlineColor: "#A52A2A" },       // marrón oscuro
    "in-progress": { status: true, onlineColor: "#FFA500" },   // naranja
    updated: { status: true, onlineColor: "#1E90FF" },         // azul
  };

  useEffect(() => {
    const loadGroups = async () => {
      const data = await getGroups();
      setGroups(data);
    };
    loadGroups();

    const itemFailedHandler = ({ item }: { item: Group }) => {
      console.warn("⚠️ Grupo en estado pendiente:", item);
    };

    const itemDeletedHandler = (id: string | number) => {
      setGroups(prev => prev.filter(g => g.groupId !== id));
      if (selectedGroup?.groupId === id) setSelectedGroup(null);
    };

    groupSensor.on("item-failed", itemFailedHandler);
    groupSensor.on("itemDeleted", itemDeletedHandler);

    return () => {
      groupSensor.off("item-failed", itemFailedHandler);
      groupSensor.off("itemDeleted", itemDeletedHandler);
    };
  }, [selectedGroup]);

  const handleCreateOrUpdateGroup = async (groupName: string, description: string) => {
    if (selectedGroup) {
      const updated = await updateGroup({
        ...selectedGroup,
        groupName,
        description,
        syncStatus: selectedGroup.syncStatus === "synced" ? "updated" : "pending",
      });
      if (updated) setGroups(prev => prev.map(g => (g.groupId === updated.groupId ? updated : g)));
    } else {
      const newGroup = await createGroup({ groupName, description, users: [] });
      if (newGroup) setGroups(prev => [...prev, newGroup]);
    }
    setIsGroupDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    await deleteGroup(itemToDelete as Group);
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleOpenGroupDialog = (group: Group | null = null) => {
    setSelectedGroup(group);
    setIsGroupDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: Group) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const indexOfLastGroup = currentPage * itemsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;
  const currentGroups = groups.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="group-management">
      <div className="header-actions">
        <h2>Gestión de Grupos</h2>
        <button className="add-button" onClick={() => handleOpenGroupDialog()}>
          <FaPlus size={16} />
        </button>
      </div>

      <div className="groups-list-container">
        <div className="groups-list scrollable">
          {currentGroups.map((g) => {
            const lightProps = statusColors[g.syncStatus ?? "pending"] ?? { status: false };
            return (
              <div key={g.groupId} className="group-item">
                {/* Foco al lado izquierdo */}
                <ReusableLight
                  status={lightProps.status}
                  comment={`Estado: ${g.syncStatus ?? "pending"}`}
                  onlineColor={lightProps.onlineColor}
                  offlineColor={lightProps.offlineColor}
                  size={16}
                />

                <span onClick={() => handleOpenGroupDialog(g)}>
                  {g.groupName} ({g.syncStatus})
                </span>

                <button
                  className="delete-button"
                  onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(g); }}
                >
                  <FaTrash size={16} color="black" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-button ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
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
