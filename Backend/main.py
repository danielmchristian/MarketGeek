from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Dict, Any

from authentication import create_access_token, get_current_user_id, verify_password

app = FastAPI()

# --- CORS Configuration ---
# Allow your React frontend (e.g., running on port 3000) to talk to the backend.
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dummy Database and User Schema (Replace with real DB in production) ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# A dummy user store for demonstration
DUMMY_USERS = {
    "testuser": {
        "user_id": 1,
        "email": "test@example.com",
        # Hashed password for "password123"
        "hashed_password": "$2b$12$KjSjR7iW8x9J4oYnL8yB5e.3F3A4.V4C6R5K8J0D9G2P1H5X7Y0W2Q5T1"
    }
}

# --- Authentication Endpoint ---
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = DUMMY_USERS.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create the token payload with the user's ID
    access_token = create_access_token(data={"user_id": user["user_id"]})
    return {"access_token": access_token}

# --- Protected Endpoint ---
@app.get("/protected_data")
async def read_protected_data(user_id: int = Depends(get_current_user_id)) -> Dict[str, Any]:
    """A route only accessible with a valid JWT."""
    return {"message": "Welcome to the protected area!", "user_id": user_id}

# Run the app with: uvicorn main:app --reload