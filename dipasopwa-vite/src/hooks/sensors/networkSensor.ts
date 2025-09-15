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

const checkServerStatus = async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/ping`); 
        if (res.ok) {
            if (!serverOnline) {
                serverOnline = true;
                networkSensor.emit("server-online");
                console.log("✅ Servidor online detectado, emitiendo evento.");
            }
        } else {
            if (serverOnline) {
                serverOnline = false;
                networkSensor.emit("server-offline");
                console.log("❌ Servidor offline, emitiendo evento.");
            }
        }
    } catch (error) {
        if (serverOnline) {
            serverOnline = false;
            networkSensor.emit("server-offline" );
            console.log("❌ Servidor offline (error de conexión), emitiendo evento."+ error);
        }
    }
};

const startServerPing = () => {
  if (pingInterval !== null) {
    return;
  }
  pingInterval = window.setInterval(checkServerStatus, PING_INTERVAL);
};

const stopServerPing = () => {
  if (pingInterval !== null) {
    clearInterval(pingInterval);
    pingInterval = null;
    }
};

const updateNetworkStatus = () => {
  const newIsOnline = navigator.onLine;

  if (newIsOnline !== isOnline) {
    isOnline = newIsOnline;
    if (isOnline) {
      networkSensor.emit("online");
      // 🚨 CAMBIO CLAVE: Llama a checkServerStatus() inmediatamente
      checkServerStatus();
      startServerPing();
    } else {
      networkSensor.emit("offline");
      stopServerPing();
    }
  }
};

const checkInitialStatus = () => {
  if (navigator.onLine) {
    checkServerStatus();
    startServerPing();
  }
};

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

checkInitialStatus();

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