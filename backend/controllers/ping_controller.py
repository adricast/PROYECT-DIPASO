# controllers/ping_controller.py
from flask import Blueprint, jsonify

ping_bp = Blueprint("ping", __name__)

@ping_bp.route("/api/ping", methods=["GET"])
def ping():
    """Endpoint para verificar que la API está activa"""
    return jsonify({"status": "ok"}), 200
