import json
import os
from models.user_model import User  # <- tu modelo de usuario

DATA_DIR = "data"
USERS_FILE = os.path.join(DATA_DIR, "users.json")
AUTH_FILE = os.path.join(DATA_DIR, "auth.json")

# Asegura que la carpeta y auth.json existan
os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(AUTH_FILE):
    with open(AUTH_FILE, "w") as f:
        json.dump({}, f)  # archivo vacío para token

def read_users():
    """Lee todos los usuarios desde el JSON usando el modelo"""
    try:
        with open(USERS_FILE, "r") as f:
            users_data = json.load(f)
            return [User(**u) for u in users_data]
    except Exception as e:
        print("Error al leer usuarios:", e)
        return []

def read_auth():
    """Lee el token y usuario"""
    if not os.path.exists(AUTH_FILE):
        return {}
    try:
        with open(AUTH_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print("Error al leer auth:", e)
        return {}

def write_auth(data):
    """Guarda token y usuario"""
    try:
        with open(AUTH_FILE, "w") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print("Error al guardar auth:", e)

class AuthService:
    def login(self, username, password):
        """Valida contra los usuarios del JSON"""
        users = read_users()
        user = next((u for u in users if u.username == username and u.password == password), None)
        if user:
            token = f"fake-token-for-{username}"
            write_auth({"token": token, "user": user.__dict__})
            return True, user
        return False, "Usuario o contraseña incorrectos"

    def logout(self):
        """Elimina token"""
        write_auth({})
        return True

    def get_user(self):
        """Devuelve usuario actual"""
        data = read_auth()
        return data.get("user")

    def is_authenticated(self):
        """Verifica si hay token"""
        data = read_auth()
        return "token" in data and bool(data["token"])
