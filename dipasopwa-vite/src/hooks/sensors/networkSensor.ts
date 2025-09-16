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
const isLocalBackend =
  BACKEND_URL.includes("127.0.0.1") || BACKEND_URL.includes("localhost");

const PING_INTERVAL = 5000;
let pingInterval: number | null = null;

const checkServerStatus = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/ping`);
    if (res.ok) {
      if (!serverOnline) {
        serverOnline = true;
        networkSensor.emit("server-online");
        console.log("✅ Servidor online detectado.");
      }
    } else {
      if (serverOnline) {
        serverOnline = false;
        networkSensor.emit("server-offline");
        console.log("❌ Servidor respondió mal.");
      }
    }
  } catch (error) {
    if (serverOnline) {
      serverOnline = false;
      networkSensor.emit("server-offline");
      console.log("❌ Servidor offline (error conexión).", error);
    }
  }
};

const startServerPing = () => {
  if (pingInterval !== null) return;
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
      console.log("🌐 Internet conectado");
    } else {
      networkSensor.emit("offline");
      console.log("🌐 Internet desconectado");
    }
  }

  // 👇 IMPORTANTE:
  // Si el backend es local → siempre seguimos haciendo ping
  // Si es remoto → solo ping si hay internet
  if (isLocalBackend || isOnline) {
    checkServerStatus();
    startServerPing();
  } else {
    stopServerPing();
  }
};

const checkInitialStatus = () => {
  if (isLocalBackend || navigator.onLine) {
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
  if (serverOnlineCallback)
    networkSensor.on("server-online", serverOnlineCallback);
  if (serverOfflineCallback)
    networkSensor.on("server-offline", serverOfflineCallback);

  return () => {
    networkSensor.off("online", onlineCallback);
    networkSensor.off("offline", offlineCallback);
    if (serverOnlineCallback)
      networkSensor.off("server-online", serverOnlineCallback);
    if (serverOfflineCallback)
      networkSensor.off("server-offline", serverOfflineCallback);
  };
};
