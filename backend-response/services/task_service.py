import json
import os
from models.task_model import Task

# Ruta del archivo JSON
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "tasks.json")

# Asegura que la carpeta y el archivo existan
os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

def read_tasks():
    """Lee todas las tareas desde el archivo JSON."""
    try:
        with open(DATA_FILE, "r") as f:
            tasks = json.load(f)
            return [Task(**t) for t in tasks]
    except Exception as e:
        print("Error al leer tareas:", e)
        return []
def get_all_tasks():
    """Devuelve todas las tareas."""
    return read_tasks()


def get_task_by_id(task_id):
    """Devuelve una tarea específica por su id, con manejo de errores."""
    try:
        tasks = read_tasks()
        for task in tasks:
            if task.id == task_id:
                return task
        return None  # No se encontró la tarea
    except Exception as e:
        print(f"Error al leer la tarea con id {task_id}: {e}")
        return None


def write_tasks(tasks):
    """Escribe todas las tareas al archivo JSON."""
    try:
        with open(DATA_FILE, "w") as f:
            json.dump([t.__dict__ for t in tasks], f, indent=4)
    except Exception as e:
        print("Error al guardar tareas:", e)



def add_task(title, description="", status="todo"):
    """Agrega una tarea nueva."""
    tasks = read_tasks()
    new_task = Task(
        id=len(tasks) + 1,
        title=title,
        description=description,
        status=status
    )
    tasks.append(new_task)
    write_tasks(tasks)
    return new_task

def update_task(task_id, title=None, description=None, status=None):
    """Actualiza una tarea por id."""
    tasks = read_tasks()
    for task in tasks:
        if task.id == task_id:
            if title is not None:
                task.title = title
            if description is not None:
                task.description = description
            if status is not None:
                task.status = status
            write_tasks(tasks)
            return task
    return None

def delete_task(task_id):
    """Elimina una tarea por id."""
    tasks = read_tasks()
    tasks = [t for t in tasks if t.id != task_id]
    write_tasks(tasks)
