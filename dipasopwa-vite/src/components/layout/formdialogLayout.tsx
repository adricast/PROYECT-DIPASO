import React, { type ReactNode } from "react";
import "./FormDialog.scss"; // importar los estilos

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const FormDialog: React.FC<FormDialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="form-dialog-backdrop">
      <div className="form-dialog-container">
        {title && (
          <div className="form-dialog-header">
            <h2>{title}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        )}

        <div className="form-dialog-content">{children}</div>

        <div className="form-dialog-footer">
          <button className="cancel-btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default FormDialog;
