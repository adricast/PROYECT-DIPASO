# controllers/auth_controller.py
from flask import Blueprint, request, jsonify
from services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "Faltan credenciales"}), 400

    success, user_or_msg = auth_service.login(username, password)
    if success:
        return jsonify({"success": True, "user": user_or_msg, "token": f"fake-token-for-{username}"})
    else:
        return jsonify({"success": False, "message": user_or_msg}), 401

@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    auth_service.logout()
    return jsonify({"success": True, "message": "Sesión cerrada"})

@auth_bp.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})
