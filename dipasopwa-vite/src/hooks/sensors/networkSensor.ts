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
 * @function checkServerStatus
 * @description Verifica el estado del servidor mediante una petición 'ping'.
 * @returns {Promise<boolean>} Retorna true si el servidor está online, false si no.
 */
export const checkServerStatus = async (): Promise<boolean> => {
  if (!networkState.isOnline) {
    // No se puede verificar si la red principal está offline.
    return false;
  }
  
  try {
    const res = await fetch(PING_URL);
    if (res.ok) {
      if (!networkState.serverOnline) {
        networkState.serverOnline = true;
        networkSensor.emit("server-online");
        console.log("✅ Servidor online detectado.");
      }
      return true;
    } else {
      if (networkState.serverOnline) {
        networkState.serverOnline = false;
        networkSensor.emit("server-offline");
        console.log("❌ Servidor respondió mal.");
      }
      return false;
    }
  } catch (error) {
    if (networkState.serverOnline) {
      networkState.serverOnline = false;
      networkSensor.emit("server-offline" );
      console.log("❌ Servidor offline (error de conexión)."+error);
    }
    return false;
  }
};

/**
 * @function updateNetworkStatus
 * @description Actualiza el estado de la red (online/offline).
 */
const updateNetworkStatus = async () => {
  const newIsOnline = navigator.onLine;
  if (newIsOnline !== networkState.isOnline) {
    networkState.isOnline = newIsOnline;
    networkSensor.emit(newIsOnline ? "online" : "offline");
    console.log(newIsOnline ? "🌐 Internet conectado" : "🌐 Internet desconectado");
  }
  
  // Realiza una verificación inicial del servidor solo al cambiar a online.
  if (newIsOnline) {
      checkServerStatus();
  }
};

// Se detecta el estado inicial de la red.
(async () => {
  updateNetworkStatus();
})();

// Escucha los eventos de red nativos del navegador.
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

// Exporta una función para que otros módulos se suscriban a los cambios.
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