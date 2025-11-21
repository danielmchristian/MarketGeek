# Backend/fastapi_app/db.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1) Load values from Backend/.env
load_dotenv()

PGHOST = os.getenv("PGHOST")
PGDATABASE = os.getenv("PGDATABASE")
PGUSER = os.getenv("PGUSER")
PGPASSWORD = os.getenv("PGPASSWORD")
PGPORT = os.getenv("PGPORT", "5432")
SSLMODE = os.getenv("SSLMODE", "require")
RDS_CA_PATH = os.getenv("RDS_CA_PATH")  # optional

if not all([PGHOST, PGDATABASE, PGUSER, PGPASSWORD]):
    raise RuntimeError("Database environment variables are not fully set. Check your .env file.")

# 2) Build SQLAlchemy URL
base_url = f"postgresql+psycopg2://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}"

if RDS_CA_PATH:
    DATABASE_URL = f"{base_url}?sslmode={SSLMODE}&sslrootcert={RDS_CA_PATH}"
else:
    DATABASE_URL = f"{base_url}?sslmode={SSLMODE}"

# 3) Engine + session factory
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
