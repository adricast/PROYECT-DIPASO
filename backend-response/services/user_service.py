# src/services/user_service.py
from models.user_model import User
from datetime import datetime
import uuid

class UserService:

    def create_user(self, username, password, name, group_id):
        user = User(
            user_id=str(uuid.uuid4()),
            username=username,
            password=password,
            name=name,
            group_id=group_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        success = user.save()
        return success, user if success else None

    def get_all_users(self):
        return User.get_all()

    def get_user_by_id(self, user_id):
        return User.get_by_id(user_id)

    def update_user(self, user_id, **kwargs):
        user = User.get_by_id(user_id)
        if not user:
            return False, "Usuario no encontrado"
        for k, v in kwargs.items():
            if hasattr(user, k):
                setattr(user, k, v)
        user.updated_at = datetime.utcnow()
        success = user.update()
        return success, user if success else "Error actualizando usuario"

    def delete_user(self, user_id):
        user = User.get_by_id(user_id)
        if not user:
            return False, "Usuario no encontrado"
        success = user.delete()
        return success, "Usuario eliminado" if success else "Error eliminando usuario"
