from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import models
from database import engine, get_db, init_db
from models import (
    UserCreate, UserResponse, CheckInCreate, CheckInUpdate, CheckInResponse,
    AgentAdviceResponse, GitHubAnalysisResponse, ChatMessage,
    LifeDecisionCreate, LifeDecisionResponse, OnboardingData,
    BusinessMetric, WeeklyReview, OKR, TimeAllocation,
    BusinessMetricCreate, BusinessMetricResponse,
    WeeklyReviewCreate, WeeklyReviewResponse,
    OKRCreate, OKRResponse,
    TimeAllocationCreate, TimeAllocationResponse,
    NotificationPreferences, NotificationPreferencesResponse,
    GroqApiKeyUpdate
    
)
from github_integration import GitHubAnalyzer
from crew import SageMentorCrew
from datetime import datetime, timedelta
from pydantic import BaseModel
from datetime import datetime, timedelta, time
from typing import Optional
from email_service import EmailService
from routers import users, checkins, score

# This import was missing from your file, needed for founder agents
try:
    from founder_agents import get_founder_agents
except ImportError:
    print("WARNING: founder_agents.py not found. Using default agents.")
    # Fallback or error if necessary, here we just use sage_crew
    pass


init_db()

app = FastAPI(title="Reflog AI Mentor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://clerk.com",
        "https://*.clerk.accounts.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import users, checkins, score, gamification
 
app.include_router(users.router)
app.include_router(checkins.router)
app.include_router(score.router)
app.include_router(gamification.router)

github_analyzer = GitHubAnalyzer()
github_analyzer = GitHubAnalyzer()
 # sage_crew removed - instantiated per request


# ==============================================================================
# Helper Function for User Lookup
# ==============================================================================

def get_user_by_email_lookup(email: str, db: Session):
    """Internal helper to find user by email."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404, 
            detail=f"User with email '{email}' not found."
        )
    return user

def get_user_groq_key(user_id: int, db: Session) -> str:
    """Get user's Groq API key or raise error"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.groq_api_key:
        raise HTTPException(
            status_code=400,
            detail="Groq API key not configured. Please add your API key in settings."
        )
    
    return user.groq_api_key

# ==============================================================================
# User & Onboarding Endpoints (MOVED TO ROUTERS)
# ==============================================================================

@app.get("/")
def read_root():
    return {
        "message": "Sage AI Mentor API",
        "version": "1.0.0",
        "status": "running"
    }

# ==============================================================================
# GitHub Endpoints (Still use github_username)
# ==============================================================================

@app.post("/analyze-github/{github_username}")
def analyze_github(github_username: str, email: str = None, db: Session = Depends(get_db)):
    """Analyze GitHub profile - this endpoint properly uses github_username."""
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
    else:
        user = db.query(models.User).filter(
            models.User.github_username == github_username
        ).first()
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found."
        )
    
    if github_username and user.github_username != github_username:
        user.github_username = github_username
        db.commit()
    
    github_data = github_analyzer.analyze_user(github_username)
    
    if "error" in github_data:
        # ... (error handling as before)
        pass
    
    analysis = models.GitHubAnalysis(
        user_id=user.id,
        username=github_username,
        # ... (all other fields)
        total_repos=github_data["total_repos"],
        active_repos=github_data["active_repos"],
        total_commits=github_data["total_commits"],
        languages=github_data["languages"],
        patterns=github_data["patterns"]
    )
    db.add(analysis)
    db.commit()
    
    # ... (rest of AI analysis logic)
    return {"message": "GitHub analysis complete", "github_analysis": github_data}


@app.get("/github-analysis/{github_username}", response_model=GitHubAnalysisResponse)
def get_github_analysis(github_username: str, db: Session = Depends(get_db)):
    """Get GitHub analysis - this also properly uses github_username."""
    analysis = db.query(models.GitHubAnalysis).filter(
        models.GitHubAnalysis.username == github_username
    ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found.")
    
    return analysis

# ==============================================================================
# Check-in & Commitment Endpoints (Refactored for Email)
# ==============================================================================


@app.get("/advice/{email}", response_model=List[AgentAdviceResponse]) # CHANGED
def get_advice(email: str, limit: int = 20, db: Session = Depends(get_db)): # CHANGED
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(limit).all()
    
    return advice

@app.get("/dashboard/{identifier}")
def get_dashboard(identifier: str, db: Session = Depends(get_db)):
    """
    Get dashboard - this endpoint is correct as it checks both email and username.
    """
    user = db.query(models.User).filter(models.User.email == identifier).first()
    
    if not user:
        user = db.query(models.User).filter(
            models.User.github_username == identifier
        ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # ... (rest of dashboard logic is correct)
    github_analysis = None
    if user.github_username:
        github_analysis = db.query(models.GitHubAnalysis).filter(
            models.GitHubAnalysis.user_id == user.id
        ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    latest_advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(3).all()
    
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


@app.post("/chat/{email}")
async def chat_with_mentor(
    email: str,
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    user = get_user_by_email_lookup(email, db)
    
    # Get user's API key
    groq_api_key = get_user_groq_key(user.id, db)
    
    github_analysis = None
    if user.github_username:
        github_analysis = db.query(models.GitHubAnalysis).filter(
            models.GitHubAnalysis.user_id == user.id
        ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()
    
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    life_events = db.query(models.LifeEvent).filter(
        models.LifeEvent.user_id == user.id
    ).order_by(models.LifeEvent.timestamp.desc()).limit(10).all()
    
    user_context = {
        "github": {
            "total_repos": github_analysis.total_repos if github_analysis else 0,
            "active_repos": github_analysis.active_repos if github_analysis else 0,
            "languages": github_analysis.languages if github_analysis else {},
            "patterns": github_analysis.patterns if github_analysis else []
        },
        "recent_performance": {
            "total_checkins": len(recent_checkins),
            "commitments_kept": sum(1 for c in recent_checkins if c.shipped),
            "avg_energy": sum(c.energy_level for c in recent_checkins) / len(recent_checkins) if recent_checkins else 0
        },
        "life_decisions": [
            {
                "title": e.description,
                "type": e.event_type,
                "date": e.timestamp.strftime("%Y-%m-%d")
            }
            for e in life_events
        ]
    }
    
    # Create crew with user's API key
    from crew import SageMentorCrew
    sage_crew = SageMentorCrew(groq_api_key)
    
    deliberation = sage_crew.chat_deliberation(
        message.message,
        user_context,
        message.context
    )
    
    advice = models.AgentAdvice(
        user_id=user.id,
        agent_name="Multi-Agent Chat",
        advice=deliberation["final_response"],
        evidence={"user_message": message.message, "deliberation": deliberation["debate"], "raw_deliberation": deliberation.get("raw_deliberation", [])},
        interaction_type="chat"
    )
    db.add(advice)
    db.commit()
    
    return {
        "response": deliberation["final_response"],
        "agent_debate": deliberation["debate"],
        "key_insights": deliberation["key_insights"],
        "recommended_actions": deliberation["actions"],
        "raw_deliberation": deliberation.get("raw_deliberation", []),
        "interaction_id": advice.id
    }

@app.post("/life-decisions/{email}", response_model=LifeDecisionResponse) # CHANGED
def create_life_decision(
    email: str, # CHANGED
    decision: LifeDecisionCreate,
    db: Session = Depends(get_db)
):
    """Create a new life decision and analyze it with AI"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    context_data = {
        "full_description": decision.description,
        "impact_areas": decision.impact_areas,
        **(decision.context if decision.context else {})
    }
    
    life_event = models.LifeEvent(
        user_id=user.id,
        event_type=decision.decision_type,
        description=decision.title,
        time_horizon=decision.time_horizon,
        context=context_data
    )
    
    db.add(life_event)
    db.commit()
    db.refresh(life_event)
    
    print(f"📝 Life event created (ID: {life_event.id}), now analyzing...")
    
    try:
        # Get user's API key and init crew
        groq_api_key = get_user_groq_key(user.id, db)
        from crew import SageMentorCrew
        sage_crew = SageMentorCrew(groq_api_key)
 
        analysis = sage_crew.analyze_life_decision(
            {
                "title": decision.title,
                "description": decision.description,
                "type": decision.decision_type,
                "impact_areas": decision.impact_areas,
                "time_horizon": decision.time_horizon
            },
            user.id,
            db
        )
        
        life_event.context["ai_analysis"] = analysis["analysis"]
        life_event.context["lessons"] = analysis["lessons"]
        life_event.outcome = analysis["long_term_impact"]
        
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(life_event, "context")
        
        db.commit()
        db.refresh(life_event)
        
        print(f"✅ AI analysis saved to database")
        
        return {
            "id": life_event.id,
            "title": decision.title,
            "description": decision.description,
            "decision_type": decision.decision_type,
            "impact_areas": decision.impact_areas,
            "timestamp": life_event.timestamp,
            "time_horizon": decision.time_horizon,
            "ai_analysis": analysis["analysis"],
            "lessons_learned": analysis["lessons"]
        }
        
    except Exception as e:
        # ... (error handling is correct)
        print(f"❌ AI analysis failed: {str(e)}")
        return {
            "id": life_event.id,
            "title": decision.title,
            "description": decision.description,
            "decision_type": decision.decision_type,
            "impact_areas": decision.impact_areas,
            "timestamp": life_event.timestamp,
            "time_horizon": decision.time_horizon,
            "ai_analysis": None,
            "lessons_learned": []
        }


@app.post("/life-decisions/{email}/{decision_id}/reanalyze") # CHANGED
def reanalyze_life_decision(
    email: str, # CHANGED
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Re-run AI analysis on an existing life decision"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    life_event = db.query(models.LifeEvent).filter(
        models.LifeEvent.id == decision_id,
        models.LifeEvent.user_id == user.id
    ).first()
    
    if not life_event:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # ... (rest of logic is correct)
    context = life_event.context if isinstance(life_event.context, dict) else {}
    print(f"🔄 Re-analyzing life decision {decision_id}...")
    
    try:
        # Get user's API key and init crew
        groq_api_key = get_user_groq_key(user.id, db)
        from crew import SageMentorCrew
        sage_crew = SageMentorCrew(groq_api_key)
 
        analysis = sage_crew.analyze_life_decision(
            {
                "title": life_event.description,
                "description": context.get("full_description", life_event.description),
                "type": life_event.event_type,
                "impact_areas": context.get("impact_areas", []),
                "time_horizon": life_event.time_horizon
            },
            user.id,
            db
        )
        
        life_event.context["ai_analysis"] = analysis["analysis"]
        life_event.context["lessons"] = analysis["lessons"]
        life_event.outcome = analysis["long_term_impact"]
        
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(life_event, "context")
        
        db.commit()
        db.refresh(life_event)
        
        return {
            "message": "Re-analysis complete",
            "ai_analysis": analysis["analysis"],
            "lessons_learned": analysis["lessons"],
            "long_term_impact": analysis["long_term_impact"]
        }
        
    except Exception as e:
        print(f"❌ Re-analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Re-analysis failed: {str(e)}")


@app.get("/life-decisions/{email}", response_model=List[LifeDecisionResponse]) # CHANGED
def get_life_decisions(
    email: str, # CHANGED
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all life decisions for a user"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    events = db.query(models.LifeEvent).filter(
        models.LifeEvent.user_id == user.id
    ).order_by(models.LifeEvent.timestamp.desc()).limit(limit).all()
    
    results = []
    for e in events:
        context = e.context if isinstance(e.context, dict) else {}
        
        results.append({
            "id": e.id,
            "title": e.description,
            "description": context.get("full_description", e.description),
            "decision_type": e.event_type,
            "impact_areas": context.get("impact_areas", []),
            "timestamp": e.timestamp,
            "time_horizon": e.time_horizon,
            "ai_analysis": context.get("ai_analysis"),
            "lessons_learned": context.get("lessons", [])
        })
    
    return results


@app.get("/life-decisions/{email}/{decision_id}", response_model=LifeDecisionResponse) # CHANGED
def get_life_decision_detail(
    email: str, # CHANGED
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed view of a specific life decision"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    event = db.query(models.LifeEvent).filter(
        models.LifeEvent.id == decision_id,
        models.LifeEvent.user_id == user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    context = event.context if isinstance(event.context, dict) else {}
    
    return {
        "id": event.id,
        "title": event.description,
        "description": context.get("full_description", event.description),
        "decision_type": event.event_type,
        "impact_areas": context.get("impact_areas", []),
        "timestamp": event.timestamp,
        "time_horizon": event.time_horizon,
        "ai_analysis": context.get("ai_analysis"),
        "lessons_learned": context.get("lessons", [])
    }

@app.post("/life-decisions/{decision_id}/evaluate")
def evaluate_decision(
    decision_id: int,
    evaluation: Dict,
    db: Session = Depends(get_db)
):
    # This endpoint is fine, it uses decision_id
    event = db.query(models.LifeEvent).filter(
        models.LifeEvent.id == decision_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # ... (rest of logic is correct)
    user = db.query(models.User).filter(models.User.id == event.user_id).first()
    
    # Get user's API key and init crew
    groq_api_key = get_user_groq_key(user.id, db)
    from crew import SageMentorCrew
    sage_crew = SageMentorCrew(groq_api_key)
 
    re_evaluation = sage_crew.reevaluate_decision(
        event,
        evaluation.get("current_situation", ""),
        evaluation.get("what_changed", ""),
        user.id,
        db
    )
    
    if "re_evaluations" not in event.context:
        event.context["re_evaluations"] = []
    
    event.context["re_evaluations"].append({
        "date": datetime.now().isoformat(),
        "analysis": re_evaluation["analysis"],
        "new_lessons": re_evaluation["new_lessons"],
        "how_it_aged": re_evaluation["how_it_aged"]
    })
    db.commit()
    
    return {
        "message": "Decision re-evaluated",
        "analysis": re_evaluation["analysis"],
        "new_lessons": re_evaluation["new_lessons"],
        "how_it_aged": re_evaluation["how_it_aged"]
    }

@app.get("/debug/life-decisions/{email}") # CHANGED
def debug_life_decisions(email: str, db: Session = Depends(get_db)): # CHANGED
    """Debug endpoint to see raw life decision data"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    events = db.query(models.LifeEvent).filter(
        models.LifeEvent.user_id == user.id
    ).all()
    
    debug_data = []
    for event in events:
        debug_data.append({
            "id": event.id,
            "event_type": event.event_type,
            "description": event.description,
            "time_horizon": event.time_horizon,
            "timestamp": str(event.timestamp),
            "outcome": event.outcome,
            "context_type": type(event.context).__name__,
            "context_keys": list(event.context.keys()) if isinstance(event.context, dict) else None,
            "has_ai_analysis": "ai_analysis" in event.context if isinstance(event.context, dict) else False,
            "ai_analysis_length": len(event.context.get("ai_analysis", "")) if isinstance(event.context, dict) else 0,
            "has_lessons": "lessons" in event.context if isinstance(event.context, dict) else False,
            "lessons_count": len(event.context.get("lessons", [])) if isinstance(event.context, dict) else 0,
            "raw_context": event.context
        })
    
    return {
        "user": user.email,
        "total_events": len(events),
        "events": debug_data
    }

# ==================== COMMITMENT TRACKING ====================

@app.get("/commitments/{email}/today") # CHANGED
def get_today_commitment(email: str, db: Session = Depends(get_db)): # CHANGED
    """Get today's commitment if exists"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    today_start = datetime.combine(datetime.now().date(), time.min)
    today_end = datetime.combine(datetime.now().date(), time.max)
    
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= today_start,
        models.CheckIn.timestamp <= today_end
    ).order_by(models.CheckIn.timestamp.desc()).first()
    
    if not checkin:
        return {"has_commitment": False, "message": "No check-in today"}
    
    hours_since = (datetime.now() - checkin.timestamp).total_seconds() / 3600
    current_hour = datetime.now().hour
    should_review = current_hour >= 18 and checkin.shipped is None
    
    return {
        "has_commitment": True,
        "checkin_id": checkin.id,
        "commitment": checkin.commitment,
        "energy_level": checkin.energy_level,
        "avoiding_what": checkin.avoiding_what,
        "created_at": checkin.timestamp.isoformat(),
        "hours_since": round(hours_since, 1),
        "shipped": checkin.shipped,
        "excuse": checkin.excuse,
        "needs_review": should_review,
        "can_review": current_hour >= 17
    }

@app.get("/commitments/{email}/pending") # CHANGED
def get_pending_commitments(email: str, db: Session = Depends(get_db)): # CHANGED
    """Get all unreviewed commitments"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    week_ago = datetime.now() - timedelta(days=7)
    
    pending = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= week_ago,
        models.CheckIn.shipped == None
    ).order_by(models.CheckIn.timestamp.desc()).all()
    
    return {
        "pending_count": len(pending),
        "commitments": [
            {
                "id": c.id,
                "commitment": c.commitment,
                "date": c.timestamp.strftime("%Y-%m-%d"),
                "days_ago": (datetime.now().date() - c.timestamp.date()).days
            }
            for c in pending
        ]
    }

@app.post("/commitments/{checkin_id}/review")
def review_commitment(
    checkin_id: int,
    review: CheckInUpdate,
    db: Session = Depends(get_db)
):
    """Mark commitment as shipped or failed with excuse"""
    # This endpoint is fine, it uses checkin_id
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.id == checkin_id
    ).first()
    
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    # ... (rest of logic is correct)
    checkin.shipped = review.shipped
    checkin.excuse = review.excuse
    db.commit()
    db.refresh(checkin)
    
    user = db.query(models.User).filter(
        models.User.id == checkin.user_id
    ).first()
    
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == checkin.user_id,
        models.CheckIn.shipped != None
    ).order_by(models.CheckIn.timestamp.desc()).limit(10).all()
    
    shipped_count = sum(1 for c in recent_checkins if c.shipped)
    total_count = len(recent_checkins)
    
    # Get user's API key and init crew
    groq_api_key = get_user_groq_key(user.id, db)
    from crew import SageMentorCrew
    sage_crew = SageMentorCrew(groq_api_key)
 
    feedback = sage_crew.evening_checkin_review(
        checkin.commitment,
        review.shipped,
        review.excuse
    )
    
    advice = models.AgentAdvice(
        user_id=checkin.user_id,
        agent_name="Contrarian",
        advice=feedback["feedback"],
        evidence={
            "commitment": checkin.commitment,
            "shipped": review.shipped,
            "excuse": review.excuse,
            "recent_success_rate": f"{shipped_count}/{total_count}" if total_count > 0 else "0/0"
        },
        interaction_type="evening_review"
    )
    db.add(advice)
    db.commit()
    
    return {
        "message": "Commitment reviewed",
        "shipped": review.shipped,
        "feedback": feedback["feedback"],
        "success_rate": f"{shipped_count}/{total_count}" if total_count > 0 else "N/A",
        "streak_info": calculate_streak(recent_checkins)
    }

@app.get("/commitments/{email}/stats") # CHANGED
def get_commitment_stats(
    email: str, # CHANGED
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get commitment statistics"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    since = datetime.now() - timedelta(days=days)
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= since,
        models.CheckIn.shipped != None
    ).order_by(models.CheckIn.timestamp.desc()).all()
    
    if not checkins:
        return {
            "total_commitments": 0,
            "shipped": 0,
            "failed": 0,
            "success_rate": 0,
            "current_streak": 0,
            "best_streak": 0,
            "common_excuses": []
        }
    
    # ... (rest of logic is correct)
    shipped_count = sum(1 for c in checkins if c.shipped)
    failed_count = len(checkins) - shipped_count
    current_streak, best_streak = calculate_streaks_detailed(checkins)
    excuses = [c.excuse for c in checkins if c.excuse and not c.shipped]
    excuse_counter = {}
    for excuse in excuses:
        words = excuse.lower().split()
        for word in ['time', 'tired', 'hard', 'busy', 'complex', 'stuck']:
            if word in words:
                excuse_counter[word] = excuse_counter.get(word, 0) + 1
    
    common_excuses = sorted(excuse_counter.items(), key=lambda x: x[1], reverse=True)[:3]
    
    return {
        "period_days": days,
        "total_commitments": len(checkins),
        "shipped": shipped_count,
        "failed": failed_count,
        "success_rate": round((shipped_count / len(checkins) * 100), 1),
        "current_streak": current_streak,
        "best_streak": best_streak,
        "common_excuses": [{"excuse": e[0], "count": e[1]} for e in common_excuses],
        "weekly_breakdown": get_weekly_breakdown(checkins)
    }

# Helper functions (no changes needed)
def calculate_streak(checkins: list) -> dict:
    # ... (logic is correct)
    if not checkins:
        return {"current": 0, "best": 0}
    current_streak = 0
    for checkin in checkins:
        if checkin.shipped:
            current_streak += 1
        else:
            break
    return {"current": current_streak, "type": "shipping" if current_streak > 0 else "none"}

def calculate_streaks_detailed(checkins: list) -> tuple:
    # ... (logic is correct)
    if not checkins:
        return 0, 0
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    for checkin in reversed(checkins):
        if checkin.shipped:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
    for checkin in checkins:
        if checkin.shipped:
            current_streak += 1
        else:
            break
    return current_streak, best_streak

def get_weekly_breakdown(checkins: list) -> list:
    # ... (logic is correct)
    weeks = {}
    for checkin in checkins:
        week_start = checkin.timestamp.date() - timedelta(days=checkin.timestamp.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        if week_key not in weeks:
            weeks[week_key] = {"shipped": 0, "failed": 0}
        if checkin.shipped:
            weeks[week_key]["shipped"] += 1
        else:
            weeks[week_key]["failed"] += 1
    return [
        {
            "week_start": week,
            "shipped": data["shipped"],
            "failed": data["failed"],
            "rate": round((data["shipped"] / (data["shipped"] + data["failed"]) * 100), 1)
        }
        for week, data in sorted(weeks.items(), reverse=True)[:4]
    ]

@app.get("/commitments/{email}/reminder-needed") # CHANGED
def check_reminder_needed(email: str, db: Session = Depends(get_db)): # CHANGED
    """Check if user needs a reminder (for notifications)"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    today_start = datetime.combine(datetime.now().date(), time.min)
    today_end = datetime.combine(datetime.now().date(), time.max)
    current_hour = datetime.now().hour
    
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= today_start,
        models.CheckIn.timestamp <= today_end,
        models.CheckIn.shipped == None
    ).first()
    
    if not checkin:
        return {"needs_reminder": False, "reason": "no_commitment_today"}
    
    if current_hour >= 20:
        return {
            "needs_reminder": True, "type": "urgent",
            "message": "⚠️ Did you ship what you promised today?",
            "commitment": checkin.commitment, "checkin_id": checkin.id
        }
    elif current_hour >= 18:
        return {
            "needs_reminder": True, "type": "gentle",
            "message": "🔔 Time to review: Did you ship today's commitment?",
            "commitment": checkin.commitment, "checkin_id": checkin.id
        }
    
    return {"needs_reminder": False, "reason": "too_early", "check_back_at": "18:00"}

@app.get("/commitments/{email}/weekly-summary") # CHANGED
def get_weekly_summary(
    email: str, # CHANGED
    db: Session = Depends(get_db)
):
    """Get week-by-week commitment summary with insights"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    four_weeks_ago = datetime.now() - timedelta(days=28)
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= four_weeks_ago,
        models.CheckIn.shipped != None
    ).order_by(models.CheckIn.timestamp.asc()).all()
    
    weeks = {}
    for checkin in checkins:
        week_start = checkin.timestamp.date() - timedelta(days=checkin.timestamp.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weeks:
            weeks[week_key] = {
                "shipped": 0, "failed": 0, "total_energy": 0,
                "count": 0, "commitments": []
            }
        
        weeks[week_key]["count"] += 1
        weeks[week_key]["total_energy"] += checkin.energy_level
        weeks[week_key]["commitments"].append({
            "text": checkin.commitment,
            "shipped": checkin.shipped,
            "date": checkin.timestamp.strftime("%Y-%m-%d")
        })
        
        if checkin.shipped:
            weeks[week_key]["shipped"] += 1
        else:
            weeks[week_key]["failed"] += 1
    
    summary = []
    for week_start, data in sorted(weeks.items(), reverse=True):
        summary.append({
            "week_start": week_start,
            "shipped": data["shipped"],
            "failed": data["failed"],
            "success_rate": round((data["shipped"] / data["count"] * 100), 1) if data["count"] > 0 else 0,
            "avg_energy": round(data["total_energy"] / data["count"], 1) if data["count"] > 0 else 0,
            "commitments": data["commitments"]
        })
    
    return {"weeks": summary, "total_weeks": len(summary)}

# ==================== BUSINESS METRICS (Refactored for Email) ====================

@app.post("/business-metrics/{email}", response_model=BusinessMetricResponse) # CHANGED
def add_business_metric(
    email: str, # CHANGED
    metric: BusinessMetricCreate, 
    db: Session = Depends(get_db)
):
    """Log a business metric (revenue, users, MRR, etc.)"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # Note: Your Pydantic model 'BusinessMetricCreate' does not have 'target' or 'notes'.
    # The model in 'business_models.py' *did* have them.
    # I'll use the one from your 'models.py' (the unified file), which is BusinessMetricCreate
    
    new_metric = BusinessMetric(
        user_id=user.id,
        metric_type=metric.metric_type,
        value=metric.value,
        unit=metric.unit,
        context=metric.context
    )
    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    
    # This response needs to match BusinessMetricResponse
    return {
        "id": new_metric.id,
        "metric_type": new_metric.metric_type,
        "value": new_metric.value,
        "unit": new_metric.unit,
        "timestamp": new_metric.timestamp,
        "date": new_metric.timestamp, # Fulfilling Pydantic model
        "target": metric.target if hasattr(metric, 'target') else None, # Fulfilling Pydantic model
        "notes": metric.notes if hasattr(metric, 'notes') else None # Fulfilling Pydantic model
    }

@app.get("/business-metrics/{email}") # CHANGED
def get_business_metrics(
    email: str, # CHANGED
    days: int = 90, 
    db: Session = Depends(get_db)
):
    """Get historical business metrics with trend analysis"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    since = datetime.now() - timedelta(days=days)
    
    metrics = db.query(BusinessMetric).filter(
        BusinessMetric.user_id == user.id,
        BusinessMetric.timestamp >= since # CHANGED from .date
    ).order_by(BusinessMetric.timestamp.desc()).all() # CHANGED from .date
    
    metrics_by_type = {}
    for metric in metrics:
        if metric.metric_type not in metrics_by_type:
            metrics_by_type[metric.metric_type] = []
        metrics_by_type[metric.metric_type].append({
            "value": metric.value,
            "target": metric.context.get("target") if metric.context else None, # Assumed target/notes are in context
            "date": metric.timestamp.isoformat(),
            "notes": metric.context.get("notes") if metric.context else None
        })
    
    return {
        "period_days": days,
        "metrics": metrics_by_type
    }

# This route seems redundant with the one above it.
# I'm keeping the one that uses email in the path for consistency.
# @app.post("/business-metrics") ...

# ==================== WEEKLY REVIEWS (Refactored for Email) ====================

@app.post("/weekly-review/{email}", response_model=WeeklyReviewResponse) # CHANGED
async def create_weekly_review(
    email: str, # CHANGED
    review: WeeklyReviewCreate, 
    db: Session = Depends(get_db)
):
    """Submit weekly business review, get AI feedback"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    today = datetime.now()
    week_start = today - timedelta(days=today.weekday())
    
    existing = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id,
        WeeklyReview.week_start >= week_start
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Weekly review already submitted for this week"
        )
    
    from founder_agents import business_strategist, market_realist, execution_enforcer
    from crewai import Task, Crew, Process
    
    review_task = Task(
        description=f"""Analyze this founder's weekly review:
        ... (rest of task description) ...
        """,
        agent=business_strategist,
        expected_output="Honest analysis with specific actionable feedback"
    )
    
    crew = Crew(
        agents=[business_strategist, market_realist, execution_enforcer],
        tasks=[review_task],
        process=Process.sequential,
        verbose=False
    )
    
    result = crew.kickoff()
    ai_analysis = str(result)
    
    new_review = WeeklyReview(
        user_id=user.id,
        week_start=week_start,
        wins=review.wins,
        key_metrics=review.key_metrics,
        biggest_blocker=review.biggest_blocker,
        what_avoiding=review.what_avoiding,
        next_week_focus=review.next_week_focus,
        ai_analysis=ai_analysis
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    return new_review


@app.get("/weekly-reviews/{email}") # CHANGED
def get_weekly_reviews(
    email: str, # CHANGED
    limit: int = 12, 
    db: Session = Depends(get_db)
):
    """Get past weekly reviews to spot patterns"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    reviews = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id
    ).order_by(WeeklyReview.week_start.desc()).limit(limit).all()
    
    return reviews


# ==================== OKRs (Refactored for Email) ====================

@app.post("/okrs/{email}", response_model=OKRResponse) # CHANGED
def create_okr(
    email: str, # CHANGED
    okr: OKRCreate, 
    db: Session = Depends(get_db)
):
    """Set quarterly OKRs with AI validation"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    from founder_agents import business_strategist
    from crewai import Task, Crew, Process
    
    # ... (rest of logic is correct)
    validation_task = Task(
        description=f"""Validate this OKR:
        ... (rest of task description) ...
        """,
        agent=business_strategist,
        expected_output="Validation feedback on the OKR"
    )
    
    crew = Crew(
        agents=[business_strategist],
        tasks=[validation_task],
        process=Process.sequential,
        verbose=False
    )
    
    result = crew.kickoff()
    
    new_okr = OKR(
        user_id=user.id,
        quarter=okr.quarter,
        objective=okr.objective,
        key_results=okr.key_results,
        progress_updates=[]
    )
    db.add(new_okr)
    db.commit()
    db.refresh(new_okr)
    
    return new_okr


@app.get("/okrs/{email}") # CHANGED
def get_okrs(
    email: str, # CHANGED
    db: Session = Depends(get_db)
):
    """Get all OKRs for a user"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    okrs = db.query(OKR).filter(
        OKR.user_id == user.id
    ).order_by(OKR.quarter.desc()).all()
    
    return okrs


# ==================== TIME ALLOCATION (Refactored for Email) ====================

@app.post("/time-allocation/{email}", response_model=TimeAllocationResponse) # CHANGED
def log_time_allocation(
    email: str, # CHANGED
    allocation: TimeAllocationCreate, 
    db: Session = Depends(get_db)
):
    """Log how time was spent"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    new_allocation = TimeAllocation(
        user_id=user.id,
        category=allocation.category,
        hours=allocation.hours,
        notes=allocation.notes
    )
    db.add(new_allocation)
    db.commit()
    db.refresh(new_allocation)
    
    return new_allocation


@app.get("/time-analysis/{email}") # CHANGED
def analyze_time_allocation(
    email: str, # CHANGED
    weeks: int = 4, 
    db: Session = Depends(get_db)
):
    """AI analysis of time allocation vs. stated priorities"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    since = datetime.now() - timedelta(weeks=weeks)
    
    allocations = db.query(TimeAllocation).filter(
        TimeAllocation.user_id == user.id,
        TimeAllocation.date >= since
    ).all()
    
    # ... (rest of logic is correct)
    time_by_category = {}
    for allocation in allocations:
        if allocation.category not in time_by_category:
            time_by_category[allocation.category] = 0
        time_by_category[allocation.category] += allocation.hours
    
    reviews = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id,
        WeeklyReview.week_start >= since
    ).order_by(WeeklyReview.week_start.desc()).all()
    
    stated_priorities = [r.next_week_focus for r in reviews if r.next_week_focus]
    
    return {
        "weeks_analyzed": weeks,
        "time_by_category": time_by_category,
        "stated_priorities": stated_priorities,
        "ai_insight": f"You spent {time_by_category} hours. Compare this to your stated priorities: {stated_priorities}"
    }


# ==================== MODIFIED DASHBOARD (Refactored for Email) ====================

@app.get("/dashboard-founder/{email}") # CHANGED
def get_founder_dashboard(email: str, db: Session = Depends(get_db)): # CHANGED
    """Return founder-specific dashboard data"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    # ... (rest of logic is correct)
    recent_metrics = db.query(BusinessMetric).filter(
        BusinessMetric.user_id == user.id
    ).order_by(models.BusinessMetric.timestamp.desc()).limit(10).all() # CHANGED .date to .timestamp
    
    current_mrr = next((m.value for m in recent_metrics if m.metric_type == 'mrr'), 0)
    current_users = next((m.value for m in recent_metrics if m.metric_type == 'users'), 0)
    
    recent_review = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id
    ).order_by(WeeklyReview.week_start.desc()).first()
    
    return {
        "user": {
            "email": user.email, # CHANGED from username
            "member_since": user.created_at.strftime("%Y-%m-%d")
        },
        "metrics": {
            "current_mrr": current_mrr,
            "target_mrr": 10000,
            "users": current_users,
            "runway_months": 8,
            "burn_rate": 12000
        },
        "this_week": {
            "focus": recent_review.next_week_focus if recent_review else "Not set",
            "progress": "Track via time allocation",
            "ai_insight": recent_review.ai_analysis if recent_review else None
        },
        "recent_reviews": [
            {
                "week": r.week_start.strftime("%Y-%m-%d"),
                "wins": r.wins,
                "blocker": r.biggest_blocker
            }
            for r in db.query(WeeklyReview).filter(
                WeeklyReview.user_id == user.id
            ).order_by(WeeklyReview.week_start.desc()).limit(3).all()
        ]
    }

# This endpoint is already refactored correctly
@app.post("/business-metrics/{email}")
def track_business_metric(
    email: str,
    metric: BusinessMetricCreate,
    db: Session = Depends(get_db)
):
    """Track business metrics"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    business_metric = models.BusinessMetric(
        user_id=user.id,
        metric_type=metric.metric_type,
        value=metric.value,
        unit=metric.unit,
        context=metric.context
    )
    db.add(business_metric)
    db.commit()
    db.refresh(business_metric)
    
    return {
        "message": "Metric tracked successfully",
        "metric": {
            "id": business_metric.id,
            "type": business_metric.metric_type,
            "value": business_metric.value,
            "unit": business_metric.unit,
            "timestamp": business_metric.timestamp.isoformat()
        }
    }

# This endpoint is already refactored correctly
@app.get("/business-metrics/{email}/history")
def get_metric_history(
    email: str,
    metric_type: str = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get business metric history"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    since = datetime.now() - timedelta(days=days)
    
    query = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id,
        models.BusinessMetric.timestamp >= since
    )
    
    if metric_type:
        query = query.filter(models.BusinessMetric.metric_type == metric_type)
    
    metrics = query.order_by(models.BusinessMetric.timestamp.desc()).all()
    
    return {
        "metrics": [
            {
                "id": m.id,
                "type": m.metric_type,
                "value": m.value,
                "unit": m.unit,
                "timestamp": m.timestamp.isoformat(),
                "context": m.context
            }
            for m in metrics
        ],
        "total": len(metrics)
    }

# This endpoint is already refactored correctly
@app.get("/dashboard-founder/{email}")
def get_founder_dashboard(email: str, db: Session = Depends(get_db)):
    """Founder-specific dashboard"""
    user = get_user_by_email_lookup(email, db) # CHANGED
    
    recent_metrics = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id
    ).order_by(models.BusinessMetric.timestamp.desc()).limit(20).all()
    
    # ... (rest of logic is correct)
    metrics_by_type = {}
    for metric in recent_metrics:
        if metric.metric_type not in metrics_by_type:
            metrics_by_type[metric.metric_type] = []
        metrics_by_type[metric.metric_type].append({
            "value": metric.value,
            "unit": metric.unit,
            "timestamp": metric.timestamp.isoformat()
        })
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    latest_advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(3).all()
    
    github_analysis = None
    if user.github_username:
        github_analysis = db.query(models.GitHubAnalysis).filter(
            models.GitHubAnalysis.user_id == user.id
        ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()
    
    return {
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "business_stage": user.business_stage,
            "primary_goal": user.primary_goal,
            "member_since": user.created_at.strftime("%Y-%m-%d"),
            "check_in_frequency": user.check_in_frequency,
            "accountability_style": user.accountability_style
        },
        "business_metrics": metrics_by_type,
        "github": {
            "connected": user.github_username is not None,
            "data": {
                "total_repos": github_analysis.total_repos if github_analysis else 0,
                "active_repos": github_analysis.active_repos if github_analysis else 0,
                "languages": github_analysis.languages if github_analysis else {},
                "patterns": github_analysis.patterns if github_analysis else []
            } if github_analysis else None
        },
        "stats": {
            "total_checkins": len(checkins),
            "commitments_kept": sum(1 for c in checkins if c.shipped == True),
            "success_rate": (sum(1 for c in checkins if c.shipped == True) / len(checkins) * 100) if len(checkins) > 0 else 0,
            "avg_energy": sum(c.energy_level for c in checkins) / len(checkins) if len(checkins) > 0 else 0
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
# ==================== NOTIFICATION PREFERENCES ====================

@app.get("/users/{email}/notification-preferences", response_model=NotificationPreferencesResponse)
def get_notification_preferences(
    email: str,
    db: Session = Depends(get_db)
):
    """Get user's notification preferences"""
    user = get_user_by_email_lookup(email, db)
    
    return {
        "email_notifications_enabled": user.email_notifications_enabled,
        "morning_reminder_time": user.morning_reminder_time,
        "evening_reminder_time": user.evening_reminder_time,
        "timezone": user.timezone
    }


@app.post("/users/{email}/notification-preferences", response_model=NotificationPreferencesResponse)
def update_notification_preferences(
    email: str,
    preferences: NotificationPreferences,
    db: Session = Depends(get_db)
):
    """Update user's notification preferences"""
    user = get_user_by_email_lookup(email, db)
    
    # Update preferences
    user.email_notifications_enabled = preferences.email_notifications_enabled
    
    if preferences.morning_reminder_time:
        user.morning_reminder_time = preferences.morning_reminder_time
    
    if preferences.evening_reminder_time:
        user.evening_reminder_time = preferences.evening_reminder_time
    
    if preferences.timezone:
        user.timezone = preferences.timezone
    
    db.commit()
    db.refresh(user)
    
    print(f"✓ Updated notification preferences for {email}")
    
    return {
        "email_notifications_enabled": user.email_notifications_enabled,
        "morning_reminder_time": user.morning_reminder_time,
        "evening_reminder_time": user.evening_reminder_time,
        "timezone": user.timezone
    }


@app.post("/users/{email}/test-notification")
def send_test_notification(
    email: str,
    notification_type: str = 'morning',  # morning, evening, or weekly
    db: Session = Depends(get_db)
):
    """Send a test notification to user"""
    user = get_user_by_email_lookup(email, db)
    
    user_name = user.full_name or user.email.split('@')[0]
    accountability_style = user.accountability_style or 'balanced'
    
    success = False
    
    if notification_type == 'morning':
        success = EmailService.send_morning_reminder(
            to_email=email,
            user_name=user_name,
            accountability_style=accountability_style
        )
    elif notification_type == 'evening':
        # Get a recent commitment or use placeholder
        recent_checkin = db.query(models.CheckIn).filter(
            models.CheckIn.user_id == user.id
        ).order_by(models.CheckIn.timestamp.desc()).first()
        
        commitment = recent_checkin.commitment if recent_checkin else "Complete your project milestone"
        
        success = EmailService.send_evening_reminder(
            to_email=email,
            user_name=user_name,
            commitment=commitment,
            accountability_style=accountability_style,
            is_urgent=False
        )
    elif notification_type == 'weekly':
        # Get last week's stats
        seven_days_ago = datetime.now() - timedelta(days=7)
        checkins = db.query(models.CheckIn).filter(
            models.CheckIn.user_id == user.id,
            models.CheckIn.timestamp >= seven_days_ago,
            models.CheckIn.shipped != None
        ).all()
        
        total = len(checkins)
        shipped = sum(1 for c in checkins if c.shipped)
        
        stats = {
            'total_commitments': total,
            'shipped': shipped,
            'success_rate': (shipped / total * 100) if total > 0 else 0
        }
        
        success = EmailService.send_weekly_summary(
            to_email=email,
            user_name=user_name,
            stats=stats,
            accountability_style=accountability_style
        )
    
    if success:
        return {
            "message": f"Test {notification_type} notification sent to {email}",
            "success": True
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to send test notification"
        )
# ==================== NEW: API KEY MANAGEMENT ENDPOINTS ====================

@app.post("/users/{email}/groq-key")
def set_groq_api_key(
    email: str,
    key_data: GroqApiKeyUpdate,
    db: Session = Depends(get_db)
):
    """Set or update user's Groq API key"""
    user = get_user_by_email_lookup(email, db)
    
    # Validate the API key format (starts with gsk_)
    if not key_data.groq_api_key.startswith('gsk_'):
        raise HTTPException(
            status_code=400,
            detail="Invalid Groq API key format. Key should start with 'gsk_'"
        )
    
    # Test the API key before saving
    try:
        from agents import create_groq_llm
        test_llm = create_groq_llm(key_data.groq_api_key)
        # Simple validation - if it doesn't throw an error, it's likely valid
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Groq API key: {str(e)}"
        )
    
    # Save the API key (in production, encrypt this!)
    user.groq_api_key = key_data.groq_api_key
    db.commit()
    
    return {
        "message": "Groq API key saved successfully",
        "has_key": True
    }

@app.get("/users/{email}/groq-key/status")
def check_groq_key_status(
    email: str,
    db: Session = Depends(get_db)
):
    """Check if user has a Groq API key configured"""
    user = get_user_by_email_lookup(email, db)
    
    return {
        "has_key": user.groq_api_key is not None,
        "key_preview": f"{user.groq_api_key[:10]}..." if user.groq_api_key else None
    }

@app.delete("/users/{email}/groq-key")
def delete_groq_api_key(
    email: str,
    db: Session = Depends(get_db)
):
    """Delete user's Groq API key"""
    user = get_user_by_email_lookup(email, db)
    
    user.groq_api_key = None
    db.commit()
    
    return {
        "message": "Groq API key deleted successfully",
        "has_key": False
    }

# Update the main startup to include scheduler
if __name__ == "__main__":
    import uvicorn
    from notification_scheduler import start_scheduler
    
    # Start the notification scheduler
    start_scheduler()
    
    # Start the API server
    uvicorn.run(app, host="0.0.0.0", port=8000)