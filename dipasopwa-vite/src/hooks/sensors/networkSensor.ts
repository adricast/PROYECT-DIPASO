// src/sensors/networkSensor.ts

// ****************
// sensor general
// ****************

import mitt from "mitt";

export type NetworkEvents = {
  online: void;
  offline: void;
  "server-online": void;
  "server-offline": void;
};

export const networkSensor = mitt<NetworkEvents>();

export let isOnline = navigator.onLine;
export let serverOnline = false;

const BACKEND_URL = "http://127.0.0.1:5000/api";
const PING_INTERVAL = 5000;
let pingInterval: number | null = null;

const updateNetworkStatus = () => {
  const newIsOnline = navigator.onLine;

  if (newIsOnline !== isOnline) {
    isOnline = newIsOnline;
    if (isOnline) {
      networkSensor.emit("online");
      startServerPing();
    } else {
      networkSensor.emit("offline");
      stopServerPing();
    }
  }
};

const checkServerStatus = async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/ping`); 
        if (res.ok) {
            if (!serverOnline) {
                serverOnline = true;
                networkSensor.emit("server-online");
            }
        } else {
            if (serverOnline) {
                serverOnline = false;
                networkSensor.emit("server-offline");
            }
        }
    } catch {
        if (serverOnline) {
            serverOnline = false;
            networkSensor.emit("server-offline");
        }
    }
}

const startServerPing = () => {
 if (pingInterval !== null) return;

 // ⬅️ NOTA: El primer chequeo se hace con checkServerStatus()
 // Esto solo iniciará el ping periódico después del primer chequeo.
 pingInterval = window.setInterval(checkServerStatus, PING_INTERVAL);

};

const stopServerPing = () => {
  if (pingInterval !== null) {
    clearInterval(pingInterval);
    pingInterval = null;
    }
};

const checkInitialStatus = () => {
  if (navigator.onLine) {
    // ⬅️ CAMBIO CLAVE: Primero checamos el estado del servidor
    // y luego iniciamos el ping periódico.
    checkServerStatus();
    startServerPing();
  }
};

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

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

checkInitialStatus();