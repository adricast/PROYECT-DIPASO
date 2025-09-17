import React from "react";
// Importa tu componente de Diálogo aquí

const DeleteConfirmationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: any | null;
}> = ({ open, onClose, onConfirm, item }) => {
  if (!open) return null;

  const message = `¿Está seguro de que desea eliminar el grupo "${item?.groupName}"?`;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Confirmar Eliminación</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={onConfirm} className="confirm-delete">Eliminar</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;