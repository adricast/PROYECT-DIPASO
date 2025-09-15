// src/db/authRepository.ts
import { getDB } from "./indexed";
import type { Auth } from "../../entities/api/authAPI";
import type { Token } from "../../entities/api/tokenAPI";

const AUTH_STORE = "auths";
const TOKEN_STORE = "tokens";

export class AuthRepository {
  // -----------------------------
  // USERS (AUTH)
  // -----------------------------
  /**
   * Guarda un usuario en IndexedDB
   * Si user.auth_id existe lo reemplaza, si no se autoincrementa
   */
  async saveAuth(user: Auth): Promise<Auth> {
    const db = await getDB();

    // Asegúrate de que el objeto tenga auth_id si ya lo tiene, si no lo deja autoIncrementar
    const toSave = { ...user };
    await db.put(AUTH_STORE, toSave); 
    return toSave;
  }

  async getAuthById(id: number): Promise<Auth | undefined> {
    const db = await getDB();
    return await db.get(AUTH_STORE, id);
  }

  async getAllAuths(): Promise<Auth[]> {
    const db = await getDB();
    return await db.getAll(AUTH_STORE);
  }

  async deleteAuth(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(AUTH_STORE, id);
  }

  // -----------------------------
  // TOKENS
  // -----------------------------
  /**
   * Guarda un token en IndexedDB
   * Debe tener la propiedad 'key' porque el keyPath de IndexedDB es 'key'
   */
  async saveToken(tokenObj: Token): Promise<Token> {
    const db = await getDB();

    if (!tokenObj.key) {
      throw new Error("El token debe tener la propiedad 'key' para guardarse en IndexedDB");
    }

    await db.put(TOKEN_STORE, tokenObj);
    return tokenObj;
  }

  async getToken(key: string): Promise<Token | undefined> {
    const db = await getDB();
    return await db.get(TOKEN_STORE, key);
  }

  async deleteToken(key: string): Promise<void> {
    const db = await getDB();
    await db.delete(TOKEN_STORE, key);
  }
}
