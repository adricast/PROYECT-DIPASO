import { GroupRepository } from "../db/groupRepository";
import type { Group, GroupSyncStatus } from "../../entities/api/groupAPI";
import { api } from "../../services/api";
import { groupSensor } from "../../hooks/sensors/groupSensor";
import { groupRouteApi } from "../../config/groupConfig";
import { AuthRepository } from "../db/authRepository";

const groupRepo = new GroupRepository();
const authRepo = new AuthRepository();
const TOKEN_KEY = "auth_token";

// -----------------------
// FUNCIÓN PARA OBTENER GRUPOS
// -----------------------
export const getGroups = async (): Promise<Group[]> => {
 const token = await authRepo.getToken(TOKEN_KEY);

 if (token) {
 try {
 const response = await api.get<Group[]>(groupRouteApi.group, {
 headers: { Authorization: `Bearer ${token.token}` },
 });

 // CAMBIO CLAVE: Mapear user_group_id a groupId
 const syncedGroups = response.data.map((g: any) => ({
 groupId: g.user_group_id, // Usamos la nueva columna del backend
 groupName: g.group_name,
 description: g.description,
 users: [],
 syncStatus: "synced" as GroupSyncStatus,
 }));

 for (const group of syncedGroups) {
 if (group.groupId) {
 await groupRepo.saveGroup(group);
 } else {
 console.warn("⚠️ Grupo recibido del servidor sin groupId:", group);
 }
 }
 } catch (error) {
 console.error(
 "❌ Error al obtener grupos del servidor o al guardar en IndexedDB.",
 error
 );
 }
 }
 return await groupRepo.getAllGroups();
};

// -----------------------
// FUNCIÓN PARA CREAR UN GRUPO
// -----------------------
export const createGroup = async (
 newGroup: Omit<Group, "groupId" | "syncStatus">
): Promise<Group | null> => {
 const token = await authRepo.getToken(TOKEN_KEY);
 const tempId = Date.now().toString();
 const pendingGroup: Group = {
 ...newGroup,
 groupId: tempId,
 tempId,
 groupName: newGroup.groupName,
 syncStatus: "pending" as GroupSyncStatus,
 };

 if (token) {
 try {
 await groupRepo.saveGroup({ ...pendingGroup, syncStatus: "in-progress" });

 const response = await api.post(groupRouteApi.group, {
 group_name: newGroup.groupName,
 description: newGroup.description,
 }, {
 headers: { Authorization: `Bearer ${token.token}` },
 });

 // CAMBIO CLAVE: Mapear user_group_id a groupId
 const serverGroup: Group = {
 groupId: response.data.user_group_id, // Usamos la nueva columna del backend
 groupName: response.data.group_name,
 description: response.data.description,
 users: [],
 syncStatus: "synced" as GroupSyncStatus,
 };

 await groupRepo.deleteGroup(tempId);
 await groupRepo.saveGroup(serverGroup);
 return serverGroup;
 } catch (error) {
 console.error("❌ Error al crear online. Guardando como pendiente.", error);
 groupSensor.itemFailed(pendingGroup, error);
 return await groupRepo.saveGroup(pendingGroup);
 }
 } else {
 console.log("✏️ Creando grupo offline. Marcando como pendiente.");
 return await groupRepo.saveGroup(pendingGroup);
 }
};

// -----------------------
// FUNCIÓN PARA ACTUALIZAR UN GRUPO
// -----------------------
export const updateGroup = async (
 updatedGroup: Group
): Promise<Group | null> => {
 const token = await authRepo.getToken(TOKEN_KEY);

 const isSynced = updatedGroup.syncStatus === "synced" || updatedGroup.syncStatus === "updated";

 if (token && isSynced) {
 try {
 await groupRepo.saveGroup({ ...updatedGroup, syncStatus: "in-progress" });

 const response = await api.put(
 // CAMBIO CLAVE: La URL ahora usa la nueva columna
 `${groupRouteApi.group}${updatedGroup.groupId}`,
 {
 group_name: updatedGroup.groupName,
 description: updatedGroup.description,
 },
 {
 headers: { Authorization: `Bearer ${token.token}` },
 }
 );

 // CAMBIO CLAVE: Mapear user_group_id a groupId
 const serverGroup: Group = {
 groupId: response.data.user_group_id, // Usamos la nueva columna del backend
 groupName: response.data.group_name,
 description: response.data.description,
 users: [],
 syncStatus: "synced" as GroupSyncStatus,
 };

 await groupRepo.saveGroup(serverGroup);
 return serverGroup;
 } catch (error) {
 console.error("❌ Error al actualizar online. Marcando como 'updated'.", error);
 groupSensor.itemFailed(updatedGroup, error);
 const pendingGroup = { ...updatedGroup, syncStatus: "updated" as GroupSyncStatus };
 return await groupRepo.saveGroup(pendingGroup);
 }
 } else {
 console.log("✏️ Actualizando grupo offline. Marcando como 'updated'.");
 const pendingGroup = { ...updatedGroup, syncStatus: "updated" as GroupSyncStatus };
 return await groupRepo.saveGroup(pendingGroup);
 }
};

// -----------------------
// FUNCIÓN PARA ELIMINAR UN GRUPO
// -----------------------
export const deleteGroup = async (group: Group): Promise<boolean> => {
 const token = await authRepo.getToken(TOKEN_KEY);
 const idOrTempId = group.groupId || group.tempId!;

 if (token && group.syncStatus === "synced") {
 try {
 await groupRepo.saveGroup({ ...group, syncStatus: "in-progress" });
 // CAMBIO CLAVE: La URL ahora usa la nueva columna
 await api.delete(`${groupRouteApi.group}${group.groupId}`, {
 headers: { Authorization: `Bearer ${token.token}` },
 });
 await groupRepo.deleteGroup(idOrTempId);
 groupSensor.emit("itemDeleted", idOrTempId);
 return true;
 } catch (error) {
 console.error("❌ Error al eliminar online. Marcando como 'deleted'.", error);
 groupSensor.itemFailed(group, error);
 await groupRepo.saveGroup({ ...group, syncStatus: "deleted" as GroupSyncStatus });
 groupSensor.emit("itemDeleted", idOrTempId);
 return false;
 }
 } else {
 await groupRepo.deleteGroup(idOrTempId);
 groupSensor.emit("itemDeleted", idOrTempId);
 return true;
 }
};