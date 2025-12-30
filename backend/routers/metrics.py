"""
Metrics Router - Business metrics tracking endpoints

Handles metrics-related endpoints including:
- Add business metrics
- Get metric history
- Track business metrics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from database import get_db
from db_utils import get_user
from models import BusinessMetricCreate

router = APIRouter(prefix="", tags=["Metrics"])



@router.post("/business-metrics/{email}")
def add_business_metric(
    email: str,
    metric: BusinessMetricCreate,
    db: Session = Depends(get_db)
):
    """Log a business metric (revenue, users, MRR, etc.)"""
    user = get_user(email, db)

    db_metric = models.BusinessMetric(
        user_id=user.id,
        metric_type=metric.metric_type,
        value=metric.value,
        unit=metric.unit or "",
        notes=metric.notes,
        timestamp=datetime.utcnow()
    )
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)

    return {
        "id": db_metric.id,
        "metric_type": db_metric.metric_type,
        "value": db_metric.value,
        "unit": db_metric.unit,
        "timestamp": db_metric.timestamp.isoformat()
    }


@router.get("/business-metrics/{email}")
def get_business_metrics(
    email: str,
    days: int = 90,
    db: Session = Depends(get_db)
):
    """Get historical business metrics with trend analysis"""
    user = get_user(email, db)

    cutoff = datetime.utcnow() - timedelta(days=days)

    metrics = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id,
        models.BusinessMetric.timestamp >= cutoff
    ).order_by(models.BusinessMetric.timestamp.desc()).all()

    # Group by metric type
    by_type = {}
    for metric in metrics:
        m_type = metric.metric_type
        if m_type not in by_type:
            by_type[m_type] = []
        by_type[m_type].append({
            "id": metric.id,
            "value": metric.value,
            "unit": metric.unit,
            "notes": metric.notes,
            "timestamp": metric.timestamp.isoformat()
        })

    # Calculate trends for each type
    trends = {}
    for m_type, values in by_type.items():
        if len(values) >= 2:
            latest = values[0]["value"]
            oldest = values[-1]["value"]
            if oldest != 0:
                change = ((latest - oldest) / oldest) * 100
                trends[m_type] = {
                    "direction": "up" if change > 0 else "down",
                    "change_pct": round(abs(change), 1)
                }

    return {
        "period_days": days,
        "metrics": by_type,
        "trends": trends
    }


@router.post("/track-metric/{email}")
def track_business_metric(
    email: str,
    metric: BusinessMetricCreate,
    db: Session = Depends(get_db)
):
    """Track business metrics (alias endpoint)"""
    return add_business_metric(email, metric, db)


@router.get("/metric-history/{email}")
def get_metric_history(
    email: str,
    metric_type: str = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get business metric history with optional type filter"""
    user = get_user(email, db)

    cutoff = datetime.utcnow() - timedelta(days=days)

    query = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id,
        models.BusinessMetric.timestamp >= cutoff
    )

    if metric_type:
        query = query.filter(models.BusinessMetric.metric_type == metric_type)

    metrics = query.order_by(models.BusinessMetric.timestamp.desc()).all()

    return {
        "period_days": days,
        "metric_type": metric_type,
        "count": len(metrics),
        "metrics": [
            {
                "id": m.id,
                "type": m.metric_type,
                "value": m.value,
                "unit": m.unit,
                "notes": m.notes,
                "timestamp": m.timestamp.isoformat()
            }
            for m in metrics
        ]
    }


@router.get("/metric-summary/{email}")
def get_metric_summary(email: str, db: Session = Depends(get_db)):
    """Get summary of all current metric values"""
    user = get_user(email, db)

    # Get distinct metric types
    metric_types = db.query(models.BusinessMetric.metric_type).filter(
        models.BusinessMetric.user_id == user.id
    ).distinct().all()

    summary = {}
    for (m_type,) in metric_types:
        latest = db.query(models.BusinessMetric).filter(
            models.BusinessMetric.user_id == user.id,
            models.BusinessMetric.metric_type == m_type
        ).order_by(models.BusinessMetric.timestamp.desc()).first()

        if latest:
            summary[m_type] = {
                "value": latest.value,
                "unit": latest.unit,
                "last_updated": latest.timestamp.isoformat()
            }

    return {"metrics": summary}
