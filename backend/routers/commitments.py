"""
Commitments Router - Daily commitment tracking endpoints

Handles commitment-focused endpoints including:
- Today's commitment
- Pending commitments
- Commitment review
- Commitment statistics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import models
from database import get_db
from models import CheckInUpdate

router = APIRouter(prefix="", tags=["Commitments"])


def get_user_by_email_lookup(email: str, db: Session):
    """Internal helper to find user by email."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User with email '{email}' not found."
        )
    return user


def calculate_streak(checkins: list) -> int:
    """Calculate current streak from checkins"""
    if not checkins:
        return 0

    streak = 0
    today = date.today()

    # Sort by date descending
    sorted_checkins = sorted(checkins, key=lambda x: x.timestamp, reverse=True)

    expected_date = today
    for checkin in sorted_checkins:
        checkin_date = checkin.timestamp.date()
        if checkin_date == expected_date and checkin.shipped:
            streak += 1
            expected_date -= timedelta(days=1)
        elif checkin_date < expected_date:
            break

    return streak


def calculate_streaks_detailed(checkins: list) -> dict:
    """Calculate both current and longest streak"""
    if not checkins:
        return {"current": 0, "longest": 0}

    current = calculate_streak(checkins)
    longest = current

    # Calculate longest historical streak
    sorted_checkins = sorted(checkins, key=lambda x: x.timestamp)
    temp_streak = 0
    prev_date = None

    for checkin in sorted_checkins:
        if checkin.shipped:
            checkin_date = checkin.timestamp.date()
            if prev_date is None or checkin_date == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            longest = max(longest, temp_streak)
            prev_date = checkin_date

    return {"current": current, "longest": longest}


def get_weekly_breakdown(checkins: list) -> dict:
    """Get breakdown by day of week"""
    breakdown = {
        "mon": 0, "tue": 0, "wed": 0,
        "thu": 0, "fri": 0, "sat": 0, "sun": 0
    }
    day_map = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    for checkin in checkins:
        if checkin.shipped:
            day_idx = checkin.timestamp.weekday()
            breakdown[day_map[day_idx]] += 1

    return breakdown


@router.get("/commitment/{email}/today")
def get_today_commitment(email: str, db: Session = Depends(get_db)):
    """Get today's commitment if exists"""
    user = get_user_by_email_lookup(email, db)

    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    commitment = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= today_start,
        models.CheckIn.timestamp <= today_end
    ).first()

    if not commitment:
        return {
            "has_commitment": False,
            "commitment": None,
            "can_create": True
        }

    return {
        "has_commitment": True,
        "commitment": {
            "id": commitment.id,
            "one_thing": commitment.one_thing,
            "energy_level": commitment.energy_level,
            "avoiding_task": commitment.avoiding_task,
            "shipped": commitment.shipped,
            "ship_note": commitment.ship_note,
            "timestamp": commitment.timestamp.isoformat()
        },
        "can_create": False
    }


@router.get("/commitment/{email}/pending")
def get_pending_commitments(email: str, db: Session = Depends(get_db)):
    """Get all unreviewed commitments"""
    user = get_user_by_email_lookup(email, db)

    pending = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.shipped == None
    ).order_by(models.CheckIn.timestamp.desc()).all()

    return {
        "count": len(pending),
        "commitments": [
            {
                "id": c.id,
                "one_thing": c.one_thing,
                "energy_level": c.energy_level,
                "timestamp": c.timestamp.isoformat(),
                "days_old": (datetime.utcnow() - c.timestamp).days
            }
            for c in pending
        ]
    }


@router.put("/commitment/{checkin_id}/review")
def review_commitment(
    checkin_id: int,
    review: CheckInUpdate,
    db: Session = Depends(get_db)
):
    """Mark commitment as shipped or failed with excuse"""
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.id == checkin_id
    ).first()

    if not checkin:
        raise HTTPException(status_code=404, detail="Commitment not found")

    checkin.shipped = review.shipped
    checkin.ship_note = review.ship_note

    # Update user streak
    user = db.query(models.User).filter(
        models.User.id == checkin.user_id
    ).first()

    if review.shipped:
        # Check if this continues a streak
        yesterday = datetime.utcnow() - timedelta(days=1)
        yesterday_checkin = db.query(models.CheckIn).filter(
            models.CheckIn.user_id == user.id,
            models.CheckIn.timestamp >= yesterday.replace(hour=0, minute=0, second=0),
            models.CheckIn.timestamp < yesterday.replace(hour=23, minute=59, second=59),
            models.CheckIn.shipped == True
        ).first()

        if yesterday_checkin or user.current_streak == 0:
            user.current_streak = (user.current_streak or 0) + 1
        else:
            user.current_streak = 1

        user.longest_streak = max(user.longest_streak or 0, user.current_streak)
    else:
        # Streak broken
        user.current_streak = 0

    db.commit()

    return {
        "id": checkin.id,
        "shipped": checkin.shipped,
        "ship_note": checkin.ship_note,
        "new_streak": user.current_streak
    }


@router.get("/commitment/{email}/stats")
def get_commitment_stats(
    email: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get commitment statistics"""
    user = get_user_by_email_lookup(email, db)

    cutoff = datetime.utcnow() - timedelta(days=days)

    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= cutoff
    ).order_by(models.CheckIn.timestamp.desc()).all()

    total = len(checkins)
    shipped = sum(1 for c in checkins if c.shipped == True)
    failed = sum(1 for c in checkins if c.shipped == False)
    pending = sum(1 for c in checkins if c.shipped is None)

    # Calculate energy average
    energy_values = [c.energy_level for c in checkins if c.energy_level]
    avg_energy = sum(energy_values) / len(energy_values) if energy_values else None

    streaks = calculate_streaks_detailed(checkins)
    weekly = get_weekly_breakdown(checkins)

    return {
        "period_days": days,
        "total_commitments": total,
        "shipped_count": shipped,
        "failed_count": failed,
        "pending_count": pending,
        "ship_rate": round((shipped / total * 100) if total > 0 else 0, 1),
        "current_streak": streaks["current"],
        "longest_streak": streaks["longest"],
        "weekly_breakdown": weekly,
        "avg_energy": round(avg_energy, 1) if avg_energy else None
    }


@router.get("/commitment/{email}/weekly-summary")
def get_weekly_summary(email: str, db: Session = Depends(get_db)):
    """Get week-by-week commitment summary with insights"""
    user = get_user_by_email_lookup(email, db)

    # Get last 8 weeks of data
    cutoff = datetime.utcnow() - timedelta(weeks=8)

    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= cutoff
    ).order_by(models.CheckIn.timestamp.desc()).all()

    # Group by week
    weeks = {}
    for checkin in checkins:
        week_start = checkin.timestamp - timedelta(days=checkin.timestamp.weekday())
        week_key = week_start.strftime("%Y-%m-%d")

        if week_key not in weeks:
            weeks[week_key] = {"total": 0, "shipped": 0, "energy_sum": 0}

        weeks[week_key]["total"] += 1
        if checkin.shipped:
            weeks[week_key]["shipped"] += 1
        if checkin.energy_level:
            weeks[week_key]["energy_sum"] += checkin.energy_level

    # Format output
    summary = []
    for week_key, data in sorted(weeks.items(), reverse=True):
        avg_energy = data["energy_sum"] / data["total"] if data["total"] > 0 else 0
        ship_rate = (data["shipped"] / data["total"] * 100) if data["total"] > 0 else 0

        summary.append({
            "week_start": week_key,
            "total": data["total"],
            "shipped": data["shipped"],
            "ship_rate": round(ship_rate, 1),
            "avg_energy": round(avg_energy, 1)
        })

    return {
        "weeks": summary,
        "total_weeks": len(summary)
    }
