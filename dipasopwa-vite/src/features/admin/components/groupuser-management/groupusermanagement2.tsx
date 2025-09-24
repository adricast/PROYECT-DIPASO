import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Group } from "./../../../../entities/api/group2API";
import { getGroups, createGroup, updateGroup, deleteGroup } from "./../../../../services/api/group2Service";
import AddEditGroupDialog from "./addeditgroupdialog2";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import ReusableTable from "../../../../components/layout/screenusableLayout";
import { v4 as uuidv4 } from "uuid";
import { useKeyboardShortcut } from "./../../../../hooks/functions/useKeyboardShoartcut";
import { SHORTCUTS } from "./../../../../config/shortcuts/keyShortcuts";
import "./../../styles/group-management2.scss";
// ✅ Declaramos el tipo de referencia que el padre podrá usar
export type GroupManagementRef = {
  handleOpenGroupModal: () => void;
  handleEditFromShortcut: () => void;
  handleDeleteFromShortcut: () => void;
};

const GroupManagement = forwardRef<GroupManagementRef>((_, ref) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedRows, setSelectedRows] = useState<Group[]>([]);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Group | null>(null);

  const loadGroups = useCallback(async () => {
    const dataFromService = await getGroups();
    const normalized: Group[] = dataFromService.map(g => ({
      groupId: g.groupId ?? uuidv4(),
      groupName: g.groupName,
      description: g.description ?? "",
      lastModifiedAt: g.lastModifiedAt ?? new Date().toISOString(),
      users: g.users ?? [],
    }));
    setGroups(normalized);
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleOpenGroupDialog = (group: Group | null = null) => {
    setSelectedGroup(group);
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = async (groupName: string, description: string) => {
    if (selectedGroup) {
      const updatedGroup: Group = { ...selectedGroup, groupName, description };
      await updateGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.groupId === updatedGroup.groupId ? updatedGroup : g));
    } else {
      const newGroupData: Omit<Group, "groupId"> = {
        groupName,
        description,
        lastModifiedAt: new Date().toISOString(),
        users: [],
      };
      const newGroup: Group = await createGroup(newGroupData);
      setGroups(prev => [...prev, newGroup]);
    }
    setIsGroupDialogOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!itemToDelete || !itemToDelete.groupId) return;
    await deleteGroup(itemToDelete.groupId);
    setGroups(prev => prev.filter(g => g.groupId !== itemToDelete.groupId));
    setItemToDelete(null);
    setSelectedRows([]);
    setIsDeleteDialogOpen(false);
  };

  // ✅ Exponemos los métodos al componente padre
  useImperativeHandle(ref, () => ({
    handleOpenGroupModal: () => handleOpenGroupDialog(),
    handleEditFromShortcut: () => { if (selectedGroup) handleOpenGroupDialog(selectedGroup); },
    handleDeleteFromShortcut: () => {
      if (selectedRows.length > 0) {
        setItemToDelete(selectedRows[0]);
        setIsDeleteDialogOpen(true);
      }
    },
  }));

  const columns = [
    { field: "groupName", header: "Nombre del Grupo" },
    { field: "description", header: "Descripción" },
  ];

  const buttons = [
    {
      label: "Agregar",
      color: "bg-green-600",
      textColor: "text-black",
      onClick: () => handleOpenGroupDialog(),
    },
    {
      label: "Eliminar",
      color: "bg-red-600",
      textColor: "text-black",
      onClick: (selectedRows?: Group[]) => {
        if (!selectedRows || selectedRows.length === 0) return;
        setItemToDelete(selectedRows[0]);
        setIsDeleteDialogOpen(true);
      },
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Gestión de Grupos</h2>

      <ReusableTable
        moduleName="Grupos"
        data={groups}
        rowKey="groupId"
        columns={columns}
        buttons={buttons}
        selectableField="groupId"
        onRowSelect={(row) => setSelectedGroup(row)}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
      />

      <AddEditGroupDialog
        open={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        group={selectedGroup}
        onSave={handleSaveGroup}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteGroup}
        item={itemToDelete}
      />
    </div>
  );
});

export default GroupManagement;
