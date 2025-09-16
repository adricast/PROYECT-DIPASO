# data/connection.py
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración de conexión
'''
DB_HOST = "192.168.53.110"
DB_PORT = "5432"
DB_NAME = "dipaso_db_point_of_sale_dev"
DB_USER = "developer"
DB_PASSWORD = "developer42"
'''

import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración de la base de datos en localhost
DB_HOST = "localhost"  # localhost
DB_PORT = "5432"
#DB_NAME = "dipasopwa"
#DB_USER = "postgres"
#DB_PASSWORD = "Adricast1127"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Adricast2711"

def get_connection():
    """
    Retorna una conexión a PostgreSQL.
    Cierra la conexión manualmente después de usarla.
    """
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            cursor_factory=RealDictCursor  # resultados como diccionario
        )
        return conn
    except Exception as e:
        print("❌ Error al conectar a PostgreSQL:", e)
        return None
