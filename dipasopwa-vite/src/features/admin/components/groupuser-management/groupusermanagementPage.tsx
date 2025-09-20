// src/pages/GroupUserManagementPage.tsx
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import GroupManagement from "./groupusermanagement";
import { useKeyboardShortcut } from "./../../../../hooks/functions/useKeyboardShoartcut";
import { SHORTCUTS } from "./../../../../config/shortcuts/keyShortcuts";

// ✅ Actualizamos el tipo para la referencia del componente hijo
type GroupManagementRef = {
  handleOpenGroupModal: () => void;
  handleEditFromShortcut: () => void;
  // ✅ Añadimos el método para el atajo de eliminar
  handleDeleteFromShortcut: () => void;
};

const GroupUserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const groupManagementRef = useRef<GroupManagementRef>(null);

  const handleBack = () => {
    navigate("..");
  };

  useKeyboardShortcut(SHORTCUTS.NEW_FORM.keys, () => {
    if (groupManagementRef.current) {
      groupManagementRef.current.handleOpenGroupModal();
    }
  });

  useKeyboardShortcut(SHORTCUTS.EDIT_FORM.keys, () => {
    if (groupManagementRef.current) {
      groupManagementRef.current.handleEditFromShortcut();
    }
  });

  // ✅ Añadimos el atajo para la función de eliminar
  useKeyboardShortcut(SHORTCUTS.DELETE_ITEM.keys, () => {
    if (groupManagementRef.current) {
      groupManagementRef.current.handleDeleteFromShortcut();
    }
  });

  return (
    <div>
      <button className="btn-back" onClick={handleBack}>← Volver</button>
      <GroupManagement ref={groupManagementRef} />
    </div>
  );
};

export default GroupUserManagementPage;