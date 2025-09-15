# src/models/user_model.py
from dataclasses import dataclass
from datetime import datetime
from uuid import uuid4
from data.conexion import get_connection

@dataclass
class User:
    user_id: str = None
    username: str = None
    password: str = None
    name: str = None
    group_id: str = None  # FK hacia grupos
    created_at: datetime = None
    updated_at: datetime = None

    TABLE_NAME = "system_users"

    def save(self):
        self.user_id = str(uuid4())
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(f"""
                    INSERT INTO {self.TABLE_NAME} 
                    (user_id, username, password, name, group_id, created_at, updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                """, (self.user_id, self.username, self.password, self.name, self.group_id, self.created_at, self.updated_at))
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error guardando usuario:", e)
            return False
        finally:
            conn.close()

    @classmethod
    def get_all(cls):
        conn = get_connection()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT u.*, r.group_id 
                    FROM {cls.TABLE_NAME} u
                    LEFT JOIN groups r ON u.group_id = r.group_id
                """)
                rows = cur.fetchall()
                return [cls(**row) for row in rows]
        finally:
            conn.close()

    @classmethod
    def get_by_id(cls, user_id):
        conn = get_connection()
        if not conn:
            return None
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {cls.TABLE_NAME} WHERE user_id=%s", (user_id,))
                row = cur.fetchone()
                return cls(**row) if row else None
        finally:
            conn.close()

    def update(self):
        self.updated_at = datetime.utcnow()
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(f"""
                    UPDATE {self.TABLE_NAME}
                    SET username=%s, password=%s, name=%s, group_id=%s, updated_at=%s
                    WHERE user_id=%s
                """, (self.username, self.password, self.name, self.group_id, self.updated_at, self.user_id))
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error actualizando usuario:", e)
            return False
        finally:
            conn.close()

    def delete(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {self.TABLE_NAME} WHERE user_id=%s", (self.user_id,))
            conn.commit()
            return True
        except Exception as e:
            print("❌ Error eliminando usuario:", e)
            return False
        finally:
            conn.close()
