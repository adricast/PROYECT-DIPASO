// src/login/components/LoginForm.tsx
import React, { useState } from "react";
import "../style/loginForm.scss";
import { FaFingerprint, FaKey, FaUserLock } from "react-icons/fa"; // importamos los íconos

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [loginMethod, setLoginMethod] = useState<"method_selection" | "password_form">("method_selection");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await onLogin(username, password);
      if (result.success) {
        setMessage("✅ Inicio de sesión exitoso");
        setMessageType("success");
      } else {
        setMessage(result.message || "❌ Usuario o contraseña incorrectos");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Error inesperado");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Iniciar Sesión</h2>
          <p>Selecciona un método de autenticación</p>
        </div>

        {loginMethod === "method_selection" ? (
          <div className="login-methods">
            {/* Método 1: Huella */}
            <div className="method-card disabled" title="Próximamente">
              <FaFingerprint size={30} />
              <span className="label">Huella Dactilar</span>
              <span className="info">No disponible</span>
            </div>

            {/* Método 2: Contraseña */}
            <div
              className="method-card active"
              onClick={() => setLoginMethod("password_form")}
            >
              <FaKey size={30} />
              <span className="label">Contraseña</span>
              <span className="info">Habilitado</span>
            </div>

            {/* Método 3: PIN / OTP */}
            <div className="method-card disabled" title="Próximamente">
              <FaUserLock size={30} />
              <span className="label">PIN / OTP</span>
              <span className="info">No disponible</span>
            </div>
          </div>
        ) : (
          <div className="login-form-container">
            <button
              className="back-btn"
              onClick={() => {
                setLoginMethod("method_selection");
                setMessage("");
              }}
            >
              ⬅ Volver
            </button>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn primary" disabled={isLoading}>
                {isLoading ? "Cargando..." : "Iniciar Sesión"}
              </button>
            </form>
          </div>
        )}

        {message && <div className={`message ${messageType}`}>{message}</div>}
      </div>
    </div>
  );
};

export default LoginForm;
