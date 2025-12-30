"""
Analysis Router - GitHub and time analysis endpoints

Handles analysis-related endpoints including:
- GitHub profile analysis
- Time allocation analysis
- Weekly summaries
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from database import get_db
from db_utils import get_user
from integrations.github_client import GitHubClient

router = APIRouter(prefix="", tags=["Analysis"])

# Single instance for efficiency
github_client = GitHubClient()



@router.post("/analyze-github/{github_username}")
def analyze_github(
    github_username: str,
    email: str = None,
    db: Session = Depends(get_db)
):
    """Analyze GitHub profile with real data"""
    # Find user
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
    else:
        user = db.query(models.User).filter(
            models.User.github_username == github_username
        ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Update username if different
    if github_username and user.github_username != github_username:
        user.github_username = github_username
        db.commit()

    # Get real GitHub activity
    activity = github_client.get_founder_activity(github_username, days=30)

    # Store analysis
    existing_analysis = db.query(models.GitHubAnalysis).filter(
        models.GitHubAnalysis.user_id == user.id
    ).first()

    if existing_analysis:
        existing_analysis.total_repos = activity.get("repos_contributed", 0)
        existing_analysis.active_repos = activity.get("repos_contributed", 0)
        existing_analysis.patterns = {
            "commits": activity.get("commits", 0),
            "prs_merged": activity.get("prs_merged", 0),
            "impact_score": activity.get("impact_score", 0),
            "activity_level": activity.get("activity_level", "unknown")
        }
        existing_analysis.analyzed_at = datetime.utcnow()
    else:
        new_analysis = models.GitHubAnalysis(
            user_id=user.id,
            total_repos=activity.get("repos_contributed", 0),
            active_repos=activity.get("repos_contributed", 0),
            patterns={
                "commits": activity.get("commits", 0),
                "prs_merged": activity.get("prs_merged", 0),
                "impact_score": activity.get("impact_score", 0),
                "activity_level": activity.get("activity_level", "unknown")
            },
            languages={},
            analyzed_at=datetime.utcnow()
        )
        db.add(new_analysis)

    db.commit()

    return {
        "username": github_username,
        "activity": activity,
        "is_real_data": activity.get("is_real_data", False)
    }


@router.get("/github-analysis/{github_username}")
def get_github_analysis(github_username: str, db: Session = Depends(get_db)):
    """Get stored GitHub analysis for a user"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    analysis = db.query(models.GitHubAnalysis).filter(
        models.GitHubAnalysis.user_id == user.id
    ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found")

    return {
        "username": github_username,
        "total_repos": analysis.total_repos,
        "active_repos": analysis.active_repos,
        "patterns": analysis.patterns,
        "languages": analysis.languages,
        "analyzed_at": analysis.analyzed_at.isoformat()
    }


@router.get("/github-activity/{email}")
def get_github_activity(email: str, days: int = 7, db: Session = Depends(get_db)):
    """Get real-time GitHub activity for a user"""
    user = get_user(email, db)

    if not user.github_username:
        return {
            "connected": False,
            "activity": None,
            "message": "No GitHub username connected"
        }

    activity = github_client.get_founder_activity(user.github_username, days)

    return {
        "connected": True,
        "activity": activity,
        "is_real_data": activity.get("is_real_data", False)
    }


@router.get("/time-analysis/{email}")
def analyze_time_allocation(
    email: str,
    weeks: int = 4,
    db: Session = Depends(get_db)
):
    """AI analysis of time allocation vs. stated priorities"""
    user = get_user(email, db)

    cutoff = datetime.utcnow() - timedelta(weeks=weeks)

    allocations = db.query(models.TimeAllocation).filter(
        models.TimeAllocation.user_id == user.id,
        models.TimeAllocation.timestamp >= cutoff
    ).all()

    if not allocations:
        return {
            "has_data": False,
            "message": "No time allocation data found",
            "recommendation": "Start logging your daily time allocation to get insights"
        }

    # Aggregate time by category
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

    # Generate insights based on user's goal
    insights = []
    primary_goal = user.primary_goal or ""

    if "revenue" in primary_goal.lower() or "sales" in primary_goal.lower():
        sales_pct = category_pct.get("sales", 0) + category_pct.get("Sales/Revenue", 0)
        if sales_pct < 30:
            insights.append(
                f"Only {sales_pct}% of time on sales - consider increasing for revenue goals"
            )

    if "product" in primary_goal.lower():
        product_pct = category_pct.get("product", 0) + category_pct.get("Product/Building", 0)
        if product_pct < 40:
            insights.append(
                f"Product time is {product_pct}% - may need more focus for product goals"
            )

    return {
        "has_data": True,
        "period_weeks": weeks,
        "total_hours": round(total_hours, 1),
        "category_breakdown": category_pct,
        "category_hours": category_totals,
        "primary_goal": user.primary_goal,
        "insights": insights if insights else ["Time allocation looks balanced"]
    }
