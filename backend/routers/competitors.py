"""
Competitor Intelligence API Router

Endpoints for managing competitor tracking and retrieving AI-generated intelligence.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from db_utils import get_user
import models
from typing import List, Dict, Optional
from services.competitor_intel_crew import CompetitorIntelligenceCrew
from datetime import datetime, timedelta
from pydantic import BaseModel


router = APIRouter(tags=["Competitor Intelligence"])


# ==============================================================================
# Request/Response Models
# ==============================================================================

class CompetitorCreate(BaseModel):
    name: str
    website: str
    category: str = "General"
    notes: Optional[str] = None
    product_hunt_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    blog_rss: Optional[str] = None


class CompetitorResponse(BaseModel):
    id: int
    name: str
    website: str
    category: str
    is_active: bool
    last_checked: Optional[datetime]
    added_at: datetime
    
    class Config:
        from_attributes = True


class IntelligenceReport(BaseModel):
    competitor: str
    category: str
    threat_level: str
    brief: str
    actions: List[str]
    last_updated: datetime


# ==============================================================================
# Endpoints
# ==============================================================================

@router.post("/competitors/add/{email}", response_model=CompetitorResponse)
async def add_competitor(
    email: str,
    competitor_data: CompetitorCreate,
    db: Session = Depends(get_db)
):
    """
    Add a competitor to track for strategic intelligence.
    
    The system will periodically gather public data from:
    - Product Hunt (launches, updates, comments)
    - Twitter (if handle provided)
    - Blog RSS feed (if provided)
    - Hacker News discussions
    
    All data sources are public and comply with platform ToS.
    """
    user = get_user(email, db)
    
    # Check if competitor already exists
    existing = db.query(models.Competitor).filter(
        models.Competitor.user_id == user.id,
        models.Competitor.name == competitor_data.name
    ).first()
    
    if existing:
        raise HTTPException(400, f"You're already tracking {competitor_data.name}")
    
    competitor = models.Competitor(
        user_id=user.id,
        name=competitor_data.name,
        website=competitor_data.website,
        product_hunt_url=competitor_data.product_hunt_url,
        twitter_handle=competitor_data.twitter_handle,
        blog_rss=competitor_data.blog_rss,
        category=competitor_data.category,
        notes=competitor_data.notes
    )
    
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    
    return competitor


@router.get("/competitors/list/{email}", response_model=List[CompetitorResponse])
async def list_competitors(
    email: str,
    db: Session = Depends(get_db)
):
    """Get all competitors being tracked by this user"""
    user = get_user(email, db)
    
    competitors = db.query(models.Competitor).filter(
        models.Competitor.user_id == user.id,
        models.Competitor.is_active == True
    ).order_by(models.Competitor.added_at.desc()).all()
    
    return competitors


@router.get("/competitors/intel/{email}", response_model=List[IntelligenceReport])
async def get_competitor_intelligence(
    email: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get latest competitive intelligence reports.
    
    Args:
        email: User email
        days: Number of days of history to include (default: 7)
    
    Returns:
        List of intelligence reports ordered by threat level (critical first)
    """
    user = get_user(email, db)
    
    # Get all active competitors
    competitors = db.query(models.Competitor).filter(
        models.Competitor.user_id == user.id,
        models.Competitor.is_active == True
    ).all()
    
    # Get latest intel for each competitor
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    intel_reports = []
    
    for comp in competitors:
        latest = db.query(models.CompetitorIntel).filter(
            models.CompetitorIntel.competitor_id == comp.id,
            models.CompetitorIntel.report_date >= cutoff_date
        ).order_by(models.CompetitorIntel.report_date.desc()).first()
        
        if latest:
            intel_reports.append(IntelligenceReport(
                competitor=comp.name,
                category=comp.category,
                threat_level=latest.threat_level,
                brief=latest.competitive_brief,
                actions=latest.recommended_actions or [],
                last_updated=latest.report_date
            ))
    
    # Sort by threat level (critical > high > medium > low)
    threat_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    intel_reports.sort(key=lambda x: threat_order.get(x.threat_level, 999))
    
    return intel_reports


@router.post("/competitors/research/{competitor_id}")
async def trigger_research(
    competitor_id: int,
    db: Session = Depends(get_db)
):
    """
    Manually trigger intelligence gathering for a specific competitor.
    
    This will deploy the Intelligence Crew:
    1. Scout Agent: Gather public data
    2. Analyst Agent: Detect changes
    3. Strategist Agent: Synthesize brief
    
    Note: Requires user to have Groq API key configured.
    """
    competitor = db.query(models.Competitor).filter(
        models.Competitor.id == competitor_id
    ).first()
    
    if not competitor:
        raise HTTPException(404, "Competitor not found")
    
    # Get user's API key
    user = db.query(models.User).filter(
        models.User.id == competitor.user_id
    ).first()
    
    if not user.groq_api_key:
        raise HTTPException(
            400,
            "Groq API key required. Please add your API key in Settings."
        )
    
    # Get previous intel for comparison
    previous = db.query(models.CompetitorIntel).filter(
        models.CompetitorIntel.competitor_id == competitor_id
    ).order_by(models.CompetitorIntel.report_date.desc()).first()
    
    # Run intelligence crew
    try:
        crew = CompetitorIntelligenceCrew(user.groq_api_key)
        
        result = crew.research_competitor(
            competitor={
                "name": competitor.name,
                "website": competitor.website,
                "product_hunt_url": competitor.product_hunt_url,
                "twitter_handle": competitor.twitter_handle,
                "blog_rss": competitor.blog_rss,
                "category": competitor.category
            },
            previous_intel=previous.competitive_brief if previous else None
        )
    except Exception as e:
        raise HTTPException(500, f"Intelligence gathering failed: {str(e)}")
    
    # Store intel report
    intel = models.CompetitorIntel(
        competitor_id=competitor_id,
        competitive_brief=result["competitive_brief"],
        threat_level=result["threat_level"],
        recommended_actions=result["recommended_actions"]
    )
    
    db.add(intel)
    
    # Update last_checked timestamp
    competitor.last_checked = datetime.utcnow()
    
    db.commit()
    db.refresh(intel)
    
    return {
        "competitor": competitor.name,
        "threat_level": result["threat_level"],
        "brief": result["competitive_brief"],
        "actions": result["recommended_actions"],
        "timestamp": result["timestamp"]
    }


@router.delete("/competitors/{competitor_id}")
async def remove_competitor(
    competitor_id: int,
    db: Session = Depends(get_db)
):
    """Stop tracking a competitor (soft delete)"""
    competitor = db.query(models.Competitor).filter(
        models.Competitor.id == competitor_id
    ).first()
    
    if not competitor:
        raise HTTPException(404, "Competitor not found")
    
    # Soft delete - set is_active to False
    competitor.is_active = False
    db.commit()
    
    return {"message": f"Stopped tracking {competitor.name}"}
