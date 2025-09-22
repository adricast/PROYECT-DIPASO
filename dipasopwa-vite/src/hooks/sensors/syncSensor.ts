// src/hooks/sensors/syncSensor.ts
import mitt, { type Emitter } from "mitt";

export type SyncEvents<T> = {
  "sync-start": void;
  "sync-progress": { completed: number; total: number };
  "sync-success": void;
  "sync-failure": { error: unknown };
  "item-synced": T;
  "item-failed": { item: T; error: unknown };
  "itemDeleted": string|number; 
  "groups-reloaded": void;  // ✅ Agregamos este evento
};

export class SyncSensor<T> {
  private emitter: Emitter<SyncEvents<T>>;

  constructor() {
    this.emitter = mitt<SyncEvents<T>>();
  }

  // --- Métodos para emitir eventos de sincronización ---
  start() {
    this.emitter.emit("sync-start");
  }

  progress(completed: number, total: number) {
    this.emitter.emit("sync-progress", { completed, total });
  }

  success() {
    this.emitter.emit("sync-success");
  }

  failure(error: unknown) {
    this.emitter.emit("sync-failure", { error });
  }

  itemSynced(item: T) {
    this.emitter.emit("item-synced", item);
  }

  itemFailed(item: T, error: unknown) {
    this.emitter.emit("item-failed", { item, error });
  }

  // Permite que otros módulos emitan eventos directamente
  emit<Key extends keyof SyncEvents<T>>(event: Key, payload: SyncEvents<T>[Key]) {
    this.emitter.emit(event, payload);
  }

  // --- Métodos para suscribirse a eventos ---
  on<Key extends keyof SyncEvents<T>>(
    event: Key,
    handler: (payload: SyncEvents<T>[Key]) => void
  ) {
    this.emitter.on(event, handler);
  }

  off<Key extends keyof SyncEvents<T>>(
    event: Key,
    handler: (payload: SyncEvents<T>[Key]) => void
  ) {
    this.emitter.off(event, handler);
  }
}