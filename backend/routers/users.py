from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from models import UserCreate, UserResponse, OnboardingData
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create or update user - email-based"""
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if db_user:
        if user.full_name and db_user.full_name != user.full_name:
            db_user.full_name = user.full_name
        if user.github_username and db_user.github_username != user.github_username:
            db_user.github_username = user.github_username
        db.commit()
        db.refresh(db_user)
        return db_user
    
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        github_username=user.github_username,
        onboarding_complete=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/by-email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email '{email}' not found.")
    return user

@router.post("/onboard", response_model=UserResponse)
def complete_onboarding(
    onboarding: OnboardingData,
    email: str,
    full_name: str = None,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        user = models.User(
            email=email,
            full_name=full_name,
            github_username=onboarding.github_username
        )
        db.add(user)
        db.flush()
    
    user.business_stage = onboarding.business_stage
    user.primary_goal = onboarding.primary_goal
    user.check_in_frequency = onboarding.check_in_frequency
    user.accountability_style = onboarding.accountability_style
    user.key_metrics = {
        "metrics": onboarding.key_metrics,
        "configured_at": datetime.now().isoformat()
    }
    user.work_preferences = {
        "biggest_challenge": onboarding.biggest_challenge,
        "work_style": onboarding.work_style
    }
    user.onboarding_complete = True
    
    if onboarding.github_username:
        user.github_username = onboarding.github_username
    
    db.commit()
    db.refresh(user)
    return user
