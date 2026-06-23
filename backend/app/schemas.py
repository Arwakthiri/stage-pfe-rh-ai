from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models import UserRole


# ─────────────────────────────────────────────
# Schemas pour l'inscription
# ─────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.EMPLOYE
    department: Optional[str] = None
    phone: Optional[str] = None


# ─────────────────────────────────────────────
# Schema pour la connexion (login)
# ─────────────────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ─────────────────────────────────────────────
# Schema de réponse utilisateur (sans password)
# ─────────────────────────────────────────────
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    department: Optional[str]
    phone: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Schema pour la mise à jour du profil
# ─────────────────────────────────────────────
class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    department: Optional[str] = None
    phone: Optional[str] = None


# ─────────────────────────────────────────────
# Schemas pour les tokens JWT
# ─────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


# ─────────────────────────────────────────────
# Schema pour le refresh token
# ─────────────────────────────────────────────
class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ─────────────────────────────────────────────
# Schema pour le changement de mot de passe
# ─────────────────────────────────────────────
class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# ─────────────────────────────────────────────
# Messages de réponse génériques
# ─────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str
    success: bool = True
