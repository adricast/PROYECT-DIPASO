import { api } from "../../services/api";
import { authRouteApi } from "../../config/autRouteApi";
import { authSensor } from "../../hooks/sensors/authSensor";
import { AuthRepository } from "../db/authRepository";
import { syncUserToken } from "./../../workers/syncAuthWorker"; // Importar el worker de sincronización
import type { Auth } from "../../entities/api/authAPI";

const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

/**
 * Función de inicialización para verificar el estado de la sesión offline.
 * Se ejecuta al iniciar la aplicación.
 */
export async function initAuthService() {
  const token = await authRepo.getToken(TOKEN_KEY);

  if (!token) {
    console.log("⚠️ No hay token guardado en IndexedDB.");
    authSensor.failure(new Error("No hay token"));
    return;
  }

  // Revisar expiración del token
  if (Date.now() > token.expiresAt) {
    console.log("⚠️ Token expirado.");
    await authRepo.deleteToken(TOKEN_KEY);
    authSensor.failure(new Error("Token expirado"));
    return;
  }

  // Si el token es válido localmente, se considera autenticado
  console.log("✅ Token válido en IndexedDB, sesión activa offline.");
  authSensor.itemSynced({} as Auth);

  // Intentar sincronizar con el backend si hay conexión
  if (navigator.onLine) {
    await syncUserToken();
  }
}

export const authService = {
  // -----------------------
  // LOGIN
  // -----------------------
  login: async (username: string, password: string) => {
    try {
      const response = await api.post<{ user: Auth; token: string }>(
        authRouteApi.login,
        { username, password }
      );

      const { user, token } = response.data;
      if (!user || !token) throw new Error("Credenciales inválidas");

      // Guardar token y usuario offline
      await authRepo.saveToken({
        id: TOKEN_KEY,
        key: TOKEN_KEY,
        token,
        expiresAt: Date.now() + 1000 * 60 * 60, // 1 hora
        syncStatus: "synced",
      });

      await authRepo.saveAuth({ ...user, syncStatus: "synced" });

      authSensor.itemSynced(user);
      return { success: true, user };
    } catch (error) {
      console.error("❌ Login fallido:", error);
      authSensor.itemFailed({} as Auth, error);
      return { success: false, message: "Credenciales inválidas o error de red" };
    }
  },

  // -----------------------
  // LOGOUT
  // -----------------------
  logout: async () => {
    try {
      await authRepo.deleteToken(TOKEN_KEY);
      authSensor.emit("itemDeleted", 0);
    } catch (error) {
      authSensor.failure(error);
    }
  },
};