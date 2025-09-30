# ws/server.py (CORREGIDO con Redis Pub/Sub)

import asyncio
import websockets
import json
import redis.asyncio as redis # 🔑 Usamos redis asíncrono

# URL de conexión a Redis
REDIS_URL = "redis://localhost:6379" 
REDIS_CHANNEL = "notifications:groups" # Canal específico para notificaciones de grupos

# Todos los clientes conectados
clients = set() 
# La message_queue ya no es necesaria para la comunicación con Flask.
# message_queue = asyncio.Queue() 

async def handler(websocket):
    # ... (Lógica de conexión y desconexión, se mantiene igual) ...
    clients.add(websocket)
    print("Nuevo cliente conectado.")
    try:
        async for message in websocket:
            print(f"Mensaje recibido: {message}")
            # Si el cliente envia algo, lo podrías procesar aquí
    except websockets.ConnectionClosed:
        print("Cliente desconectado.")
    finally:
        clients.remove(websocket)

# -----------------------------
# Nueva Task: Consumidor de Redis
# -----------------------------
async def redis_subscriber():
    # 1. Conectarse a Redis
    try:
        r = redis.from_url(REDIS_URL)
        pubsub = r.pubsub()
        await pubsub.subscribe(REDIS_CHANNEL)
        print(f"Redis suscrito al canal: {REDIS_CHANNEL}")
    except Exception as e:
        print(f"❌ Error al conectar o suscribir a Redis: {e}")
        return # Sale de la tarea si no puede conectar

    # 2. Bucle principal para escuchar mensajes
    while True:
        try:
            # Esperar mensajes del canal
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1) 
            
            if message and message['data']:
                data = json.loads(message['data']) # El mensaje es el JSON enviado por Flask
                
                # 3. Reenviar a todos los clientes WS conectados
                if clients:
                    websockets_broadcast = [client.send(json.dumps(data)) for client in clients]
                    await asyncio.wait(websockets_broadcast)
                    print("📣 Notificación REDIS enviada a clientes WS:", data['type'])
        
        except asyncio.TimeoutError:
            # Esto es normal, significa que no había mensajes en el canal.
            pass
        except Exception as e:
            print(f"Error en el bucle de Redis: {e}")
            await asyncio.sleep(5) # Esperar antes de reintentar

# -----------------------------
# Servidor WS
# -----------------------------
async def main():
    # 🔑 Tarea: Iniciar el consumidor de Redis en paralelo
    asyncio.create_task(redis_subscriber())
    
    # Servir WS
    async with websockets.serve(handler, "0.0.0.0", 8001): # Usamos el puerto 8001 de nuevo para WS
        print("Servidor WS iniciado en ws://localhost:8001")
        await asyncio.Future() 

if __name__ == "__main__":
    asyncio.run(main())