// src/features/admin/components/user-management/addedituserdialog.tsx

import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { type User } from "../../../../entities/api/userAPI";

const generatePassword = (length = 12) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AddEditUserDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: User) => void;
  passwordToggleColor?: string;
  passwordToggleHoverColor?: string;
}> = ({ open, onClose, user, onSave, passwordToggleColor = "#624A89" }) => { // ❌ Error here, `passwordToggleHoverColor` is missing from the destructuring.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [identification, setIdentification] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPassword("");
      setIdentification(user.identification || "");
      setEmail(user.email || "");
      setAutoGeneratePassword(false);
    } else {
      setUsername("");
      setPassword("");
      setIdentification("");
      setEmail("");
      setAutoGeneratePassword(false);
    }
  }, [user]);

  const handleSave = () => {
    const isEditing = !!user;
    const userData = {
      username,
      password,
      identification,
      email,
      isactive: true,
    };
    if (!isEditing && autoGeneratePassword) {
      userData.password = generatePassword();
    }
    onSave(userData as User);
  };

  if (!open) return null;

  const isEditing = !!user;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>{isEditing ? "Editar Usuario" : "Crear Usuario"}</h3>
        <input placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Identificación" value={identification} onChange={(e) => setIdentification(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        {!isEditing && (
          <div className="password-container">
            <div className="password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={autoGeneratePassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                style={{
                  color: passwordToggleColor,
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="checkbox-container">
              <input
                type="checkbox"
                checked={autoGeneratePassword}
                onChange={(e) => setAutoGeneratePassword(e.target.checked)}
              />
              <label>Generar contraseña automáticamente</label>
            </div>
          </div>
        )}

        <div className="dialog-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave}>{isEditing ? "Actualizar" : "Crear"}</button>
        </div>
      </div>
    </div>
  );
};

export default AddEditUserDialog;