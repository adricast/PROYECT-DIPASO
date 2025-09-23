import { api } from "./../api"; // Asume que ya tienes una instancia de Axios o Fetch configurada
import { userRouteApi } from "./../../config/userConfig";
import { User, UserCreatePayload, UserUpdatePayload } from "./../../entities/api/userAPI";

/**
 * Servicio de usuarios que interactúa directamente con la API sin lógica offline.
 * Utiliza las rutas predefinidas en `apiConfig`.
 */
export const onlineUserService = {

  /**
   * Obtiene todos los usuarios desde el backend.
   * @returns {Promise<User[]>} Lista de usuarios.
   */
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>(userRouteApi.users);
    return response.data;
  },

  /**
   * Obtiene un usuario específico por su ID.
   * @param {string} userId El ID del usuario.
   * @returns {Promise<User>} El usuario encontrado.
   */
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get<User>(`${userRouteApi.users}/${userId}`);
    return response.data;
  },

  /**
   * Crea un nuevo usuario en el backend.
   * @param {UserCreatePayload} userData Los datos del nuevo usuario.
   * @returns {Promise<User>} El usuario creado, con su ID asignado por el backend.
   */
  createUser: async (userData: UserCreatePayload): Promise<User> => {
    const response = await api.post<User>(userRouteApi.users, userData);
    return response.data;
  },

  /**
   * Actualiza un usuario existente en el backend.
   * @param {string} userId El ID del usuario a actualizar.
   * @param {UserUpdatePayload} updateData Los datos a modificar.
   * @returns {Promise<User>} El usuario actualizado.
   */
  updateUser: async (userId: string, updateData: UserUpdatePayload): Promise<User> => {
    const response = await api.put<User>(`${userRouteApi.users}/${userId}`, updateData);
    return response.data;
  },

  /**
   * Elimina un usuario por su ID en el backend.
   * @param {string} userId El ID del usuario a eliminar.
   * @returns {Promise<void>} Una promesa que se resuelve al completarse la eliminación.
   */
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`${userRouteApi.users}/${userId}`);
  },
};