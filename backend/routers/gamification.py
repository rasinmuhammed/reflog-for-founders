from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import List, Dict
from pydantic import BaseModel
import math

router = APIRouter(
    prefix="/gamification",
    tags=["gamification"],
    responses={404: {"description": "Not found"}},
)

class GamificationStats(BaseModel):
    xp: int
    level: int
    current_streak: int
    longest_streak: int
    next_level_xp: int

class LeaderboardEntry(BaseModel):
    username: str
    xp: int
    level: int

@router.get("/stats/{email}", response_model=GamificationStats)
def get_user_stats(email: str, db: Session = Depends(get_db)):
    # Check if input is an ID (integer) or email
    if email.isdigit():
        user = db.query(models.User).filter(models.User.id == int(email)).first()
    else:
        user = db.query(models.User).filter(models.User.email == email).first()
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate XP needed for next level
    # Formula: Level = floor(sqrt(XP / 100)) + 1
    # Next Level XP = ((Level) ** 2) * 100
    next_level = user.level + 1
    next_level_xp = (next_level ** 2) * 100
    
    return GamificationStats(
        xp=user.xp,
        level=user.level,
        current_streak=user.current_streak,
        longest_streak=user.longest_streak,
        next_level_xp=next_level_xp
    )

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.xp.desc()).limit(limit).all()
    return [
        LeaderboardEntry(
            username=user.full_name or user.email.split('@')[0],
            xp=user.xp,
            level=user.level
        ) for user in users
    ]

def award_xp(user_id: int, amount: int, db: Session):
    """Internal utility to award XP and handle leveling up."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return
    
    user.xp += amount
    
    # Check for level up
    new_level = math.floor(math.sqrt(user.xp / 100)) + 1
    if new_level > user.level:
        user.level = new_level
        # TODO: Send notification for level up
        
    db.commit()
    db.refresh(user)
