import os
import psycopg2
from psycopg2 import OperationalError


# -------- Configuration (env-first, with sensible defaults) --------
DB_HOST = os.getenv("PGHOST", "marketgeek.cungswmsam1g.us-east-1.rds.amazonaws.com")
DB_NAME = os.getenv("PGDATABASE", "postgres")      # default RDS maintenance DB
DB_USER = os.getenv("PGUSER", "postgres")
DB_PASSWORD = os.getenv("PGPASSWORD", "")
DB_PORT = int(os.getenv("PGPORT", "5432"))

# SSL settings
SSL_MODE = os.getenv("SSLMODE", "require")         # require | verify-ca | verify-full | disable (not recommended)
RDS_CA_PATH = os.getenv("RDS_CA_PATH")             # e.g., "/certs/global-bundle.pem" if using verify-ca/full

# Connection behavior
CONNECT_TIMEOUT = int(os.getenv("PGCONNECT_TIMEOUT", "10"))  # seconds


def connect():
    """Create and return a psycopg2 connection to RDS."""
    params = {
        "host": DB_HOST,
        "dbname": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "port": DB_PORT,
        "sslmode": SSL_MODE,
        "connect_timeout": CONNECT_TIMEOUT,
        # Keepalives help avoid stale idle connections on some networks
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

    if RDS_CA_PATH:
        params["sslrootcert"] = RDS_CA_PATH  # needed for verify-ca / verify-full

    try:
        conn = psycopg2.connect(**params)
        print("✅ Connection successful to RDS PostgreSQL")
        return conn
    except OperationalError as e:
        print("❌ Failed to connect to database.")
        print(f"Details: {e}")
        print(
            f"Tried host={DB_HOST} port={DB_PORT} dbname={DB_NAME} "
            f"user={DB_USER} sslmode={SSL_MODE} "
            f"{'(with sslrootcert)' if RDS_CA_PATH else ''}"
        )
        raise


def print_version():
    """Fetch and print the PostgreSQL server version."""
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print("PostgreSQL version:", version[0])
    except Exception as e:
        print(f"Error querying database: {e}")


def smoke_test():
    """
    Create a tiny table (if not exists) and insert a timestamp row
    to verify read/write works. Safe to run repeatedly.
    """
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("CREATE TABLE IF NOT EXISTS ping (ts timestamptz DEFAULT now());")
            cur.execute("INSERT INTO ping DEFAULT VALUES RETURNING ts;")
            inserted = cur.fetchone()[0]
            conn.commit()
            print("Inserted row at:", inserted)

            cur.execute("SELECT count(*) FROM ping;")
            count = cur.fetchone()[0]
            print("Total rows in ping:", count)
    except Exception as e:
        print(f"Smoke test failed: {e}")


if __name__ == "__main__":
    # Select behavior with RUN_MODE env var: "version" (default) or "smoke"
    mode = os.getenv("RUN_MODE", "version").lower()
    if mode == "smoke":
        smoke_test()
    else:
        print_version()