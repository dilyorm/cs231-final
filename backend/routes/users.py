from fastapi import APIRouter, HTTPException, Depends
from typing import List
import database as db
import auth as a
from models import UserResponse, UpdateRoleRequest

router = APIRouter(prefix="/users", tags=["users"])

VALID_ROLES = {"admin", "contributor", "viewer"}


@router.get("/", response_model=List[UserResponse])
def list_users(current: dict = Depends(a.require_admin)):
    return db.list_users()


@router.patch("/{user_id}/role", response_model=UserResponse)
def set_role(user_id: int, body: UpdateRoleRequest, current: dict = Depends(a.require_admin)):
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {', '.join(VALID_ROLES)}")
    if user_id == int(current["sub"]):
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user = db.update_user_role(user_id, body.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
def remove_user(user_id: int, current: dict = Depends(a.require_admin)):
    if user_id == int(current["sub"]):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if not db.delete_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
