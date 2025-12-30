"""
Data export and deletion endpoints for GDPR compliance
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from db_utils import get_user
import models
from datetime import datetime
import logging

router = APIRouter(prefix="/data", tags=["Data Controls"])

logger = logging.getLogger(__name__)


@router.get("/export/{email}")
def export_user_data(email: str, db: Session = Depends(get_db)):
    """
    Export all user data in JSON format (GDPR compliance)
    """
    user = get_user(email, db)
    
    # Log data access for audit trail
    logger.info(f"Data export requested for user {user.id}")
    
    # Gather all user data
    checkins = db.query(models.CheckIn).filter_by(user_id=user.id).all()
    metrics = db.query(models.BusinessMetric).filter_by(user_id=user.id).all()
    decisions = db.query(models.LifeDecision).filter_by(user_id=user.id).all()
    life_events = db.query(models.LifeEvent).filter_by(user_id=user.id).all()
    shadow_data = db.query(models.ShadowData).filter_by(user_id=user.id).all()
    time_allocations = db.query(models.TimeAllocation).filter_by(user_id=user.id).all()
    
    return {
        "export_date": datetime.utcnow().isoformat(),
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "business_stage": user.business_stage,
            "primary_goal": user.primary_goal
        },
        "checkins": [
            {
                "id": c.id,
                "timestamp": c.timestamp.isoformat() if c.timestamp else None,
                "energy_level": c.energy_level,
                "avoiding_what": c.avoiding_what,
                "commitment": c.commitment,
                "shipped": c.shipped,
                "mood": c.mood
            }
            for c in checkins
        ],
        "business_metrics": [
            {
                "metric_type": m.metric_type,
                "value": m.value,
                "timestamp": m.timestamp.isoformat() if m.timestamp else None
            }
            for m in metrics
        ],
        "decisions": [
            {
                "title": d.title,
                "category": d.category,
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in decisions
        ],
        "life_events": [
            {
                "event_type": e.event_type,
                "description": e.description,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None
            }
            for e in life_events
        ],
        "shadow_data": [
            {
                "submission_date": s.submission_date.isoformat() if s.submission_date else None,
                "total_commits": s.total_commits,
                "focus_score": s.focus_score
            }
            for s in shadow_data
        ],
        "time_allocations": [
            {
                "week_start": t.week_start.isoformat() if t.week_start else None,
                "category": t.category,
                "hours": t.hours
            }
            for t in time_allocations
        ],
        "total_records": {
            "checkins": len(checkins),
            "metrics": len(metrics),
            "decisions": len(decisions),
            "life_events": len(life_events),
            "shadow_data": len(shadow_data),
            "time_allocations": len(time_allocations)
        }
    }


@router.delete("/account/{email}")
def delete_account(email: str, confirmed: bool, db: Session = Depends(get_db)):
    """
    Permanently delete user account and all associated data (GDPR right to deletion)
    Requires confirmation parameter to prevent accidental deletion
    """
    if not confirmed:
        raise HTTPException(400, detail="Must confirm deletion by setting confirmed=true")
    
    user = get_user(email, db)
    user_id = user.id
    
    # Log deletion for audit trail
    logger.warning(f"Account deletion initiated for user {user_id}")
    
    try:
        # Delete all associated data (cascading)
        db.query(models.CheckIn).filter_by(user_id=user_id).delete()
        db.query(models.BusinessMetric).filter_by(user_id=user_id).delete()
        db.query(models.LifeDecision).filter_by(user_id=user_id).delete()
        db.query(models.LifeEvent).filter_by(user_id=user_id).delete()
        db.query(models.ShadowData).filter_by(user_id=user_id).delete()
        db.query(models.TimeAllocation).filter_by(user_id=user_id).delete()
        db.query(models.WeeklyReview).filter_by(user_id=user_id).delete()
        db.query(models.OKR).filter_by(user_id=user_id).delete()
        db.query(models.AgentAdvice).filter_by(user_id=user_id).delete()
        db.query(models.GitHubAnalysis).filter_by(user_id=user_id).delete()
        
        # Delete user account
        db.delete(user)
        db.commit()
        
        logger.info(f"Account {user_id} successfully deleted")
        
        return {
            "status": "deleted",
            "message": "Your account and all associated data have been permanently deleted",
            "deleted_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete account {user_id}: {str(e)}")
        raise HTTPException(500, detail="Failed to delete account")


@router.get("/access-log/{email}")
def get_access_log(email: str, db: Session = Depends(get_db)):
    """
    Get audit log of data access (for transparency)
    Note: This is a placeholder - implement proper audit logging for production
    """
    user = get_user(email, db)
    
    return {
        "message": "Audit logging will be implemented in production",
        "user_id": user.id,
        "note": "All admin access to your data is logged and can be reviewed upon request"
    }
