import logging
import traceback
from flask import Blueprint, request, jsonify
from services.group_service import groupservice
#from ws.server import broadcast_to_all,message_queue  # importas tu función de WS
import redis # 🔑 Cliente síncrono de Redis
import json # Necesario para json.dumps()
import asyncio
# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
# --- CONFIGURACIÓN DE REDIS (CORRECTA) ---
REDIS_HOST = 'localhost'
REDIS_PORT = 6379 # ✅ Puerto estándar de Redis
REDIS_CHANNEL = "notifications:groups"
# 🔑 Inicialización del publicador de Redis (Síncrono para Flask)
r_publisher = None 
try:
    r_publisher = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    r_publisher.ping() 
    logging.info("Conexión a Redis establecida para Pub/Sub.")
except Exception as e:
    logging.error("❌ Fallo al conectar con Redis: %s. Las notificaciones no funcionarán.", e)
    # r_publisher permanece como None, y la lógica de create_group lo manejará.


# -------------------------------
# ruta
# -------------------------------
group_bp = Blueprint("iam-user-groups", __name__)
group_service = groupservice()


# -------------------------------
# Ping para verificar servidor
# -------------------------------
@group_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"}), 200

# -------------------------------
# Listar todos los roles
# -------------------------------
@group_bp.route("/", methods=["GET"])
def get_roles():
    try:
        roles = group_service.get_all_groups()
        return jsonify([r.to_dict() for r in roles]), 200
    except Exception as e:
        logging.error("Error obteniendo roles:\n%s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Obtener rol por ID
# -------------------------------
@group_bp.route("/<string:user_group_id>", methods=["GET"])
def get_group(user_group_id):
    try:
        group = group_service.get_group_by_id(user_group_id)
        return jsonify(group.to_dict()), 200
    except Exception as e:
        logging.error("Error obteniendo rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({"error": str(e)}), 500
# -------------------------------
# Coroutine para notificar WS
# -------------------------------

# -------------------------------
# Crear rol
# -------------------------------
@group_bp.route("/", methods=["POST"])
def create_group():
    try:
        data = request.json
        required_fields = ["group_name", "description"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Faltan campos requeridos"}), 400

        transaction_id = request.headers.get("Transaction-Id")
        if not transaction_id:
            return jsonify({"error": "Falta el header 'Transaction-Id'"}), 400

        # Crear el grupo
        group = group_service.create_group(
            group_name=data["group_name"],
            description=data["description"],
            transaction_id=transaction_id
        )
        if r_publisher:
            notification_message = {
                "type": "GROUP_CREATED",
                "payload": group.to_dict() # Usamos el diccionario del objeto Group
            }
            
            # 🔑 Publicar el mensaje JSON en el canal
            r_publisher.publish(REDIS_CHANNEL, json.dumps(notification_message))
            logging.info("✅ Notificación de grupo publicada en Redis.")

        # 🔔 Enviar notificación al WS (solo poner en la queue, no await)
      
        return jsonify(group.to_dict()), 201

    except Exception as e:
        logging.error("Error creando rol:\n%s", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    

# -------------------------------
# Actualizar rol
# -------------------------------
@group_bp.route("/<string:user_group_id>", methods=["PUT"])
def update_group(user_group_id):
    try:
        data = request.json
        group = group_service.update_group(user_group_id, **data)
        return jsonify(group.to_dict()), 200
    except Exception as e:
        logging.error("Error actualizando rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Eliminar rol
# -------------------------------
@group_bp.route("/<string:user_group_id>", methods=["DELETE"])
def delete_group(user_group_id):
    try:
        result = group_service.delete_group(user_group_id)
        return jsonify(result), 200
    except Exception as e:
        logging.error("Error eliminando rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Cambiar estado del rol
# -------------------------------
@group_bp.route("/<string:user_group_id>/status", methods=["PATCH"])
def change_group_status(user_group_id):
    try:
        data = request.json
        if "is_active" not in data:
            return jsonify({"error": "Falta el campo 'is_active'"}), 400

        group = group_service.change_group_status(user_group_id, data["is_active"])
        logging.info("Estado del rol %s cambiado a %s", user_group_id, data["is_active"])
        return jsonify(group.to_dict()), 200

    except Exception as e:
        logging.error("Error cambiando estado del rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({"error": str(e)}), 500
