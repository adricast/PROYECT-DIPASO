#ws/redis/redis.py
import logging
import traceback
import json # 🔑 Necesario para serializar el mensaje
from flask import Blueprint, request, jsonify
from services.group_service import groupservice
# from ws.server import broadcast_to_all,message_queue  # <-- Esto queda COMENTADO
import redis # 🔑 Importar el cliente síncrono de Redis

import asyncio

# --- CONFIGURACIÓN DE REDIS ---
REDIS_HOST = 'localhost'
REDIS_PORT = 6379

REDIS_CHANNEL = "notifications:groups"

# 🔑 Conexión síncrona de Redis para Flask (Inicialización del publicador)
try:
    r_publisher = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    # Intenta hacer un ping para verificar la conexión
    r_publisher.ping() 
    logging.info("Conexión a Redis establecida para Pub/Sub.")
except Exception as e:
    logging.error("❌ Fallo al conectar con Redis: %s. Las notificaciones no funcionarán.", e)
    # En caso de fallo, inicializa r_publisher como None o un objeto simulado si es crítico.
    # Para simplicidad, lo dejaremos fallar si no se puede conectar.
    r_publisher = None 

# Configurar logging
# ... (resto del logging) ...

group_bp = Blueprint("iam-user-groups", __name__)
group_service = groupservice()
# ... (otras rutas: ping, get_roles, get_group) ...