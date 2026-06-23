from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from collections import defaultdict
import time

from app.database import get_db
from app import models, schemas
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    require_admin,
    require_rh_or_admin,
)

router = APIRouter(prefix="/api/auth", tags=["🔐 Authentication"])

# ─────────────────────────────────────────────────────────────
# Brute-force protection (in-memory rate limiter)
# En production → utiliser Redis
# ─────────────────────────────────────────────────────────────
_failed_attempts: dict = defaultdict(list)
MAX_ATTEMPTS = 5          # tentatives max
LOCKOUT_SECONDS = 300     # 5 minutes de blocage


def _check_rate_limit(ip: str):
    """Bloque une IP après trop de tentatives échouées"""
    now = time.time()
    attempts = _failed_attempts[ip]
    # Ne garder que les tentatives dans la fenêtre de blocage
    _failed_attempts[ip] = [t for t in attempts if now - t < LOCKOUT_SECONDS]

    if len(_failed_attempts[ip]) >= MAX_ATTEMPTS:
        remaining = int(LOCKOUT_SECONDS - (now - _failed_attempts[ip][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de tentatives échouées. Réessayez dans {remaining} secondes.",
            headers={"Retry-After": str(remaining)},
        )


def _register_failed_attempt(ip: str):
    _failed_attempts[ip].append(time.time())


def _clear_failed_attempts(ip: str):
    _failed_attempts.pop(ip, None)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    return forwarded.split(",")[0].strip() if forwarded else request.client.host


# ─────────────────────────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────────────────────────
@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inscription d'un nouvel utilisateur",
)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Crée un nouveau compte utilisateur.
    - Email unique obligatoire
    - Mot de passe haché avec bcrypt
    - Rôle par défaut : Employé
    """
    # Vérifier si l'email existe déjà
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email.lower()
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cet email existe déjà.",
        )

    # Créer l'utilisateur
    new_user = models.User(
        email=user_data.email.lower(),
        full_name=user_data.full_name.strip(),
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        department=user_data.department,
        phone=user_data.phone,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ─────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────
@router.post(
    "/login",
    response_model=schemas.Token,
    summary="Connexion et obtention des tokens JWT",
)
def login(
    credentials: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authentifie l'utilisateur et retourne :
    - access_token (30 min)
    - refresh_token (7 jours)
    - Infos utilisateur
    """
    ip = _get_client_ip(request)
    _check_rate_limit(ip)

    # Chercher l'utilisateur (email insensible à la casse)
    user = db.query(models.User).filter(
        models.User.email == credentials.email.lower()
    ).first()

    # Message générique pour éviter l'énumération des comptes
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email ou mot de passe incorrect.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user or not verify_password(credentials.password, user.hashed_password):
        _register_failed_attempt(ip)
        raise auth_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte a été désactivé. Contactez l'administrateur.",
        )

    # Login réussi → réinitialiser les tentatives
    _clear_failed_attempts(ip)

    # Données embarquées dans le token
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }

    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    # Sauvegarder le refresh token en base (rotation)
    user.refresh_token = refresh_token
    db.commit()
    db.refresh(user)

    return schemas.Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


# ─────────────────────────────────────────────────────────────
# POST /api/auth/refresh
# ─────────────────────────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=schemas.Token,
    summary="Renouveler l'access token via le refresh token",
)
def refresh_token(
    body: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Échange un refresh token valide contre un nouveau pair de tokens.
    Implémente la rotation des refresh tokens pour plus de sécurité.
    """
    invalid_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token invalide ou expiré.",
    )

    token_data = decode_token(body.refresh_token)

    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()

    if not user or not user.is_active:
        raise invalid_exc

    # Vérifier que le refresh token correspond bien à celui en base (rotation)
    if user.refresh_token != body.refresh_token:
        # Possible vol de token → invalider tout
        user.refresh_token = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalide. Veuillez vous reconnecter.",
        )

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }

    new_access_token = create_access_token(token_payload)
    new_refresh_token = create_refresh_token(token_payload)

    # Rotation : remplacer l'ancien refresh token
    user.refresh_token = new_refresh_token
    db.commit()
    db.refresh(user)

    return schemas.Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


# ─────────────────────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────────────────────
@router.post(
    "/logout",
    response_model=schemas.MessageResponse,
    summary="Déconnexion (invalide le refresh token)",
)
def logout(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Déconnecte l'utilisateur en supprimant son refresh token en base.
    L'access token reste valide jusqu'à expiration (30 min).
    """
    current_user.refresh_token = None
    db.commit()
    return schemas.MessageResponse(message="Déconnexion réussie.")


# ─────────────────────────────────────────────────────────────
# GET /api/auth/me
# ─────────────────────────────────────────────────────────────
@router.get(
    "/me",
    response_model=schemas.UserResponse,
    summary="Profil de l'utilisateur connecté",
)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Retourne les informations de l'utilisateur actuellement connecté."""
    return current_user


# ─────────────────────────────────────────────────────────────
# PUT /api/auth/me
# ─────────────────────────────────────────────────────────────
@router.put(
    "/me",
    response_model=schemas.UserResponse,
    summary="Mettre à jour son profil",
)
def update_me(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permet à l'utilisateur connecté de modifier son nom, département et téléphone."""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name.strip()
    if update_data.department is not None:
        current_user.department = update_data.department
    if update_data.phone is not None:
        current_user.phone = update_data.phone

    db.commit()
    db.refresh(current_user)
    return current_user


# ─────────────────────────────────────────────────────────────
# POST /api/auth/change-password
# ─────────────────────────────────────────────────────────────
@router.post(
    "/change-password",
    response_model=schemas.MessageResponse,
    summary="Changer son mot de passe",
)
def change_password(
    body: schemas.ChangePassword,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permet à l'utilisateur connecté de changer son mot de passe."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect.",
        )

    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit être différent de l'actuel.",
        )

    current_user.hashed_password = hash_password(body.new_password)
    current_user.refresh_token = None  # Forcer la reconnexion
    db.commit()

    return schemas.MessageResponse(
        message="Mot de passe modifié avec succès. Veuillez vous reconnecter."
    )


# ─────────────────────────────────────────────────────────────
# ADMIN — GET /api/auth/users
# ─────────────────────────────────────────────────────────────
@router.get(
    "/users",
    response_model=list[schemas.UserResponse],
    summary="[Admin] Liste de tous les utilisateurs",
)
def get_all_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Réservé aux administrateurs : liste tous les utilisateurs."""
    return db.query(models.User).all()


# ─────────────────────────────────────────────────────────────
# ADMIN — PUT /api/auth/users/{user_id}/toggle-active
# ─────────────────────────────────────────────────────────────
@router.put(
    "/users/{user_id}/toggle-active",
    response_model=schemas.MessageResponse,
    summary="[Admin] Activer/Désactiver un compte utilisateur",
)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Permet à l'admin d'activer ou désactiver un compte utilisateur."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas désactiver votre propre compte.",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable.",
        )

    user.is_active = not user.is_active
    if not user.is_active:
        user.refresh_token = None  # Invalider la session

    db.commit()
    state = "activé" if user.is_active else "désactivé"
    return schemas.MessageResponse(message=f"Compte {user.full_name} {state} avec succès.")


# ─────────────────────────────────────────────────────────────
# ADMIN — PUT /api/auth/users/{user_id}/role
# ─────────────────────────────────────────────────────────────
@router.put(
    "/users/{user_id}/role",
    response_model=schemas.UserResponse,
    summary="[Admin] Changer le rôle d'un utilisateur",
)
def change_user_role(
    user_id: int,
    new_role: models.UserRole,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Permet à l'admin de changer le rôle d'un utilisateur."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable.",
        )

    user.role = new_role
    user.refresh_token = None  # Forcer la reconnexion avec le nouveau rôle
    db.commit()
    db.refresh(user)
    return user
