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
    success, user = user_service.create_user(
        username=data["username"],
        password=data["password"],
        name=data["name"],
        group_id=data["group_id"]
    )
    return jsonify(user.__dict__) if success else ({"error": "Error creando usuario"}, 500)

@user_bp.route("/<string:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json or {}

    # Quitar user_id del body si existe
    data.pop("user_id", None)

    success, user_or_msg = user_service.update_user(user_id, **data)
    return jsonify(user_or_msg.__dict__) if success else ({"error": user_or_msg}, 404)

@user_bp.route("/<string:user_id>", methods=["DELETE"])
def delete_user(user_id):
    success, msg = user_service.delete_user(user_id)
    return jsonify({"message": msg}) if success else ({"error": msg}, 404)
