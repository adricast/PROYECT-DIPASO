import logging
import traceback
from flask import Blueprint, request, jsonify
from services.group_service import groupservice
from psycopg2 import DatabaseError

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

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
        return jsonify([r.to_dict() for r in roles])
    except Exception as e:
        logging.error("Error obteniendo roles:\n%s", traceback.format_exc())
        return jsonify({
            "error": "Error obteniendo roles",
            "details": str(e),
            "type": type(e).__name__
        }), 500

# -------------------------------
# Obtener rol por ID (user_group_id)
# -------------------------------
@group_bp.route("/<string:user_group_id>", methods=["GET"])
def get_group(user_group_id):
    try:
        group = group_service.get_group_by_id(user_group_id)
        if group:
            return jsonify(group.to_dict())
        return jsonify({"error": "Rol no encontrado"}), 404
    except Exception as e:
        logging.error("Error obteniendo rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({
            "error": "Error obteniendo rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500

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

        success, role = group_service.create_group(
            group_name=data["group_name"],
            description=data["description"]
        )
        if success:
            return jsonify(role.to_dict()), 201
        else:
            return jsonify({"error": "Error desconocido creando rol"}), 500

    except Exception as e:
        logging.error("Error creando rol:\n%s", traceback.format_exc())
        return jsonify({
            "error": "Error creando rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500

# -------------------------------
# Actualizar rol
# -------------------------------
@group_bp.route("/<string:user_group_id>", methods=["PUT"])
def update_group(user_group_id):
    try:
        data = request.json
        success, role_or_msg = group_service.update_group(user_group_id, **data)
        if success:
            return jsonify(role_or_msg.to_dict())
        else:
            return jsonify({"error": role_or_msg}), 404
    except Exception as e:
        logging.error("Error actualizando rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({
            "error": "Error actualizando rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500

# -------------------------------
# Eliminar rol
# -------------------------------
@group_bp.route("/<string:user_group_id>", methods=["DELETE"])
def delete_group(user_group_id):
    try:
        success, msg = group_service.delete_group(user_group_id)
        if success:
            return jsonify({"message": msg})
        else:
            return jsonify({"error": msg}), 404
    except Exception as e:
        logging.error("Error eliminando rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({
            "error": "Error eliminando rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500

@group_bp.route("/<string:user_group_id>/status", methods=["PATCH"])
def change_group_status(user_group_id):
    try:
        data = request.json
        if "is_active" not in data:
            return jsonify({"error": "Falta el campo 'is_active'"}), 400

        is_active = data["is_active"]
        success, group_or_msg = group_service.change_group_status(user_group_id, is_active)

        if success:
            logging.info("Estado del rol %s cambiado a %s", user_group_id, is_active)
            return jsonify(group_or_msg.to_dict())
        else:
            return jsonify({"error": group_or_msg}), 404

    except Exception as e:
        logging.error("Error cambiando estado del rol %s:\n%s", user_group_id, traceback.format_exc())
        return jsonify({
            "error": "Error cambiando estado del rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500