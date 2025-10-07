import os
import psycopg2
from psycopg2 import OperationalError

DB_HOST = os.getenv("PGHOST", "marketgeek.cungswmsam1g.us-east-1.rds.amazonaws.com")
DB_NAME = os.getenv("PGDATABASE", "postgres")
DB_USER = os.getenv("PGUSER", "postgres")
DB_PASSWORD = os.getenv("PGPASSWORD", "b1sghFZH91ifMlzsKLIU")
DB_PORT = int(os.getenv("PGPORT", "5432"))

RDS_CA_PATH = os.getenv("RDS_CA_PATH")

def connect():
    params = {
        "host": DB_HOST,
        "dbname": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "port": DB_PORT,
        "sslmode": "require",
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

    try:
        conn = psycopg2.connect(**params)
        print("✅ Connection successful to RDS PostgreSQL")
        return conn
    except OperationalError as e:
        print("❌ Failed to connect to database.")
        print(f"Details: {e}")
        print(f"Tried host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} sslmode={params['sslmode']}")
        raise

def print_version():
    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()
                print("PostgreSQL version:", version[0])
    except Exception as e:
        print(f"Error querying database: {e}")

if __name__ == "__main__":
    print_version()
