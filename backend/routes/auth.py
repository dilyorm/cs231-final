from fastapi import APIRouter, HTTPException, Depends
import database as db
import auth as a
from models import RegisterRequest, LoginRequest, AuthResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest):
    if len(body.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed = a.hash_password(body.password)
    # All self-registrations are viewer; admin assigns contributor role
    user = db.create_user(body.username.strip(), hashed, role="viewer")
    if not user:
        raise HTTPException(status_code=409, detail="Username already taken")

    token = a.create_token(user["id"], user["username"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "created_at": user["created_at"],
        },
    }


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    user = db.get_user_by_username(body.username)
    if not user or not a.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = a.create_token(user["id"], user["username"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "created_at": user["created_at"],
        },
    }


@router.get("/me", response_model=UserResponse)
def me(current: dict = Depends(a.get_current_user)):
    user = db.get_user_by_id(int(current["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "created_at": user["created_at"],
    }
