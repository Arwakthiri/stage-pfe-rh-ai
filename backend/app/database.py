from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# ── Fix Windows Unicode bug with psycopg2 ──────────────────────────
# psycopg2 tente de lire C:\Users\<username>\pgpass.conf
# Si le chemin contient des caractères accentués (é, à…) → UnicodeDecodeError
# Solution : pointer vers NUL (fichier vide sur Windows)
os.environ.setdefault("PGPASSFILE", "NUL")
os.environ.setdefault("PGAPPNAME", "rh_platform")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:arwa1234@localhost:5432/pfedatabase")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
