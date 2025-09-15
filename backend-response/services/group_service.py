# services/role_service.py
from models.group_model import Group  # tu modelo group similar a SystemUser
from datetime import datetime
import uuid

class GroupService:
    """Servicio modular para CRUD de Roles"""

    def create_group(self, group_name: str, description: str):
        try:
            group = Group(
                group_id=uuid.uuid4(),  # genera un UUID único
                group_name=group_name,
                description=description,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            success = group.save()  # asumir método save() similar a SystemUser
            return success, group if success else None
        except Exception as e:
            print("❌ Error creando rol:", e)  # <-- esto imprime el error real en consola
            raise

    def get_all_groups(self):
        """Devuelve todos los roles"""
        return Group.get_all()  # método de clase que devuelve lista de roles

    def get_group_by_id(self, group_id):
        """Obtiene un rol por su UUID"""
        return Group.get_by_id(group_id)

    def update_group(self, group_id, **kwargs):
        """Actualiza campos de un rol"""
        group = Group.get_by_id(group_id)  # ✅ obtener el objeto existente
        if not group:
            return False, "Rol no encontrado"

        # Actualizar solo los campos que existan
        for key, value in kwargs.items():
            if hasattr(group, key):
                setattr(group, key, value)

        group.updated_at = datetime.utcnow()  # ⚠️ actualizar instancia, no clase
        success = group.update()  # ⚡ llamar al método de instancia
        return success, group if success else "Error actualizando rol"


    def delete_group(self, group_id):
        """Elimina un rol"""
        group = Group.get_by_id(group_id)
        if not group:
            return False, "Rol no encontrado"
        success = group.delete()  # ⚡ método de instancia
        return success, "Rol eliminado" if success else "Error eliminando rol"
