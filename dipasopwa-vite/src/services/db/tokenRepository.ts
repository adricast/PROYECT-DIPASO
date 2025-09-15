// src/db/tokenRepository.ts
import { getDB } from "./indexed";
import type { Token } from "../../entities/api/tokenAPI";

const STORE_NAME = "tokens";

export class TokenRepository {
  async saveToken(token: Token): Promise<Token> {
    const db = await getDB();
    await db.put(STORE_NAME, token);
    return token;
  }

  async getToken(id: string): Promise<Token | undefined> {
    const db = await getDB();
    return await db.get(STORE_NAME, id);
  }

  async getAllTokens(): Promise<Token[]> {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  }

  async deleteToken(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  }
}
