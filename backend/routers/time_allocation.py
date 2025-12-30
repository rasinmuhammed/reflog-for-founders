"""
Time Allocation Router - Time tracking endpoints

Handles time allocation endpoints including:
- Get today's allocation
- Save time allocation
- Weekly time summary
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import models
from database import get_db
from db_utils import get_user
from schemas import TimeAllocationEntry

router = APIRouter(prefix="", tags=["Time Allocation"])



@router.get("/time-allocation/{email}/today")
def get_today_time_allocation(email: str, db: Session = Depends(get_db)):
    """Get today's time allocation entries"""
    user = get_user(email, db)

    today_start = datetime.combine(date.today(), datetime.min.time())

    allocations = db.query(models.TimeAllocation).filter(
        models.TimeAllocation.user_id == user.id,
        models.TimeAllocation.timestamp >= today_start
    ).all()

    # Convert to dictionary format
    entries = {}
    for alloc in allocations:
        entries[alloc.category] = alloc.hours

    return {
        "date": date.today().isoformat(),
        "entries": entries,
        "total_hours": sum(entries.values()) if entries else 0
    }


@router.post("/time-allocation/{email}/save")
def save_time_allocation(
    email: str,
    data: TimeAllocationEntry,
    db: Session = Depends(get_db)
):
    """Save time allocation for today"""
    user = get_user(email, db)

    today_start = datetime.combine(date.today(), datetime.min.time())
    now = datetime.utcnow()

    # Delete existing entries for today
    db.query(models.TimeAllocation).filter(
        models.TimeAllocation.user_id == user.id,
        models.TimeAllocation.timestamp >= today_start
    ).delete()

    # Create new entries
    for category, hours in data.entries.items():
        if hours and hours > 0:
            alloc = models.TimeAllocation(
                user_id=user.id,
                category=category,
                hours=float(hours),
                timestamp=now
            )
            db.add(alloc)

    db.commit()

    return {
        "status": "saved",
        "date": date.today().isoformat(),
        "entries_count": len(data.entries),
        "total_hours": sum(data.entries.values()) if data.entries else 0
    }


@router.get("/time-allocation/{email}/weekly")
def get_weekly_time_allocation(email: str, db: Session = Depends(get_db)):
    """Get weekly time allocation summary"""
    user = get_user(email, db)

    week_start = datetime.utcnow() - timedelta(days=7)

    allocations = db.query(models.TimeAllocation).filter(
        models.TimeAllocation.user_id == user.id,
        models.TimeAllocation.timestamp >= week_start
    ).all()

    # Aggregate by category
    category_totals = {}
    for alloc in allocations:
        cat = alloc.category
        if cat not in category_totals:
            category_totals[cat] = 0
        category_totals[cat] += alloc.hours or 0

    # Calculate percentages
    total_hours = sum(category_totals.values())
    category_pct = {
        cat: round((hours / total_hours * 100) if total_hours > 0 else 0, 1)
        for cat, hours in category_totals.items()
    }

    return {
        "period": "7 days",
        "total_hours": round(total_hours, 1),
        "by_category": category_totals,
        "percentages": category_pct
    }


@router.post("/log-time/{email}")
def log_time_allocation(
    email: str,
    category: str,
    hours: float,
    notes: str = None,
    db: Session = Depends(get_db)
):
    """Log time for a specific category"""
    user = get_user(email, db)

    alloc = models.TimeAllocation(
        user_id=user.id,
        category=category,
        hours=hours,
        notes=notes,
        timestamp=datetime.utcnow()
    )
    db.add(alloc)
    db.commit()

    return {
        "id": alloc.id,
        "category": alloc.category,
        "hours": alloc.hours,
        "timestamp": alloc.timestamp.isoformat()
    }
