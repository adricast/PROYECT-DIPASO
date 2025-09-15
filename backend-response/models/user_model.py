from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4
from data.conexion import get_connection

@dataclass
class User:
    user_id: str = field(default_factory=lambda: str(uuid4()))
    username: str = None
    password: str = None
    identification: str = None
    email: str = None
    isactive: bool = True
    
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    TABLE_NAME = "system_users"

    def save(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(f"""
                    INSERT INTO {self.TABLE_NAME} 
                    (user_id, username, password, identification, email, isactive, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (self.user_id, self.username, self.password, self.identification, self.email, self.isactive, self.created_at, self.updated_at))
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
                    SELECT user_id, username, password, identification, email, isactive, created_at, updated_at
                    FROM {cls.TABLE_NAME}
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
                    SET username=%s, password=%s, identification=%s, email=%s, isactive=%s, updated_at=%s
                    WHERE user_id=%s
                """, (self.username, self.password, self.identification, self.email, self.isactive, self.updated_at, self.user_id))
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