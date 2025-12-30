"""
Database utility functions for user operations.
Production-grade, enterprise patterns.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from pydantic import EmailStr
import models
from encryption import decrypt_value, is_encrypted


def get_user(email: str, db: Session) -> models.User:
    """Get user by email or raise 404"""
    user = db.query(models.User).filter_by(email=email).first()
    if not user:
        raise HTTPException(404, detail="User not found")
    return user


def get_user_api_key(user_id: int, db: Session) -> str:
    """Get decrypted Groq API key for user"""
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user or not user.groq_api_key:
        raise HTTPException(400, detail="API key not configured")
    
    # Decrypt if encrypted
    if is_encrypted(user.groq_api_key):
        return decrypt_value(user.groq_api_key)
    return user.groq_api_key


def create_user(email: EmailStr, db: Session, **kwargs) -> models.User:
    """Create new user with validation"""
    existing = db.query(models.User).filter_by(email=email).first()
    if existing:
        raise HTTPException(409, detail="User already exists")
    
    user = models.User(email=email, **kwargs)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
