"""
Shadow Mode Router - "The Roast" that exposes founder self-deception

Endpoints:
- POST /shadow/submit/{email} - Submit Local Truth Agent data
- GET /shadow/roast/{email} - Get "The Roast" - compare stated vs actual
- GET /shadow/insights/{email} - Get detailed work pattern analysis
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from pydantic import BaseModel
import models
from database import get_db
from db_utils import get_user
from encryption import decrypt_value, is_encrypted

router = APIRouter(prefix="/shadow", tags=["Shadow Mode"])


# Pydantic models
class ShadowDataSubmission(BaseModel):
    """Data submitted by Local Truth Agent - NO CODE, only metadata"""
    total_commits: int
    by_directory: Dict[str, int]  # {"frontend": 40, "backend": 10}
    by_file_type: Dict[str, int]  # {".css": 30, ".py": 20}
    commit_hours: Dict[int, int]  # {22: 15, 23: 12} - hour: count
    commit_days: Optional[Dict[str, int]] = None  # {"mon": 10, "tue": 8}
    date_range: Optional[Dict[str, str]] = None  # {"start": "2024-01-01", "end": "2024-01-30"}


class RoastResponse(BaseModel):
    roast: str
    stated_priority: Optional[str]
    actual_focus: str
    discrepancy_score: int
    focus_score: int
    truth_bombs: List[str]
    has_data: bool



def calculate_focus_score(by_directory: Dict[str, int]) -> float:
    """
    Calculate focus score (0-100)
    Higher = more focused on fewer directories
    Lower = scattered across many directories
    """
    if not by_directory:
        return 50.0

    total = sum(by_directory.values())
    if total == 0:
        return 50.0

    # Calculate concentration (Herfindahl index style)
    concentration = sum((count / total) ** 2 for count in by_directory.values())

    # Scale to 0-100 (1 directory = 100, many directories = lower)
    return round(concentration * 100, 1)


def determine_actual_focus(by_directory: Dict[str, int], by_file_type: Dict[str, int]) -> str:
    """Determine what the founder actually worked on"""
    if not by_directory:
        return "Unknown"

    # Get top directory
    top_dir = max(by_directory.items(), key=lambda x: x[1])
    dir_name = top_dir[0].lower()

    # Determine category
    if "frontend" in dir_name or "ui" in dir_name or "client" in dir_name:
        # Check file types
        css_commits = by_file_type.get(".css", 0) + by_file_type.get(".scss", 0)
        total = sum(by_file_type.values()) or 1
        if css_commits / total > 0.4:
            return "Frontend/Styling (pixel pushing)"
        return "Frontend Development"
    elif "backend" in dir_name or "api" in dir_name or "server" in dir_name:
        return "Backend Development"
    elif "test" in dir_name or "spec" in dir_name:
        return "Testing"
    elif "doc" in dir_name or "readme" in dir_name:
        return "Documentation"
    elif "config" in dir_name or "infra" in dir_name or "deploy" in dir_name:
        return "DevOps/Infrastructure"
    else:
        return f"{dir_name.capitalize()} work"


def generate_roast(
    stated_priority: str,
    actual_focus: str,
    by_directory: Dict[str, int],
    by_file_type: Dict[str, int],
    commit_hours: Dict[int, int],
    focus_score: float
) -> Dict:
    """
    Generate "The Roast" - expose the truth between what they SAY and DO

    This is the killer feature. Be brutal but fair.
    """
    # Calculate discrepancy
    priority_lower = stated_priority.lower() if stated_priority else ""
    actual_lower = actual_focus.lower()

    discrepancy_score = 0
    roast = ""
    truth_bombs = []

    # Check for priority vs actual mismatch
    priority_keywords = {
        "sales": ["backend", "api", "crm", "payment"],
        "revenue": ["backend", "api", "billing", "payment"],
        "product": ["frontend", "backend", "feature", "ui"],
        "growth": ["marketing", "analytics", "seo"],
        "technical": ["backend", "api", "infrastructure", "database"]
    }

    matched = False
    for priority_type, expected_dirs in priority_keywords.items():
        if priority_type in priority_lower:
            if not any(exp in actual_lower for exp in expected_dirs):
                discrepancy_score = 85
                matched = True
                break

    if not matched:
        # Check for common mismatches
        if "styling" in actual_lower or "css" in actual_lower:
            if "sales" in priority_lower or "revenue" in priority_lower:
                discrepancy_score = 90
                roast = (
                    f"You said you focused on {stated_priority}, but {sum(by_file_type.get('.css', 0) + by_file_type.get('.scss', 0))} "
                    f"of your commits were CSS changes. "
                    f"You are procrastinating with pixel pushing. Your customers don't care about border-radius."
                )
            else:
                discrepancy_score = 60
        else:
            discrepancy_score = max(0, 100 - focus_score)

    # Generate roast if not already set
    if not roast:
        total = sum(by_directory.values())
        top_dir = max(by_directory.items(), key=lambda x: x[1]) if by_directory else ("unknown", 0)
        top_pct = round((top_dir[1] / total * 100) if total > 0 else 0)

        if discrepancy_score > 70:
            roast = (
                f"You said your priority was '{stated_priority}', but {top_pct}% of your actual work was in {actual_focus}. "
                f"Your code tells a different story than your check-ins."
            )
        elif discrepancy_score > 40:
            roast = (
                f"There's a gap between your stated '{stated_priority}' focus and your actual work in {actual_focus}. "
                f"Not a lie, but not the full truth either."
            )
        else:
            roast = (
                f"Your work in {actual_focus} mostly aligns with your stated priority of '{stated_priority}'. "
                f"But don't get comfortable - consistency is what separates founders from dreamers."
            )

    # Generate truth bombs based on patterns
    if commit_hours:
        # Late night coding detection
        late_hours = sum(commit_hours.get(h, 0) for h in [22, 23, 0, 1, 2, 3])
        total_commits = sum(commit_hours.values())
        if total_commits > 0 and late_hours / total_commits > 0.4:
            peak_hour = max(commit_hours.items(), key=lambda x: x[1])[0]
            truth_bombs.append(
                f"You commit most between 10pm-3am. That's not hustle, that's unsustainable. "
                f"Peak hour: {peak_hour}:00."
            )

        # Weekend warrior detection
        if commit_hours.get(6, 0) + commit_hours.get(7, 0) > total_commits * 0.5:
            truth_bombs.append(
                "Half your commits are on weekends. Either you're burning out or procrastinating weekdays."
            )

    # Scattered focus detection
    if focus_score < 30:
        truth_bombs.append(
            f"Focus score: {focus_score}/100. You're spread across too many areas. "
            f"Pick one thing and finish it."
        )

    # File type insights
    if by_file_type:
        config_files = sum(by_file_type.get(ext, 0) for ext in [".json", ".yaml", ".toml", ".env"])
        if total > 0 and config_files / total > 0.3:
            truth_bombs.append(
                "You spend a lot of time in config files. Are you building or are you tinkering?"
            )

    # Add a default truth bomb if none generated
    if not truth_bombs:
        truth_bombs.append(
            "Your patterns look normal, but 'normal' doesn't build great companies. Push harder."
        )

    return {
        "roast": roast,
        "discrepancy_score": discrepancy_score,
        "truth_bombs": truth_bombs
    }


@router.post("/submit/{email}")
def submit_shadow_data(
    email: str,
    data: ShadowDataSubmission,
    db: Session = Depends(get_db)
):
    """
    Accept metadata from Local Truth Agent

    This endpoint receives ONLY metadata - never actual code.
    Privacy is maintained while still enabling brutally honest analysis.
    """
    user = get_user(email, db)

    # Get user's stated priority from their check-ins or goals
    stated_priority = user.primary_goal or "Not specified"

    # Calculate derived metrics
    focus_score = calculate_focus_score(data.by_directory)
    actual_focus = determine_actual_focus(data.by_directory, data.by_file_type)

    # Generate roast
    roast_result = generate_roast(
        stated_priority=stated_priority,
        actual_focus=actual_focus,
        by_directory=data.by_directory,
        by_file_type=data.by_file_type,
        commit_hours=data.commit_hours,
        focus_score=focus_score
    )

    # Store shadow data
    shadow = models.ShadowData(
        user_id=user.id,
        total_commits=data.total_commits,
        by_directory=data.by_directory,
        by_file_type=data.by_file_type,
        commit_hours=data.commit_hours,
        commit_days=data.commit_days,
        focus_score=focus_score,
        stated_priority=stated_priority,
        actual_focus=actual_focus,
        discrepancy_score=roast_result["discrepancy_score"],
        roast_text=roast_result["roast"],
        truth_bombs=roast_result["truth_bombs"]
    )
    db.add(shadow)
    db.commit()
    db.refresh(shadow)

    return {
        "id": shadow.id,
        "message": "Shadow data received. The truth has been recorded.",
        "roast_preview": roast_result["roast"][:100] + "...",
        "discrepancy_score": roast_result["discrepancy_score"]
    }


@router.get("/roast/{email}")
def get_roast(email: str, db: Session = Depends(get_db)):
    """
    Get "The Roast" - compare stated priorities vs actual work

    This is the killer feature. Shows founders their self-deception.
    """
    user = get_user(email, db)

    # Get latest shadow data
    shadow = db.query(models.ShadowData).filter(
        models.ShadowData.user_id == user.id
    ).order_by(models.ShadowData.submission_date.desc()).first()

    if not shadow:
        return {
            "has_data": False,
            "roast": "No shadow data yet. Run the Local Truth Agent to see your reality check.",
            "stated_priority": user.primary_goal,
            "actual_focus": None,
            "discrepancy_score": 0,
            "focus_score": 0,
            "truth_bombs": ["Download and run reflog-truth.py to see what you're really working on."]
        }

    return {
        "has_data": True,
        "roast": shadow.roast_text,
        "stated_priority": shadow.stated_priority,
        "actual_focus": shadow.actual_focus,
        "discrepancy_score": shadow.discrepancy_score,
        "focus_score": shadow.focus_score,
        "truth_bombs": shadow.truth_bombs or [],
        "last_updated": shadow.submission_date.isoformat()
    }


@router.get("/insights/{email}")
def get_shadow_insights(email: str, db: Session = Depends(get_db)):
    """Get detailed work pattern analysis"""
    user = get_user(email, db)

    # Get all shadow data for trends
    shadows = db.query(models.ShadowData).filter(
        models.ShadowData.user_id == user.id
    ).order_by(models.ShadowData.submission_date.desc()).limit(10).all()

    if not shadows:
        return {
            "has_data": False,
            "message": "No shadow data available. Run the Local Truth Agent first."
        }

    latest = shadows[0]

    # Calculate trends if multiple data points
    focus_trend = "stable"
    if len(shadows) >= 2:
        latest_focus = latest.focus_score or 0
        prev_focus = shadows[1].focus_score or 0
        if latest_focus > prev_focus + 10:
            focus_trend = "improving"
        elif latest_focus < prev_focus - 10:
            focus_trend = "declining"

    return {
        "has_data": True,
        "summary": {
            "total_commits": latest.total_commits,
            "focus_score": latest.focus_score,
            "focus_trend": focus_trend,
            "discrepancy_score": latest.discrepancy_score
        },
        "by_directory": latest.by_directory,
        "by_file_type": latest.by_file_type,
        "commit_hours": latest.commit_hours,
        "commit_days": latest.commit_days,
        "data_points": len(shadows),
        "last_updated": latest.submission_date.isoformat()
    }


@router.get("/history/{email}")
def get_shadow_history(
    email: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get historical shadow data submissions"""
    user = get_user(email, db)

    shadows = db.query(models.ShadowData).filter(
        models.ShadowData.user_id == user.id
    ).order_by(models.ShadowData.submission_date.desc()).limit(limit).all()

    return {
        "count": len(shadows),
        "history": [
            {
                "id": s.id,
                "date": s.submission_date.isoformat(),
                "total_commits": s.total_commits,
                "focus_score": s.focus_score,
                "discrepancy_score": s.discrepancy_score,
                "actual_focus": s.actual_focus
            }
            for s in shadows
        ]
    }
