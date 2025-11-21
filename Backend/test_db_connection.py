# Backend/test_db_connection.py
from fastapi_app.db import engine

def main():
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1;")
            print("DB test OK, result:", list(result))
    except Exception as e:
        print("DB test FAILED:", e)

if __name__ == "__main__":
    main()
