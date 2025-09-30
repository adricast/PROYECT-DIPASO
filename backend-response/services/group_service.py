from models.group_model import Group
from datetime import datetime

class groupservice:
    """Servicio modular para CRUD de Roles"""

    def create_group(self, group_name: str, description: str, transaction_id: str):
        try:
            group = Group(
                user_group_id=transaction_id,
                group_name=group_name,
                description=description,
            )
            success = group.save()
            if not success:
                raise Exception("Error desconocido guardando el grupo")
            return group
        except Exception as e:
            print("❌ Error creando rol:", e)
            raise

    def get_all_groups(self):
        try:
            return Group.get_all()
        except Exception as e:
            print("❌ Error obteniendo roles:", e)
            raise

    def get_group_by_id(self, user_group_id: str):
        try:
            group = Group.get_by_id(user_group_id)
            if not group:
                raise Exception("Rol no encontrado")
            return group
        except Exception as e:
            print("❌ Error obteniendo rol:", e)
            raise

    def update_group(self, user_group_id: str, **kwargs):
        try:
            group = Group.get_by_id(user_group_id)
            if not group:
                raise Exception("Rol no encontrado")
            for key, value in kwargs.items():
                if hasattr(group, key):
                    setattr(group, key, value)
            if not group.update():
                raise Exception("Error actualizando rol")
            return group
        except Exception as e:
            print("❌ Error actualizando rol:", e)
            raise

    def delete_group(self, user_group_id: str):
        try:
            group = Group.get_by_id(user_group_id)
            if not group:
                raise Exception("Rol no encontrado")
            if not group.delete():
                raise Exception("Error eliminando rol")
            return {"message": "Rol eliminado"}
        except Exception as e:
            print("❌ Error eliminando rol:", e)
            raise

    def change_group_status(self, user_group_id: str, is_active: bool):
        try:
            group = Group.get_by_id(user_group_id)
            if not group:
                raise Exception("Rol no encontrado")
            group.is_active = is_active
            group.updated_at = datetime.utcnow()
            if not group.update():
                raise Exception("Error actualizando estado")
            return group
        except Exception as e:
            print("❌ Error cambiando estado del rol:", e)
            raise
