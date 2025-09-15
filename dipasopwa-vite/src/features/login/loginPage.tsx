import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../login/components/loginForm";
import { authService } from "./../../services/api/authService"; // ⬅️ IMPORTACIÓN CORREGIDA
import "../login/style/loginPage.scss";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Función que se pasa al LoginForm
  const handleLogin = async (username: string, password: string) => {
  const result = await authService.login(username, password); // ⬅️ LLAMADA A LA FUNCIÓN CORREGIDA

  if (result.success && result.user) {
    navigate("/dashboard"); // Redirige al dashboard
  }

  return result;
};

return (
  <div className="login-page-container">
    <LoginForm onLogin={handleLogin} />
  </div>
);
};

export default LoginPage;