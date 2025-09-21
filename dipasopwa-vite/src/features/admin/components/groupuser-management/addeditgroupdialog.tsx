// src/features/admin/components/user-management/addeditgroupdialog.tsx

import React, { useState, useEffect } from "react";
// Asegúrate de que el tipo 'Group' esté importado correctamente
import type { Group } from "../../../../entities/api/groupAPI";

const AddEditGroupDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  group: Group | null;
  onSave: (groupName: string, description: string) => void;
}> = ({ open, onClose, group, onSave }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setDescription(group.description || "");
    } else {
      setGroupName("");
      setDescription("");
    }
  }, [group]);

  const handleSave = () => {
    onSave(groupName, description);
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>{group ? "Editar Grupo" : "Crear Grupo"}</h3>
        <input placeholder="Nombre del grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
        <input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="dialog-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave}>{group ? "Actualizar" : "Crear"}</button>
        </div>
      </div>
    </div>
  );
};

export default AddEditGroupDialog;