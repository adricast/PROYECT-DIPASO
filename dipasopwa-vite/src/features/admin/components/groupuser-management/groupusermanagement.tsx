import React, { useEffect, useState } from "react";
import "./../../styles/group-management.scss";
import type { Group, GroupSyncStatus } from "../../../../entities/api/groupAPI";
import type { User } from "../../../../entities/api/userAPI";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../../../../services/api/groupService";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [group_name, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUserName, setAssignedUserName] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();

    const itemFailedHandler = ({ item }: { item: Group }) => {
      console.warn("⚠️ Grupo en estado pendiente:", item);
    };

    const itemDeletedHandler = (id: string | number) => {
      setGroups((prev) => prev.filter((g) => g.groupId !== id));
    };

    groupSensor.on("item-failed", itemFailedHandler);
    groupSensor.on("itemDeleted", itemDeletedHandler);

    return () => {
      groupSensor.off("item-failed", itemFailedHandler);
      groupSensor.off("itemDeleted", itemDeletedHandler);
    };
  }, []);

  const loadGroups = async () => {
    const data = await getGroups();
    setGroups(data);
  };

  const handleCreateOrUpdateGroup = async () => {
    if (selectedGroup) {
      // Si estaba "synced", ahora pasa a "updated", fallback a "pending"
      const newSyncStatus: GroupSyncStatus =
        selectedGroup.syncStatus === "synced" ? "updated" : selectedGroup.syncStatus ?? "pending";

      const updated = await updateGroup({
        ...selectedGroup,
        groupName: group_name,
        description,
        syncStatus: newSyncStatus,
      });

      if (updated) {
        setGroups((prev) =>
          prev.map((g) => (g.groupId === updated.groupId ? updated : g))
        );
      }
    } else {
      const newGroup = await createGroup({
        groupName: group_name,
        description,
        users: [],
      });
      if (newGroup) {
        setGroups((prev) => [...prev, newGroup]);
      }
    }

    setGroupName("");
    setDescription("");
    setSelectedGroup(null);
  };

  const handleDeleteGroup = async (group: Group) => {
    if (window.confirm("¿Eliminar grupo?")) {
      await deleteGroup(group);
      if (selectedGroup?.groupId === group.groupId) setSelectedGroup(null);
    }
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.groupName);
    setDescription(group.description || "");
  };

  const handleAssignOrUpdateUser = () => {
    if (!selectedGroup || !assignedUserName) return;

    let updatedGroup: Group;

    if (editingUserId) {
      updatedGroup = {
        ...selectedGroup,
        users: selectedGroup.users.map((u) =>
          u.userId === editingUserId ? { ...u, name: assignedUserName } : u
        ),
        syncStatus: selectedGroup.syncStatus === "synced" ? "updated" : selectedGroup.syncStatus ?? "pending",
      };
      setEditingUserId(null);
    } else {
      const newUser: User = { 
        userId: crypto.randomUUID(), 
        username: assignedUserName,
        name: assignedUserName
      };
      updatedGroup = {
        ...selectedGroup,
        users: [...selectedGroup.users, newUser],
        syncStatus: selectedGroup.syncStatus === "synced" ? "updated" : selectedGroup.syncStatus ?? "pending",
      };
    }

    setGroups((prev) =>
      prev.map((g) => (g.groupId === updatedGroup.groupId ? updatedGroup : g))
    );
    setSelectedGroup(updatedGroup);
    setAssignedUserName("");
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.userId ?? null);
    setAssignedUserName(user.name);
  };

  const handleDeleteUser = (userId: string | undefined) => {
    if (!selectedGroup || !userId) return;

    const updatedGroup: Group = {
      ...selectedGroup,
      users: selectedGroup.users.filter((u) => u.userId !== userId),
      syncStatus: selectedGroup.syncStatus === "synced" ? "updated" : selectedGroup.syncStatus ?? "pending",
    };

    setGroups((prev) =>
      prev.map((g) => (g.groupId === updatedGroup.groupId ? updatedGroup : g))
    );
    setSelectedGroup(updatedGroup);
  };

  return (
    <div className="group-management">
      <h2>Gestión de Grupos</h2>

      <div className="group-form">
        <input
          placeholder="Nombre del grupo"
          value={group_name}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <input
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={handleCreateOrUpdateGroup}>
          {selectedGroup ? "Actualizar" : "Crear"} grupo
        </button>
      </div>

      <div className="groups-list">
        <h3>Grupos existentes</h3>
        {groups.map((g) => (
          <div key={g.groupId} className="group-item">
            <span onClick={() => handleSelectGroup(g)}>
              {g.groupName} ({g.syncStatus})
            </span>
            <button onClick={() => handleDeleteGroup(g)}>Eliminar</button>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="users-section">
          <h3>Usuarios en {selectedGroup.groupName}</h3>
          <ul>
            {selectedGroup.users.map((u) => (
              <li key={u.userId ?? crypto.randomUUID()}>
                {u.name}
                <button onClick={() => handleEditUser(u)}>Editar</button>
                <button onClick={() => handleDeleteUser(u.userId)}>Eliminar</button>
              </li>
            ))}
          </ul>
          <input
            placeholder="Nombre de usuario"
            value={assignedUserName}
            onChange={(e) => setAssignedUserName(e.target.value)}
          />
          <button onClick={handleAssignOrUpdateUser}>
            {editingUserId ? "Actualizar" : "Asignar"} usuario
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
