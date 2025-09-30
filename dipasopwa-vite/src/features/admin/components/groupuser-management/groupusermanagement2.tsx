import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Group } from "./../../../../entities/api/group2API";
import { getGroups, createGroup, updateGroup, deleteGroup } from "./../../../../services/api/group2Service";
import AddEditGroupDialog from "./addeditgroupdialog2";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import ReusableTable from "../../../../components/layout/screenusableLayout";
import { v4 as uuidv4 } from "uuid";

import "./../../styles/group-management2.scss";
// ✅ Declaramos el tipo de referencia que el padre podrá usar

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

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
     {/* 🔥 Bloque de prueba con InputGroup */}

<div className="space-y-4 w-full max-w-md p-4 bg-gray-50 rounded-lg shadow-lg">

  {/* Primer input group */}
  <div className="flex items-center w-full">
    <button
      className="px-4 py-2 !bg-blue-600 text-white font-semibold rounded-l-md hover:!bg-blue-600 transition-colors flex items-center"
    >
      <img src="https://dl.dropboxusercontent.com/scl/fi/4zlfj05kv53iijdo4e2td/busqueda.png?rlkey=d7qlp7uikpqcjm9wxgv5dtefl" alt="search" className="w-5 h-5 mr-2" /> {/* Imagen PNG */}
      Search
    </button>
    <input
      type="text"
      placeholder="Keyword"
      className="flex-1 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* Segundo input group con icono dentro del input */}

<div className="flex items-center w-full relative">
  <button
    className="px-4 py-2 !bg-blue-500 text-white font-semibold rounded-l-md hover:!bg-blue-600 transition-colors"
  >
    Search
  </button>
  <div className="flex-1 relative">
    <input
      type="text"
      placeholder="Keyword"
      className="w-full pl-10 pr-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
    />
    {/* Imagen dentro del input */}
    <img 
      src="https://dl.dropboxusercontent.com/scl/fi/4zlfj05kv53iijdo4e2td/busqueda.png?rlkey=d7qlp7uikpqcjm9wxgv5dtefl" 
      alt="icon" 
      className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-0.8 object-cover"
    />
  </div>
</div>

  {/* Tercer input group con botón icono */}
  <div className="flex items-center w-full">
    <button
      className="w-2 h-10  py-1 !bg-blue-600 text-white font-semibold rounded-l-md hover:!bg-blue-700 transition-colors flex items-center justify-center"
    >
      <img src="https://dl.dropboxusercontent.com/scl/fi/4zlfj05kv53iijdo4e2td/busqueda.png?rlkey=d7qlp7uikpqcjm9wxgv5dtefl" alt="search" className="w-4 h-4" /> {/* Imagen PNG */}
    </button>
    <input
      type="text"
      placeholder="Vote"
      className="flex-1 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-400"
    />
  </div>

</div>


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
