from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime
from data.conexion import get_connection
from psycopg2.sql import SQL, Identifier

@dataclass
class Group:
    user_group_id: UUID = field(default_factory=uuid4)
    group_name: str = None
    description: str = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True
    created_by_user_id: int = None
    updated_by_user_id: int = None
    integration_code: str = None

    TABLE_NAME = "iam_user_groups"

    def to_dict(self):
        return {
            "user_group_id": str(self.user_group_id),
            "group_name": self.group_name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active,
            "created_by_user_id": self.created_by_user_id,
            "updated_by_user_id": self.updated_by_user_id,
            "integration_code": self.integration_code
        }

    # -------------------
    # Crear un grupo
    # -------------------
    def save(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                insert_query = SQL("""
                    INSERT INTO {table} 
                    (user_group_id, group_name, description, created_at, updated_at, is_active, created_by_user_id, updated_by_user_id, integration_code)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """).format(table=Identifier(self.TABLE_NAME))

                cur.execute(insert_query, (
                    str(self.user_group_id),
                    self.group_name,
                    self.description,
                    self.created_at,
                    self.updated_at,
                    self.is_active,
                    self.created_by_user_id,
                    self.updated_by_user_id,
                    self.integration_code
                ))

            conn.commit()
            return True
        except Exception as e:
            print("❌ Error guardando grupo:", e)
            return False
        finally:
            conn.close()

    # -------------------
    # Obtener todos los grupos
    # -------------------
    @classmethod
    def get_all(cls):
        conn = get_connection()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                select_query = SQL("SELECT * FROM {table};").format(table=Identifier(cls.TABLE_NAME))
                cur.execute(select_query)
                rows = cur.fetchall()
                return [
                    cls(
                        user_group_id=UUID(row["user_group_id"]),
                        group_name=row["group_name"],
                        description=row["description"],
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                        is_active=row["is_active"],
                        created_by_user_id=row["created_by_user_id"],
                        updated_by_user_id=row["updated_by_user_id"],
                        integration_code=row["integration_code"]
                    )
                    for row in rows
                ] if rows else []
        finally:
            conn.close()

    # -------------------
    # Obtener grupo por ID
    # -------------------
    @classmethod
    def get_by_id(cls, user_group_id: UUID):
        conn = get_connection()
        if not conn:
            return None
        try:
            with conn.cursor() as cur:
                select_query = SQL("SELECT * FROM {table} WHERE user_group_id=%s;").format(table=Identifier(cls.TABLE_NAME))
                cur.execute(select_query, (str(user_group_id),))
                row = cur.fetchone()
                if not row:
                    return None
                return cls(
                    user_group_id=UUID(row["user_group_id"]),
                    group_name=row["group_name"],
                    description=row["description"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    is_active=row["is_active"],
                    created_by_user_id=row["created_by_user_id"],
                    updated_by_user_id=row["updated_by_user_id"],
                    integration_code=row["integration_code"]
                )
        finally:
            conn.close()

    # -------------------
    # Actualizar grupo
    # -------------------
    def update(self):
        self.updated_at = datetime.utcnow()
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                update_query = SQL("""
                    UPDATE {table}
                    SET group_name=%s, description=%s, updated_at=%s, is_active=%s, updated_by_user_id=%s, integration_code=%s
                    WHERE user_group_id=%s;
                """).format(table=Identifier(self.TABLE_NAME))

                cur.execute(update_query, (
                    self.group_name,
                    self.description,
                    self.updated_at,
                    self.is_active,
                    self.updated_by_user_id,
                    self.integration_code,
                    str(self.user_group_id)
                ))

            conn.commit()
            return True
        except Exception as e:
            print("❌ Error actualizando grupo:", e)
            return False
        finally:
            conn.close()

    # -------------------
    # Eliminar grupo
    # -------------------
    def delete(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                delete_query = SQL("DELETE FROM {table} WHERE user_group_id=%s;").format(table=Identifier(self.TABLE_NAME))
                cur.execute(delete_query, (str(self.user_group_id),))
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error eliminando grupo:", e)
            return False
        finally:
            conn.close()
