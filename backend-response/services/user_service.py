# src/services/user_service.py
from models.user_model import User

class UserService:

    def create_user(self, username, password, identification, email, isactive):
        """Crea un nuevo usuario con los campos especificados."""
        # Se podría agregar validación aquí antes de intentar guardar
        try:
            user = User(
                username=username,
                password=password,
                identification=identification,
                email=email,
                isactive=isactive
            )
            success = user.save()
            if not success:
                return False, "Error al guardar el usuario en la base de datos."
            return True, user
        except Exception as e:
            # Captura de errores inesperados, como problemas de conexión o datos inválidos
            return False, f"Error inesperado al crear usuario: {str(e)}"

    def get_all_users(self):
        """Obtiene todos los usuarios."""
        return User.get_all()

    def get_user_by_id(self, user_id):
        """Busca un usuario por su ID."""
        user = User.get_by_id(user_id)
        return user

    def update_user(self, user_id, **kwargs):
        """Actualiza un usuario existente por su ID con los campos proporcionados."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False, "Usuario no encontrado."
        
        # Validar y actualizar solo los campos válidos
        for k, v in kwargs.items():
            if hasattr(user, k):
                setattr(user, k, v)

        success = user.update()
        if not success:
            return False, "Error al actualizar el usuario en la base de datos."
        return True, user

    def delete_user(self, user_id):
        """Elimina un usuario por su ID."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False, "Usuario no encontrado."
        
        success = user.delete()
        if not success:
            return False, "Error al eliminar el usuario de la base de datos."
        return True, "Usuario eliminado correctamente."