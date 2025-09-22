// src/hooks/sensors/networkSensor.ts
import mitt from "mitt";

export type NetworkEvents = {
  online: void;
  offline: void;
  "server-online": void;
  "server-offline": void;
};

export const networkSensor = mitt<NetworkEvents>();

export const networkState = {
  isOnline: navigator.onLine,
  serverOnline: false,
};

const BACKEND_URL = "http://127.0.0.1:5000/api";
const PING_URL = `${BACKEND_URL}/ping`;

/**
 * Verifica si el servidor está online.
 */
export const checkServerStatus = async (): Promise<boolean> => {
  try {
    const res = await fetch(PING_URL, { cache: "no-store" });
    const isUp = res.ok;

    if (isUp !== networkState.serverOnline) {
      networkState.serverOnline = isUp;
      networkSensor.emit(isUp ? "server-online" : "server-offline");
      console.log(isUp ? "✅ Servidor online" : "❌ Servidor offline");
    }

    return isUp;
  } catch (error) {
    if (networkState.serverOnline) {
      networkState.serverOnline = false;
      networkSensor.emit("server-offline");
      console.log("❌ Servidor offline (error de conexión)", error);
    }
    return false;
  }
};

/**
 * Actualiza el estado de la conexión a internet.
 */
const updateInternetStatus = () => {
  const newIsOnline = navigator.onLine;
  if (newIsOnline !== networkState.isOnline) {
    networkState.isOnline = newIsOnline;
    networkSensor.emit(newIsOnline ? "online" : "offline");
    console.log(newIsOnline ? "🌐 Internet conectado" : "🌐 Internet desconectado");
  }
};

// Función para iniciar la verificación periódica del servidor
let serverCheckInterval: number | null = null;
export const startServerMonitoring = (interval = 5000) => {
  if (serverCheckInterval) clearInterval(serverCheckInterval);
  serverCheckInterval = window.setInterval(() => {
    if (networkState.isOnline) checkServerStatus();
  }, interval);
};

export const stopServerMonitoring = () => {
  if (serverCheckInterval) {
    clearInterval(serverCheckInterval);
    serverCheckInterval = null;
  }
};

// Inicialización
updateInternetStatus();
startServerMonitoring();

// Escucha eventos nativos de red
window.addEventListener("online", updateInternetStatus);
window.addEventListener("offline", updateInternetStatus);

/**
 * Suscripción simplificada a cambios de red y servidor
 */
export const onNetworkChange = (
  onlineCallback: () => void,
  offlineCallback: () => void,
  serverOnlineCallback?: () => void,
  serverOfflineCallback?: () => void
) => {
  networkSensor.on("online", onlineCallback);
  networkSensor.on("offline", offlineCallback);
  if (serverOnlineCallback) networkSensor.on("server-online", serverOnlineCallback);
  if (serverOfflineCallback) networkSensor.on("server-offline", serverOfflineCallback);

  return () => {
    networkSensor.off("online", onlineCallback);
    networkSensor.off("offline", offlineCallback);
    if (serverOnlineCallback) networkSensor.off("server-online", serverOnlineCallback);
    if (serverOfflineCallback) networkSensor.off("server-offline", serverOfflineCallback);
  };
};
