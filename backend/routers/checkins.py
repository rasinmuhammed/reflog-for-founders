from routers.gamification import award_xp
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from models import CheckInCreate, CheckInResponse, CheckInUpdate
from typing import List

router = APIRouter(prefix="/checkins", tags=["checkins"])


def get_user_by_email_lookup(email: str, db: Session):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email '{email}' not found.")
    return user


@router.get("/{email}", response_model=List[CheckInResponse])
def get_checkins(email: str, limit: int = 30, db: Session = Depends(get_db)):
    user = get_user_by_email_lookup(email, db)
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(limit).all()
    return checkins


@router.post("/", response_model=CheckInResponse)
def create_checkin(
    email: str,
    checkin: CheckInCreate,
    db: Session = Depends(get_db)
):
    user = get_user_by_email_lookup(email, db)

    # Streak Logic
    now = datetime.utcnow()
    today = now.date()
    last_checkin = user.last_checkin_date.date() if user.last_checkin_date else None

    if last_checkin != today:
        if last_checkin == today - timedelta(days=1):
            user.current_streak += 1
        else:
            user.current_streak = 1

        if user.current_streak > user.longest_streak:
            user.longest_streak = user.current_streak

        user.last_checkin_date = now

        # Award XP
        xp_gain = 10
        if user.current_streak > 1:
            xp_gain += 5
        award_xp(user.id, xp_gain, db)

    # Placeholder for AI logic
    analysis_text = "AI Analysis pending..."

    new_checkin = models.CheckIn(
        user_id=user.id,
        energy_level=checkin.energy_level,
        avoiding_what=checkin.avoiding_what,
        commitment=checkin.commitment,
        mood=checkin.mood,
        revenue_update=checkin.revenue_update,
        customer_wins=checkin.customer_wins,
        blockers=checkin.blockers,
        ai_analysis=analysis_text,
        timestamp=now
    )
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)

    return new_checkin
