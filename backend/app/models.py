import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    RH = "rh"
    EMPLOYE = "employe"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.EMPLOYE, nullable=False)
    department = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    refresh_token = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} - {self.role}>"
