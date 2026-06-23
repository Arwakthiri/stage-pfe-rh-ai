from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from app.database import get_db
from app import models, schemas

load_dotenv()

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ─────────────────────────────────────────────
# Hachage des mots de passe
# ─────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    """Hache le mot de passe avec bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe en le comparant au hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ─────────────────────────────────────────────
# Génération des tokens JWT
# ─────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Crée un JWT refresh token (longue durée)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> schemas.TokenData:
    """Décode et valide un JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        return schemas.TokenData(user_id=int(user_id), email=email, role=role)
    except JWTError:
        raise credentials_exception


# ─────────────────────────────────────────────
# Dépendances FastAPI
# ─────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Récupère l'utilisateur connecté depuis le JWT token"""
    token_data = decode_token(token)
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé"
        )
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Vérifie que l'utilisateur est actif"""
    return current_user


# ─────────────────────────────────────────────
# Guards de rôles
# ─────────────────────────────────────────────
def require_role(*roles: models.UserRole):
    """Dépendance générique pour vérifier les rôles"""
    async def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès refusé. Rôle requis: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


async def require_admin(current_user: models.User = Depends(get_current_user)):
    """Seul l'Admin peut accéder"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user


async def require_rh_or_admin(current_user: models.User = Depends(get_current_user)):
    """RH ou Admin peuvent accéder"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RH]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux responsables RH et administrateurs"
        )
    return current_user
