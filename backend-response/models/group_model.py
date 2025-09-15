from dataclasses import dataclass
from uuid import UUID
from datetime import datetime
from data.conexion import get_connection
from psycopg2.sql import SQL, Identifier

@dataclass
class Group:
    group_id: UUID = None
    group_name: str = None
    description: str = None
    created_at: datetime = None
    updated_at: datetime = None

    TABLE_NAME = "groups"

    def to_dict(self):
        """Convierte la instancia en un diccionario, formateando UUID y datetime."""
        return {
            "group_id": str(self.group_id),
            "group_name": self.group_name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    # -------------------
    # Crear un rol
    # -------------------
# ... (código anterior) ...

    def save(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                insert_query = SQL("""
                    INSERT INTO {table} 
                    (group_id, created_at, updated_at, group_name, description)
                    VALUES (%s,%s,%s,%s,%s)
                """).format(table=Identifier(self.TABLE_NAME))
                
                # La corrección está aquí: convertir el UUID a string
                cur.execute(insert_query, (str(self.group_id), self.created_at, self.updated_at, self.group_name, self.description))
                
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error guardando rol:", e)
            return False
        finally:
            conn.close()

    # -------------------
    # Obtener todos los roles
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
                return [cls(**row) for row in rows]
        finally:
            conn.close()

    # -------------------
    # Obtener rol por ID
    # -------------------
    @classmethod
    def get_by_id(cls, groupid):
        conn = get_connection()
        if not conn:
            return None
        try:
            with conn.cursor() as cur:
                select_query = SQL("SELECT * FROM {table} WHERE group_id=%s;").format(table=Identifier(cls.TABLE_NAME))
                cur.execute(select_query, (groupid,))
                row = cur.fetchone()
                return cls(**row) if row else None
        finally:
            conn.close()

    # -------------------
    # Actualizar rol
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
                    SET updated_at=%s, group_name=%s, description=%s
                    WHERE group_id=%s;
                """).format(table=Identifier(self.TABLE_NAME))
                
                cur.execute(update_query, (self.updated_at, self.group_name, self.description, self.group_id))
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error actualizando rol:", e)
            return False
        finally:
            conn.close()

    # -------------------
    # Eliminar rol
    # -------------------
    def delete(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                delete_query = SQL("DELETE FROM {table} WHERE group_id=%s;").format(table=Identifier(self.TABLE_NAME))
                cur.execute(delete_query, (self.group_id,))
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error eliminando grupo de personas:", e)
            return False
        finally:
            conn.close()