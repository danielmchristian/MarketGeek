import psycopg2
from psycopg2 import sql, OperationalError

db_host = 'marketgeek-firstdb.cungswmsam1g.us-east-1.rds.amazonaws.com'
db_name = 'MGFirstDB'
db_user = 'adminMG'
db_password = 'adminPass'
# Postgres default port is 5432; 3030 is likely incorrect
port = 3030


def connect():
    try:
        conn = psycopg2.connect(
            host=db_host,
            dbname=db_name,
            user=db_user,
            password=db_password,
            port=port,
        )
        print("Connection successful to RDS database")
        return conn
    except OperationalError as e:
        print(f"Failed to connect to database: {e}")
        raise


def print_version():
    # Use context managers to ensure resources are cleaned up
    try:
        with connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                print(version)
    except Exception as e:
        print(f"Error querying database: {e}")


if __name__ == "__main__":
    print_version()