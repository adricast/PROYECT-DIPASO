import type { Group } from "./../../entities/api/group2API";
import { api } from "./../../services/api";
import { groupRouteApi } from "./../../config/groupConfig";

/** Mapea los datos del backend a la interfaz Group */
function mapGroupFromApi(apiGroup: any): Group {
  return {
    groupId: apiGroup.user_group_id, // mapeo correcto
    groupName: apiGroup.group_name,
    description: apiGroup.description ?? "",
    users: [], // opcional, puedes mapear usuarios si vienen del backend
    lastModifiedAt: apiGroup.last_modified_at ?? new Date().toISOString(),
  };
}

/** Obtiene todos los grupos */
export async function getGroups(): Promise<Group[]> {
  try {
    const response = await api.get<any[]>(groupRouteApi.group);
    return response.data.map(mapGroupFromApi);
  } catch (error: any) {
    console.error("Error al obtener grupos:", error);
    throw error;
  }
}

/** Obtiene un grupo por ID */
export async function getGroupById(groupId: string): Promise<Group | null> {
  try {
    const response = await api.get<any>(`${groupRouteApi.group}${groupId}`);
    return mapGroupFromApi(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error("Error obteniendo grupo:", error);
    throw error;
  }
}

/** Crea un grupo */
export async function createGroup(group: Omit<Group, "groupId">): Promise<Group> {
  try {
    const response = await api.post<any>(groupRouteApi.group, {
      group_name: group.groupName,
      description: group.description,
    });
    return mapGroupFromApi(response.data);
  } catch (error: any) {
    console.error("Error creando grupo:", error);
    throw error;
  }
}

/** Actualiza un grupo */
export async function updateGroup(group: Group): Promise<Group> {
  try {
    const response = await api.put<any>(`${groupRouteApi.group}${group.groupId}`, {
      group_name: group.groupName,
      description: group.description,
    });
    return mapGroupFromApi(response.data);
  } catch (error: any) {
    console.error("Error actualizando grupo:", error);
    throw error;
  }
}

/** Elimina un grupo */
export async function deleteGroup(groupId: string|number): Promise<void> {
  try {
    await api.delete(`${groupRouteApi.group}${groupId}`);
  } catch (error: any) {
    console.error("Error eliminando grupo:", error);
    throw error;
  }
}

/** Cambia el estado activo/inactivo de un grupo */
export async function changeGroupStatus(groupId: string|number, isActive: boolean): Promise<Group> {
  try {
    const response = await api.patch<any>(`${groupRouteApi.group}${groupId}/status`, {
      is_active: isActive,
    });
    return mapGroupFromApi(response.data);
  } catch (error: any) {
    console.error("Error cambiando estado del grupo:", error);
    throw error;
  }
}
