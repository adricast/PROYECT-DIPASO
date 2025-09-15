# src/controllers/user_controller.py
from flask import Blueprint, request, jsonify
from services.user_service import UserService

user_bp = Blueprint("users", __name__)
user_service = UserService()

@user_bp.route("/", methods=["GET"])
def get_users():
    users = user_service.get_all_users()
    return jsonify([u.__dict__ for u in users])

@user_bp.route("/<string:user_id>", methods=["GET"])
def get_user(user_id):
    user = user_service.get_user_by_id(user_id)
    return jsonify(user.__dict__) if user else ({"error": "Usuario no encontrado"}, 404)

@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.json
    required_fields = ["username", "password", "identification", "email", "isactive"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    success, result = user_service.create_user(
        username=data["username"],
        password=data["password"],
        identification=data["identification"],
        email=data["email"],
        isactive=data["isactive"]
    )
    
    if success:
        return jsonify(result.__dict__), 201  # 201 Created
    else:
        return jsonify({"error": result}), 500

@user_bp.route("/<string:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json or {}

    # Quitar user_id del body si existe
    data.pop("user_id", None)
    
    success, result = user_service.update_user(user_id, **data)
    
    if success:
        return jsonify(result.__dict__)
    else:
        # Aquí el mensaje de error puede ser "Usuario no encontrado" u otro
        return jsonify({"error": result}), 404

@user_bp.route("/<string:user_id>", methods=["DELETE"])
def delete_user(user_id):
    success, result = user_service.delete_user(user_id)
    
    if success:
        return jsonify({"message": result})
    else:
        # Aquí el mensaje de error puede ser "Usuario no encontrado" u otro
        return jsonify({"error": result}), 404