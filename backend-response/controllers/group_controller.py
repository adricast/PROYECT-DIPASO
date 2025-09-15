# controllers/role_controller.py
from flask import Blueprint, request, jsonify
from services.group_service import GroupService
from psycopg2 import DatabaseError

group_bp = Blueprint("groups", __name__)
group_service = GroupService()

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
        # Usar to_dict() para la serialización correcta
        return jsonify([r.to_dict() for r in roles])
    except Exception as e:
        return jsonify({
            "error": "Error obteniendo roles",
            "details": str(e),
            "type": type(e).__name__
        }), 500

# -------------------------------
# Obtener rol por ID
# -------------------------------
@group_bp.route("/<string:group_id>", methods=["GET"])
def get_group(group_id):
    try:
        group = group_service.get_group_by_id(group_id)
        if group:
            # Usar to_dict()
            return jsonify(group.to_dict())
        return jsonify({"error": "Rol no encontrado"}), 404
    except Exception as e:
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
            # Usar to_dict()
            return jsonify(role.to_dict()), 201
        else:
            return jsonify({"error": "Error desconocido creando rol"}), 500

    except ConnectionError as conn_err:
        return jsonify({"error": str(conn_err)}), 503
    except DatabaseError as db_err:
        return jsonify({
            "error": "Error en la base de datos",
            "details": str(db_err),
            "type": type(db_err).__name__
        }), 500
    except Exception as e:
        return jsonify({
            "error": "Error creando rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500

# -------------------------------
# Actualizar rol
# -------------------------------
@group_bp.route("/<string:group_id>", methods=["PUT"])
def update_group(group_id):
    try:
        data = request.json
        success, role_or_msg = group_service.update_group(group_id, **data)
        if success:
            # Usar to_dict()
            return jsonify(role_or_msg.to_dict())
        else:
            return jsonify({"error": role_or_msg}), 404
    except Exception as e:
        return jsonify({
            "error": "Error actualizando rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500
        
# -------------------------------
# Eliminar rol
# -------------------------------
@group_bp.route("/<string:group_id>", methods=["DELETE"])

def delete_group(group_id):
    try:
        success, msg = group_service.delete_group(group_id)
        if success:
            return jsonify({"message": msg})
        else:
            return jsonify({"error": msg}), 404
    except Exception as e:
        return jsonify({
            "error": "Error eliminando rol",
            "details": str(e),
            "type": type(e).__name__
        }), 500