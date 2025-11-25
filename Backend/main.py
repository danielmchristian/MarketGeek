from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any
import os

from authentication import create_access_token, get_current_user_id, verify_password

app = FastAPI()

# --- CORS Configuration ---
# Allow your React frontend (e.g., running on port 3000) to talk to the backend.
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev server
    "*"  # Allow all origins in production (configure properly for security)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount Static Files (React Frontend) ---
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

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

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "MarketGeek API is running"}

# --- Authentication Endpoint ---
@app.post("/api/token", response_model=Token)
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
@app.get("/api/protected_data")
async def read_protected_data(user_id: int = Depends(get_current_user_id)) -> Dict[str, Any]:
    """A route only accessible with a valid JWT."""
    return {"message": "Welcome to the protected area!", "user_id": user_id}

# --- Serve React Frontend (Catch-all route - must be last) ---
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Don't serve frontend for API routes
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Serve the React app
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    else:
        return {"message": "Frontend not available", "note": "Run with Docker to serve frontend"}

# Run the app with: uvicorn main:app --reload