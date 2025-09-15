from flask import Blueprint, request, jsonify
from services.task_service import get_task_by_id,get_all_tasks, add_task, update_task, delete_task

task_bp = Blueprint("tasks", __name__)
@task_bp.route("/tasks/ping", methods=["GET"])

def ping():
    """Endpoint para verificar si el servidor está activo"""
    return jsonify({"status": "ok"}), 200

@task_bp.route("/tasks", methods=["GET"])
def get_tasks():
    """Devuelve todas las tareas en JSON"""
    try:
        tasks = get_all_tasks()
        return jsonify([t.__dict__ for t in tasks])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@task_bp.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    """Devuelve una tarea por id."""
    try:
        task = get_task_by_id(task_id)
        if task:
            return jsonify(task.__dict__)
        return jsonify({"error": "Task not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@task_bp.route("/tasks", methods=["POST"])
def create_task():
    """Crea una tarea con título, descripción opcional y estado"""
    try:
        data = request.json
        title = data.get("title")
        description = data.get("description", "")
        status = data.get("status", "todo")
        task = add_task(title, description=description, status=status)
        return jsonify(task.__dict__), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@task_bp.route("/tasks/<int:task_id>", methods=["PUT"])
def update(task_id):
    """Actualiza título, descripción y/o estado de una tarea"""
    try:
        data = request.json
        title = data.get("title")
        description = data.get("description")
        status = data.get("status")
        task = update_task(task_id, title=title, description=description, status=status)
        if task:
            return jsonify(task.__dict__)
        return jsonify({"error": "Task not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@task_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete(task_id):
    """Elimina una tarea por id"""
    try:
        delete_task(task_id)
        return jsonify({"message": "Task deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
