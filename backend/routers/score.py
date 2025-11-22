from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta

from integrations.github_client import GitHubClient
from integrations.stripe_client import StripeClient

router = APIRouter(
    prefix="/score",
    tags=["score"],
    responses={404: {"description": "Not found"}},
)

class RealityScoreResponse(BaseModel):
    score: int
    delta: int # Change from yesterday
    components: Dict[str, int] # Breakdown (e.g., {"shipping": 30, "revenue": 20})
    insight: str

@router.get("/{user_id}", response_model=RealityScoreResponse)
def get_reality_score(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Initialize clients (in production, fetch keys from user/env)
    github_client = GitHubClient(token=None) 
    stripe_client = StripeClient(api_key=None)

    # 1. Calculate Shipping Score (GitHub)
    shipping_score = 0
    try:
        gh_activity = github_client.get_recent_activity(user.github_username or "founder")
        if gh_activity["total_commits_24h"] > 0:
            shipping_score = min(40, gh_activity["total_commits_24h"] * 5) # 5 pts per commit, max 40
    except Exception as e:
        print(f"GitHub integration error: {e}")

    # 2. Calculate Revenue/Growth Score (Stripe/Manual)
    growth_score = 0
    try:
        # In real app, check if user has Stripe connected
        mrr = stripe_client.get_mrr()
        if mrr > 0:
            growth_score = 30 # Baseline for having revenue
    except Exception as e:
        print(f"Stripe integration error: {e}")

    # 3. Calculate Mindset/Honesty Score (Check-ins)
    mindset_score = 0
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user_id,
        models.CheckIn.timestamp >= yesterday
    ).count()
    
    if recent_checkins > 0:
        mindset_score = 30 # Max 30 points for consistency

    total_score = min(100, shipping_score + growth_score + mindset_score)
    
    # Mock delta (random for now, or calculate from history)
    delta = 5 

    return RealityScoreResponse(
        score=total_score,
        delta=delta,
        components={
            "shipping": shipping_score,
            "growth": growth_score,
            "mindset": mindset_score
        },
        insight="Your shipping velocity is high, but revenue focus is lagging." if growth_score < 10 else "Great balance across all metrics."
    )
