# data/systemUser_model.py
from data.conexion import get_connection
from datetime import datetime

class SystemUser:
    def __init__(self, ser_id=None, user_name=None, identification=None, email=None,
                 password_hash=None, role_id=None, is_active=True,
                 created_at=None, updated_at=None):
        self.ser_id = ser_id
        self.user_name = user_name
        self.identification = identification
        self.email = email
        self.password_hash = password_hash
        self.role_id = role_id
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    # -------------------------------
    # Crear usuario
    # -------------------------------
    def save(self):
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO system_users 
                    (user_name, identification, email, password_hash, role_id, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING ser_id
                """, (
                    self.user_name,
                    self.identification,
                    self.email,
                    self.password_hash,
                    self.role_id,
                    self.is_active,
                    self.created_at,
                    self.updated_at
                ))
                self.ser_id = cur.fetchone()["ser_id"]
                conn.commit()
            return True
        except Exception as e:
            print("Error guardando usuario:", e)
            return False
        finally:
            conn.close()

    # -------------------------------
    # Actualizar usuario
    # -------------------------------
    def update(self):
        if not self.ser_id:
            return False
        self.updated_at = datetime.utcnow()
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE system_users
                    SET user_name=%s, identification=%s, email=%s,
                        password_hash=%s, role_id=%s, is_active=%s, updated_at=%s
                    WHERE ser_id=%s
                """, (
                    self.user_name,
                    self.identification,
                    self.email,
                    self.password_hash,
                    self.role_id,
                    self.is_active,
                    self.updated_at,
                    self.ser_id
                ))
                conn.commit()
            return True
        except Exception as e:
            print("Error actualizando usuario:", e)
            return False
        finally:
            conn.close()

    # -------------------------------
    # Eliminar usuario
    # -------------------------------
    def delete(self):
        if not self.ser_id:
            return False
        conn = get_connection()
        if not conn:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM system_users WHERE ser_id=%s", (self.ser_id,))
                conn.commit()
            return True
        except Exception as e:
            print("Error eliminando usuario:", e)
            return False
        finally:
            conn.close()

    # -------------------------------
    # Obtener usuario por ID
    # -------------------------------
    @classmethod
    def get_by_id(cls, user_id):
        conn = get_connection()
        if not conn:
            return None
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM system_users WHERE ser_id=%s", (user_id,))
                row = cur.fetchone()
                if row:
                    return cls(**row)
                return None
        except Exception as e:
            print("Error obteniendo usuario:", e)
            return None
        finally:
            conn.close()

    # -------------------------------
    # Obtener todos los usuarios
    # -------------------------------
    @classmethod
    def get_all(cls):
        conn = get_connection()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM system_users ORDER BY ser_id")
                rows = cur.fetchall()
                return [cls(**r) for r in rows]
        except Exception as e:
            print("Error obteniendo todos los usuarios:", e)
            return []
        finally:
            conn.close()
