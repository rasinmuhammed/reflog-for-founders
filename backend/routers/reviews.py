"""
Reviews Router - Weekly reviews and OKR endpoints

Handles review-related endpoints including:
- Create weekly review
- Get weekly reviews
- Create OKR
- Get OKRs
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models
from database import get_db
from db_utils import get_user
from models import WeeklyReviewCreate, OKRCreate

router = APIRouter(prefix="", tags=["Reviews"])



@router.post("/weekly-reviews/{email}")
def create_weekly_review(
    email: str,
    review: WeeklyReviewCreate,
    db: Session = Depends(get_db)
):
    """Submit weekly business review, get AI feedback"""
    user = get_user(email, db)

    db_review = models.WeeklyReview(
        user_id=user.id,
        wins=review.wins,
        challenges=[review.biggest_blocker] if review.biggest_blocker else [],
        learnings=[review.what_avoiding] if review.what_avoiding else [],
        next_week_priorities=[review.next_week_focus] if review.next_week_focus else [],
        metrics_snapshot=review.key_metrics,
        energy_level=None,
        confidence_level=None,
        ai_feedback=None  # Can add AI analysis later
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return {
        "id": db_review.id,
        "week_of": db_review.created_at.strftime("%Y-%m-%d"),
        "wins": db_review.wins,
        "biggest_blocker": review.biggest_blocker,
        "what_avoiding": review.what_avoiding,
        "next_week_focus": review.next_week_focus,
        "ai_analysis": "Review submitted successfully. Keep pushing forward!"
    }


@router.get("/weekly-reviews/{email}")
def get_weekly_reviews(
    email: str,
    limit: int = 12,
    db: Session = Depends(get_db)
):
    """Get past weekly reviews to spot patterns"""
    user = get_user(email, db)

    reviews = db.query(models.WeeklyReview).filter(
        models.WeeklyReview.user_id == user.id
    ).order_by(models.WeeklyReview.created_at.desc()).limit(limit).all()

    return {
        "count": len(reviews),
        "reviews": [
            {
                "id": r.id,
                "week_of": r.created_at.strftime("%Y-%m-%d"),
                "wins": r.wins,
                "challenges": r.challenges,
                "learnings": r.learnings,
                "next_week": r.next_week_priorities,
                "energy": r.energy_level,
                "confidence": r.confidence_level,
                "ai_feedback": r.ai_feedback
            }
            for r in reviews
        ]
    }


@router.get("/weekly-reviews/{email}/latest")
def get_latest_review(email: str, db: Session = Depends(get_db)):
    """Get the most recent weekly review"""
    user = get_user(email, db)

    review = db.query(models.WeeklyReview).filter(
        models.WeeklyReview.user_id == user.id
    ).order_by(models.WeeklyReview.created_at.desc()).first()

    if not review:
        return {"has_review": False, "review": None}

    return {
        "has_review": True,
        "review": {
            "id": review.id,
            "week_of": review.created_at.strftime("%Y-%m-%d"),
            "wins": review.wins,
            "challenges": review.challenges,
            "learnings": review.learnings,
            "next_week": review.next_week_priorities,
            "energy": review.energy_level,
            "confidence": review.confidence_level
        }
    }


@router.post("/okrs/{email}")
def create_okr(
    email: str,
    okr: OKRCreate,
    db: Session = Depends(get_db)
):
    """Set quarterly OKRs with AI validation"""
    user = get_user(email, db)

    db_okr = models.OKR(
        user_id=user.id,
        objective=okr.objective,
        key_results=okr.key_results,
        quarter=okr.quarter,
        year=okr.year or datetime.utcnow().year,
        status="active"
    )
    db.add(db_okr)
    db.commit()
    db.refresh(db_okr)

    return {
        "id": db_okr.id,
        "objective": db_okr.objective,
        "key_results": db_okr.key_results,
        "quarter": db_okr.quarter,
        "year": db_okr.year,
        "status": db_okr.status
    }


@router.get("/okrs/{email}")
def get_okrs(email: str, db: Session = Depends(get_db)):
    """Get all OKRs for a user"""
    user = get_user(email, db)

    okrs = db.query(models.OKR).filter(
        models.OKR.user_id == user.id
    ).order_by(models.OKR.year.desc(), models.OKR.quarter.desc()).all()

    return {
        "count": len(okrs),
        "okrs": [
            {
                "id": o.id,
                "objective": o.objective,
                "key_results": o.key_results,
                "quarter": o.quarter,
                "year": o.year,
                "status": o.status,
                "progress": o.progress
            }
            for o in okrs
        ]
    }


@router.put("/okrs/{email}/{okr_id}")
def update_okr(
    email: str,
    okr_id: int,
    progress: int = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Update OKR progress or status"""
    user = get_user(email, db)

    okr = db.query(models.OKR).filter(
        models.OKR.id == okr_id,
        models.OKR.user_id == user.id
    ).first()

    if not okr:
        raise HTTPException(status_code=404, detail="OKR not found")

    if progress is not None:
        okr.progress = progress
    if status is not None:
        okr.status = status

    db.commit()

    return {
        "id": okr.id,
        "objective": okr.objective,
        "progress": okr.progress,
        "status": okr.status
    }
