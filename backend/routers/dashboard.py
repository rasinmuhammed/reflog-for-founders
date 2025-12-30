"""
Dashboard Router - Dashboard and unified metrics endpoints

Handles all dashboard-related endpoints including:
- Main dashboard data
- Unified metrics (get/save)
- Founder score calculation
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from database import get_db
from db_utils import get_user
from schemas import UnifiedMetricsUpdate
from cache import cache_5min, invalidate_user_cache

router = APIRouter(prefix="", tags=["Dashboard"])



@router.get("/dashboard/{identifier}")
@cache_5min
def get_dashboard(identifier: str, db: Session = Depends(get_db)):
    """
    Get main dashboard data.
    Accepts either email or GitHub username as identifier.
    """
    user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user:
        user = db.query(models.User).filter(
            models.User.github_username == identifier
        ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get GitHub analysis
    github_analysis = None
    if user.github_username:
        github_analysis = db.query(models.GitHubAnalysis).filter(
            models.GitHubAnalysis.user_id == user.id
        ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()

    # Get recent check-ins
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()

    # Get latest advice
    latest_advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(3).all()

    # Get recent metrics
    recent_metrics = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id
    ).order_by(models.BusinessMetric.timestamp.desc()).limit(20).all()

    metrics_by_type = {}
    for metric in recent_metrics:
        if metric.metric_type not in metrics_by_type:
            metrics_by_type[metric.metric_type] = []
        metrics_by_type[metric.metric_type].append({
            "value": metric.value,
            "unit": metric.unit,
            "timestamp": metric.timestamp.isoformat()
        })

    total_checkins = len(checkins)
    commitments_kept = sum(1 for c in checkins if c.shipped == True)
    avg_energy = sum(c.energy_level for c in checkins) / total_checkins if total_checkins > 0 else 0

    return {
        "user": {
            "email": user.email,
            "username": user.github_username,
            "full_name": user.full_name,
            "member_since": user.created_at.strftime("%Y-%m-%d"),
            "business_stage": user.business_stage,
            "primary_goal": user.primary_goal,
            "check_in_frequency": user.check_in_frequency,
            "accountability_style": user.accountability_style
        },
        "github": {
            "connected": user.github_username is not None,
            "total_repos": github_analysis.total_repos if github_analysis else 0,
            "active_repos": github_analysis.active_repos if github_analysis else 0,
            "languages": github_analysis.languages if github_analysis else {},
            "patterns": github_analysis.patterns if github_analysis else []
        },
        "business_metrics": metrics_by_type,
        "stats": {
            "total_checkins": total_checkins,
            "commitments_kept": commitments_kept,
            "success_rate": (commitments_kept / total_checkins * 100) if total_checkins > 0 else 0,
            "avg_energy": round(avg_energy, 1),
            "current_streak": user.current_streak
        },
        "recent_advice": [
            {
                "id": a.id,
                "agent": a.agent_name,
                "advice": a.advice[:200] + "..." if len(a.advice) > 200 else a.advice,
                "date": a.created_at.strftime("%Y-%m-%d"),
                "type": a.interaction_type
            }
            for a in latest_advice
        ]
    }


@router.get("/metrics/{email}")
def get_unified_metrics(email: str, db: Session = Depends(get_db)):
    """Get all current metrics for the MetricsInput component"""
    user = get_user(email, db)

    metric_types = ['mrr', 'customers', 'activeUsers', 'runway', 'churnRate', 'salesCalls', 'meetingsBooked']
    current = {}

    for metric_type in metric_types:
        latest = db.query(models.BusinessMetric).filter(
            models.BusinessMetric.user_id == user.id,
            models.BusinessMetric.metric_type == metric_type
        ).order_by(models.BusinessMetric.timestamp.desc()).first()

        if latest:
            current[metric_type] = latest.value
        else:
            current[metric_type] = 0

    return current


@router.post("/metrics/{email}")
def save_unified_metrics(email: str, metrics: UnifiedMetricsUpdate, db: Session = Depends(get_db)):
    """Save all metrics at once from the MetricsInput component"""
    user = get_user(email, db)

    now = datetime.utcnow()
    metrics_data = metrics.model_dump()

    for metric_type, value in metrics_data.items():
        if value is not None and value != 0:
            db_metric = models.BusinessMetric(
                user_id=user.id,
                metric_type=metric_type,
                value=float(value),
                unit="",
                timestamp=now
            )
            db.add(db_metric)

    db.commit()
    return {"status": "saved", "metrics_count": len(metrics_data)}


@router.get("/founder-dashboard/{email}")
def get_founder_dashboard(email: str, db: Session = Depends(get_db)):
    """Return founder-specific dashboard data"""
    user = get_user(email, db)

    # Get check-ins for streak calculation
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(30).all()

    # Get recent decisions
    decisions = db.query(models.LifeDecision).filter(
        models.LifeDecision.user_id == user.id
    ).order_by(models.LifeDecision.created_at.desc()).limit(5).all()

    # Calculate stats
    total = len(checkins)
    shipped = sum(1 for c in checkins if c.shipped)
    ship_rate = (shipped / total * 100) if total > 0 else 0

    return {
        "user": {
            "email": user.email,
            "name": user.full_name or user.email.split("@")[0],
            "stage": user.business_stage,
            "goal": user.primary_goal
        },
        "stats": {
            "total_checkins": total,
            "shipped_count": shipped,
            "ship_rate": round(ship_rate, 1),
            "current_streak": user.current_streak
        },
        "recent_decisions": [
            {
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "status": d.status,
                "created_at": d.created_at.isoformat()
            }
            for d in decisions
        ]
    }


@router.get("/founder-score/{email}")
def get_founder_score(email: str, db: Session = Depends(get_db)):
    """Calculate and return the founder's composite health score"""
    user = get_user(email, db)

    # Get data for calculations
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).all()

    metrics = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id,
        models.BusinessMetric.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).all()

    # Execution Score (40% weight)
    total_checkins = len(checkins)
    shipped = sum(1 for c in checkins if c.shipped)
    execution_score = min(100, (shipped / max(total_checkins, 1)) * 100 + 20)

    # Consistency Score (30% weight)
    streak = user.current_streak or 0
    consistency_score = min(100, streak * 10 + 30)

    # Momentum Score (20% weight)
    recent_checkins = [c for c in checkins if c.timestamp >= datetime.utcnow() - timedelta(days=7)]
    momentum_score = min(100, len(recent_checkins) * 15 + 20)

    # Metrics Score (10% weight)
    metrics_score = min(100, len(set(m.metric_type for m in metrics)) * 15 + 25)

    # Calculate overall
    overall = int(
        execution_score * 0.4 +
        consistency_score * 0.3 +
        momentum_score * 0.2 +
        metrics_score * 0.1
    )

    # Generate insights
    insights = []
    if execution_score < 50:
        insights.append("Focus on following through on daily commitments")
    if consistency_score < 50:
        insights.append("Build a daily check-in habit to increase your streak")
    if momentum_score < 50:
        insights.append("Recent activity is low - recommit to daily progress")
    if metrics_score < 50:
        insights.append("Track more business metrics to get complete visibility")

    # Determine trend
    if recent_checkins and len(recent_checkins) >= 5:
        trend = "up"
    elif len(recent_checkins) <= 2:
        trend = "down"
    else:
        trend = "stable"

    return {
        "overall_score": overall,
        "execution_score": int(execution_score),
        "consistency_score": int(consistency_score),
        "momentum_score": int(momentum_score),
        "metrics_score": int(metrics_score),
        "insights": insights if insights else ["You're doing great! Keep up the momentum."],
        "trend": trend
    }
