from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import sys
import os

load_dotenv()

# Force UTF-8 sur Windows pour eviter UnicodeEncodeError
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from app.database import engine, Base
from app.auth import router as auth_router
import asyncio


# ─────────────────────────────────────────────
# Creation des tables au demarrage
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("[OK] Base de donnees initialisee avec succes")
    
    # Seeding automatique de l'administrateur
    try:
        from app.database import SessionLocal
        from app import models
        from app.security import hash_password
        db = SessionLocal()
        admin_user = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).first()
        if not admin_user:
            admin_email = os.getenv("ADMIN_EMAIL", "admin@segula.com")
            admin_password = os.getenv("ADMIN_PASSWORD", "adminpassword123")
            hashed_pw = hash_password(admin_password)
            new_admin = models.User(
                email=admin_email.lower(),
                full_name="Administrateur Segula",
                hashed_password=hashed_pw,
                role=models.UserRole.ADMIN,
                department="Direction",
                phone="+21600000000",
                is_active=True,
                is_verified=True,
            )
            db.add(new_admin)
            db.commit()
            print(f"[OK] Compte administrateur cree par defaut : {admin_email}")
        else:
            print(f"[OK] Compte administrateur existant : {admin_user.email}")
        db.close()
    except Exception as e:
        print(f"[ERR] Echec de l'initialisation de l'administrateur: {e}")
    
    # Ingestion asynchrone des documents RAG pour ne pas bloquer le démarrage
    from app.rag import ingest_documents
    async def run_ingestion():
        try:
            await asyncio.to_thread(ingest_documents)
        except Exception as e:
            print(f"[RAG ERR] Échec de l'ingestion de démarrage: {e}")
            
    asyncio.create_task(run_ingestion())
    
    yield
    print("[STOP] Serveur arrete")


# ─────────────────────────────────────────────
# Application FastAPI
# ─────────────────────────────────────────────
app = FastAPI(
    title="Plateforme Arwa RH Intelligente - API",
    description="""
## API Backend - Systeme d'Authentification Securise

### Fonctionnalites
- Inscription avec validation des donnees
- Connexion avec JWT (Access Token 30min + Refresh Token 7j)
- Protection brute-force (blocage IP apres 5 tentatives)
- Rotation des refresh tokens
- Gestion des roles : Admin / RH / Employe
- Changement de mot de passe securise
- Deconnexion propre (invalidation du token)

### Roles disponibles
| Role     | Description                              |
|----------|------------------------------------------|
| admin    | Acces total, gestion des utilisateurs    |
| rh       | Dashboard RH, alertes, analyses IA       |
| employe  | Chatbot, enquetes, formations            |
    """,
    version=os.getenv("APP_VERSION", "1.0.0"),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────
# Middlewares
# ─────────────────────────────────────────────

# CORS - Autoriser le frontend React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev
        "http://localhost:5173",   # Vite dev
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ─────────────────────────────────────────────
# Routeurs
# ─────────────────────────────────────────────
app.include_router(auth_router)

# Enregistrement des routeurs Chatbot et Analytics
from app.chat import router as chat_router
from app.analytics import router as analytics_router
app.include_router(chat_router)
app.include_router(analytics_router)


# ─────────────────────────────────────────────
# Routes de base
# ─────────────────────────────────────────────
@app.get("/", tags=["Accueil"], summary="Verification que l'API est en ligne")
def root():
    return {
        "status": "API en ligne",
        "app": os.getenv("APP_NAME", "RH Platform IA"),
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "docs": "/docs",
    }


@app.get("/health", tags=["Accueil"], summary="Health check")
def health_check():
    return {"status": "healthy"}
