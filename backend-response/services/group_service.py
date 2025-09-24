# services/group_service.py
from models.group_model import Group 
from datetime import datetime
import uuid

class groupservice:
    """Servicio modular para CRUD de Roles"""

    def create_group(self, group_name: str, description: str):
        try:
            group = Group(
                group_name=group_name,
                description=description,
            )
            success = group.save()
            return success, group if success else None
        except Exception as e:
            print("❌ Error creando rol:", e)
            raise

    def get_all_groups(self):
        """Devuelve todos los roles"""
        return Group.get_all()

    def get_group_by_id(self, user_group_id: str):
        """Obtiene un rol por su UUID"""
        return Group.get_by_id(user_group_id)

    def update_group(self, user_group_id: str, **kwargs):
        """Actualiza campos de un rol"""
        group = Group.get_by_id(user_group_id)
        if not group:
            return False, "Rol no encontrado"

        for key, value in kwargs.items():
            if hasattr(group, key):
                setattr(group, key, value)

        success = group.update()
        return success, group if success else "Error actualizando rol"

    def delete_group(self, user_group_id: str):
        """Elimina un rol"""
        group = Group.get_by_id(user_group_id)
        if not group:
            return False, "Rol no encontrado"
        success = group.delete()
        return success, "Rol eliminado" if success else "Error eliminando rol"



    def change_group_status(self, user_group_id: str, is_active: bool):
        """Cambia solo el estado (activo/inactivo) de un grupo"""
        group = Group.get_by_id(user_group_id)
        if not group:
            return False, "Rol no encontrado"

        try:
            group.is_active = is_active
            group.updated_at = datetime.utcnow()
            success = group.update()
            return success, group if success else "Error actualizando estado"
        except Exception as e:
            print("❌ Error cambiando estado del rol:", e)
            return False, str(e)