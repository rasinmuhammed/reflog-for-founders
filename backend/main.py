from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import models
from database import engine, get_db, init_db
from models import (
    UserCreate, UserResponse, CheckInCreate, CheckInUpdate, CheckInResponse,
    AgentAdviceResponse, GitHubAnalysisResponse, ChatMessage,
    LifeDecisionCreate, LifeDecisionResponse, OnboardingData
)
from github_integration import GitHubAnalyzer
from crew import SageMentorCrew
from datetime import datetime, timedelta
from pydantic import BaseModel
from datetime import datetime, timedelta, time
from typing import Optional
from business_models import (
    BusinessMetric, WeeklyReview, OKR, TimeAllocation,
    BusinessMetricCreate, BusinessMetricResponse,
    WeeklyReviewCreate, WeeklyReviewResponse,
    OKRCreate, OKRResponse,
    TimeAllocationCreate, TimeAllocationResponse
)
from founder_agents import get_founder_agents

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

github_analyzer = GitHubAnalyzer()
sage_crew = SageMentorCrew()

@app.get("/")
def read_root():
    return {
        "message": "Sage AI Mentor API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create or update user - idempotent operation
    If user exists, update their email and return existing user
    """
    # Check if user already exists
    db_user = db.query(models.User).filter(
        models.User.github_username == user.github_username
    ).first()
    
    if db_user:
        # User exists - update email if provided and different
        if user.email and db_user.email != user.email:
            db_user.email = user.email
            db.commit()
            db.refresh(db_user)
            print(f"✓ Updated existing user: {user.github_username}")
        else:
            print(f"ℹ️  User already exists: {user.github_username}")
        return db_user
    
    # Create new user
    new_user = models.User(
        github_username=user.github_username,
        email=user.email,
        onboarding_complete=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"✅ Created new user: {user.github_username}")
    return new_user


@app.get("/users/{github_username}", response_model=UserResponse)
def get_user(github_username: str, db: Session = Depends(get_db)):
    """Get user by GitHub username"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail=f"User '{github_username}' not found. Please complete onboarding first."
        )
    
    return user


@app.patch("/users/{github_username}/complete-onboarding")
def complete_onboarding(github_username: str, db: Session = Depends(get_db)):
    """Mark user onboarding as complete"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.onboarding_complete = True
    db.commit()
    db.refresh(user)
    
    return {"message": "Onboarding completed", "user": user}


# Also improve the analyze-github endpoint error handling
@app.post("/analyze-github/{github_username}")
def analyze_github(github_username: str, db: Session = Depends(get_db)):
    """Analyze GitHub profile and store results"""
    
    # Get or create user
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found. Please create user first via /users endpoint."
        )
    
    # Analyze GitHub
    github_data = github_analyzer.analyze_user(github_username)
    
    # Check for errors from GitHub API
    if "error" in github_data:
        error_msg = github_data["error"]
        
        # Provide helpful error messages
        if "404" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(
                status_code=404, 
                detail=f"GitHub user '{github_username}' not found. Please check the username and try again."
            )
        elif "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=429, 
                detail="GitHub API rate limit exceeded. Please try again in a few minutes."
            )
        elif "token" in error_msg.lower():
            raise HTTPException(
                status_code=500, 
                detail="GitHub token not configured. Please contact support."
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to analyze GitHub profile: {error_msg}"
            )
    
    # Store analysis in database
    analysis = models.GitHubAnalysis(
        user_id=user.id,
        username=github_username,
        total_repos=github_data["total_repos"],
        active_repos=github_data["active_repos"],
        total_commits=github_data["total_commits"],
        languages=github_data["languages"],
        patterns=github_data["patterns"]
    )
    db.add(analysis)
    db.commit()
    
    # Get recent check-ins for context
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    checkin_history = [
        {
            "date": c.timestamp.strftime("%Y-%m-%d"),
            "energy": c.energy_level,
            "commitment": c.commitment,
            "shipped": c.shipped
        }
        for c in recent_checkins
    ]
    
    # Run AI analysis
    crew_result = sage_crew.analyze_developer(github_data, checkin_history)
    
    # Store AI insights
    advice = models.AgentAdvice(
        user_id=user.id,
        agent_name="Multi-Agent Analysis",
        advice=crew_result["agent_insights"]["full_analysis"],
        evidence=github_data,
        interaction_type="analysis"
    )
    db.add(advice)
    
    # Mark onboarding as complete
    user.onboarding_complete = True
    db.commit()
    
    print(f"✅ Analysis complete for {github_username}")
    
    return {
        "github_analysis": github_data,
        "ai_insights": crew_result,
        "message": "Analysis complete - welcome to Sage!"
    }

@app.get("/github-analysis/{github_username}", response_model=GitHubAnalysisResponse)
def get_github_analysis(github_username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    analysis = db.query(models.GitHubAnalysis).filter(
        models.GitHubAnalysis.user_id == user.id
    ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found. Run /analyze-github first")
    
    return analysis

@app.post("/checkins/{github_username}")
def create_checkin(
    github_username: str,
    checkin: CheckInCreate,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    history = {
        "recent_checkins": len(recent_checkins),
        "avg_energy": sum(c.energy_level for c in recent_checkins) / len(recent_checkins) if recent_checkins else 0,
        "commitments_kept": sum(1 for c in recent_checkins if c.shipped) if recent_checkins else 0
    }
    
    analysis = sage_crew.quick_checkin_analysis(
        {
            "energy_level": checkin.energy_level,
            "avoiding_what": checkin.avoiding_what,
            "commitment": checkin.commitment,
            "mood": checkin.mood
        },
        history
    )
    
    new_checkin = models.CheckIn(
        user_id=user.id,
        energy_level=checkin.energy_level,
        avoiding_what=checkin.avoiding_what,
        commitment=checkin.commitment,
        mood=checkin.mood,
        ai_analysis=analysis["analysis"]
    )
    db.add(new_checkin)
    
    # Store as interaction
    advice = models.AgentAdvice(
        user_id=user.id,
        agent_name="Psychologist",
        advice=analysis["analysis"],
        evidence={"checkin": checkin.dict()},
        interaction_type="checkin"
    )
    db.add(advice)
    
    db.commit()
    db.refresh(new_checkin)
    
    return {
        "checkin_id": new_checkin.id,
        "ai_response": analysis["analysis"],
        "message": "Check-in recorded"
    }

@app.patch("/checkins/{checkin_id}/evening")
def evening_checkin(
    checkin_id: int,
    update: CheckInUpdate,
    db: Session = Depends(get_db)
):
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.id == checkin_id
    ).first()
    
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    checkin.shipped = update.shipped
    checkin.excuse = update.excuse
    db.commit()
    
    feedback = sage_crew.evening_checkin_review(
        checkin.commitment,
        update.shipped,
        update.excuse
    )
    
    return {
        "message": "Evening check-in recorded",
        "ai_feedback": feedback["feedback"]
    }

@app.get("/checkins/{github_username}", response_model=List[CheckInResponse])
def get_checkins(
    github_username: str,
    limit: int = 30,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(limit).all()
    
    return checkins

@app.get("/advice/{github_username}", response_model=List[AgentAdviceResponse])
def get_advice(github_username: str, limit: int = 20, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(limit).all()
    
    return advice

@app.get("/dashboard/{github_username}")
def get_dashboard(github_username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    github_analysis = db.query(models.GitHubAnalysis).filter(
        models.GitHubAnalysis.user_id == user.id
    ).order_by(models.GitHubAnalysis.analyzed_at.desc()).first()
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    latest_advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(3).all()
    
    total_checkins = len(checkins)
    commitments_kept = sum(1 for c in checkins if c.shipped == True)
    avg_energy = sum(c.energy_level for c in checkins) / total_checkins if total_checkins > 0 else 0
    
    return {
        "user": {
            "username": user.github_username,
            "member_since": user.created_at.strftime("%Y-%m-%d")
        },
        "github": {
            "total_repos": github_analysis.total_repos if github_analysis else 0,
            "active_repos": github_analysis.active_repos if github_analysis else 0,
            "languages": github_analysis.languages if github_analysis else {},
            "patterns": github_analysis.patterns if github_analysis else []
        },
        "stats": {
            "total_checkins": total_checkins,
            "commitments_kept": commitments_kept,
            "success_rate": (commitments_kept / total_checkins * 100) if total_checkins > 0 else 0,
            "avg_energy": round(avg_energy, 1)
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

@app.post("/chat/{github_username}")
async def chat_with_mentor(
    github_username: str,
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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

@app.post("/life-decisions/{github_username}", response_model=LifeDecisionResponse)
def create_life_decision(
    github_username: str,
    decision: LifeDecisionCreate,
    db: Session = Depends(get_db)
):
    """Create a new life decision and analyze it with AI"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create the life event FIRST (without AI analysis)
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
    
    # NOW run AI analysis
    try:
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
        
        print(f"🤖 AI Analysis completed:")
        print(f"  - Analysis length: {len(analysis.get('analysis', ''))}")
        print(f"  - Lessons count: {len(analysis.get('lessons', []))}")
        
        # Update the context with AI analysis
        life_event.context["ai_analysis"] = analysis["analysis"]
        life_event.context["lessons"] = analysis["lessons"]
        life_event.outcome = analysis["long_term_impact"]
        
        # IMPORTANT: Mark the object as modified for PostgreSQL JSON
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
        print(f"❌ AI analysis failed: {str(e)}")
        # Return without AI analysis if it fails
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


# Add new endpoint to re-analyze existing decisions
@app.post("/life-decisions/{github_username}/{decision_id}/reanalyze")
def reanalyze_life_decision(
    github_username: str,
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Re-run AI analysis on an existing life decision"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    life_event = db.query(models.LifeEvent).filter(
        models.LifeEvent.id == decision_id,
        models.LifeEvent.user_id == user.id
    ).first()
    
    if not life_event:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    context = life_event.context if isinstance(life_event.context, dict) else {}
    
    print(f"🔄 Re-analyzing life decision {decision_id}...")
    
    try:
        # Run AI analysis
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
        
        print(f"🤖 Re-analysis completed:")
        print(f"  - Analysis length: {len(analysis.get('analysis', ''))}")
        print(f"  - Lessons count: {len(analysis.get('lessons', []))}")
        
        # Update context with new analysis
        life_event.context["ai_analysis"] = analysis["analysis"]
        life_event.context["lessons"] = analysis["lessons"]
        life_event.outcome = analysis["long_term_impact"]
        
        # Mark as modified for PostgreSQL
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(life_event, "context")
        
        db.commit()
        db.refresh(life_event)
        
        print(f"✅ Re-analysis saved")
        
        return {
            "message": "Re-analysis complete",
            "ai_analysis": analysis["analysis"],
            "lessons_learned": analysis["lessons"],
            "long_term_impact": analysis["long_term_impact"]
        }
        
    except Exception as e:
        print(f"❌ Re-analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Re-analysis failed: {str(e)}")


@app.get("/life-decisions/{github_username}", response_model=List[LifeDecisionResponse])
def get_life_decisions(
    github_username: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all life decisions for a user"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    events = db.query(models.LifeEvent).filter(
        models.LifeEvent.user_id == user.id
    ).order_by(models.LifeEvent.timestamp.desc()).limit(limit).all()
    
    results = []
    for e in events:
        # Handle both dict and potential string JSON
        context = e.context if isinstance(e.context, dict) else {}
        
        # Debug print to see what we're getting
        print(f"📊 Event {e.id} context keys: {context.keys() if context else 'None'}")
        
        results.append({
            "id": e.id,
            "title": e.description,  # Title is stored in description
            "description": context.get("full_description", e.description),
            "decision_type": e.event_type,
            "impact_areas": context.get("impact_areas", []),
            "timestamp": e.timestamp,
            "time_horizon": e.time_horizon,
            "ai_analysis": context.get("ai_analysis"),
            "lessons_learned": context.get("lessons", [])
        })
    
    return results


@app.get("/life-decisions/{github_username}/{decision_id}", response_model=LifeDecisionResponse)
def get_life_decision_detail(
    github_username: str,
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed view of a specific life decision"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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
    event = db.query(models.LifeEvent).filter(
        models.LifeEvent.id == decision_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    user = db.query(models.User).filter(models.User.id == event.user_id).first()
    
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

# Add this debug endpoint to main.py to inspect what's in the database

@app.get("/debug/life-decisions/{github_username}")
def debug_life_decisions(github_username: str, db: Session = Depends(get_db)):
    """Debug endpoint to see raw life decision data"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        return {"error": "User not found"}
    
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
            "raw_context": event.context  # Full context for inspection
        })
    
    return {
        "user": github_username,
        "total_events": len(events),
        "events": debug_data
    }

# ==================== COMMITMENT TRACKING ====================

@app.get("/commitments/{github_username}/today")
def get_today_commitment(github_username: str, db: Session = Depends(get_db)):
    """Get today's commitment if exists"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get today's date range (start and end of day)
    today_start = datetime.combine(datetime.now().date(), time.min)
    today_end = datetime.combine(datetime.now().date(), time.max)
    
    # Find today's check-in
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= today_start,
        models.CheckIn.timestamp <= today_end
    ).order_by(models.CheckIn.timestamp.desc()).first()
    
    if not checkin:
        return {
            "has_commitment": False,
            "message": "No check-in today"
        }
    
    # Calculate hours since commitment
    hours_since = (datetime.now() - checkin.timestamp).total_seconds() / 3600
    
    # Determine if it's time for evening check-in (after 6 PM)
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
        "can_review": current_hour >= 17  # Can review after 5 PM
    }


@app.get("/commitments/{github_username}/pending")
def get_pending_commitments(github_username: str, db: Session = Depends(get_db)):
    """Get all unreviewed commitments (past days not marked shipped/failed)"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get check-ins from last 7 days that haven't been reviewed
    week_ago = datetime.now() - timedelta(days=7)
    
    pending = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= week_ago,
        models.CheckIn.shipped == None  # Not yet reviewed
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
    checkin = db.query(models.CheckIn).filter(
        models.CheckIn.id == checkin_id
    ).first()
    
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    # Update shipped status
    checkin.shipped = review.shipped
    checkin.excuse = review.excuse
    
    db.commit()
    db.refresh(checkin)
    
    # Generate AI feedback on the excuse/success
    user = db.query(models.User).filter(
        models.User.id == checkin.user_id
    ).first()
    
    # Get recent pattern
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == checkin.user_id,
        models.CheckIn.shipped != None
    ).order_by(models.CheckIn.timestamp.desc()).limit(10).all()
    
    shipped_count = sum(1 for c in recent_checkins if c.shipped)
    total_count = len(recent_checkins)
    
    feedback = sage_crew.evening_checkin_review(
        checkin.commitment,
        review.shipped,
        review.excuse
    )
    
    # Store feedback
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


@app.get("/commitments/{github_username}/stats")
def get_commitment_stats(
    github_username: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get commitment statistics"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    since = datetime.now() - timedelta(days=days)
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= since,
        models.CheckIn.shipped != None  # Only reviewed ones
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
    
    shipped_count = sum(1 for c in checkins if c.shipped)
    failed_count = len(checkins) - shipped_count
    
    # Calculate streaks
    current_streak, best_streak = calculate_streaks_detailed(checkins)
    
    # Get common excuses
    excuses = [c.excuse for c in checkins if c.excuse and not c.shipped]
    excuse_counter = {}
    for excuse in excuses:
        # Simple keyword extraction
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


def calculate_streak(checkins: list) -> dict:
    """Calculate current streak from recent check-ins"""
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
    """Calculate current and best streak"""
    if not checkins:
        return 0, 0
    
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    
    for checkin in reversed(checkins):  # Start from oldest
        if checkin.shipped:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
    
    # Current streak is from most recent
    for checkin in checkins:
        if checkin.shipped:
            current_streak += 1
        else:
            break
    
    return current_streak, best_streak


def get_weekly_breakdown(checkins: list) -> list:
    """Get week-by-week breakdown"""
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
        for week, data in sorted(weeks.items(), reverse=True)[:4]  # Last 4 weeks
    ]


@app.get("/commitments/{github_username}/reminder-needed")
def check_reminder_needed(github_username: str, db: Session = Depends(get_db)):
    """Check if user needs a reminder (for notifications)"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        return {"needs_reminder": False}
    
    # Check if there's a commitment today that needs review
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
        return {
            "needs_reminder": False,
            "reason": "no_commitment_today"
        }
    
    # Reminder logic
    if current_hour >= 20:  # After 8 PM
        return {
            "needs_reminder": True,
            "type": "urgent",
            "message": "⚠️ Did you ship what you promised today?",
            "commitment": checkin.commitment,
            "checkin_id": checkin.id
        }
    elif current_hour >= 18:  # After 6 PM
        return {
            "needs_reminder": True,
            "type": "gentle",
            "message": "🔔 Time to review: Did you ship today's commitment?",
            "commitment": checkin.commitment,
            "checkin_id": checkin.id
        }
    
    return {
        "needs_reminder": False,
        "reason": "too_early",
        "check_back_at": "18:00"
    }

@app.get("/commitments/{github_username}/weekly-summary")
def get_weekly_summary(
    github_username: str,
    db: Session = Depends(get_db)
):
    """Get week-by-week commitment summary with insights"""
    user = db.query(models.User).filter(
        models.User.github_username == github_username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get last 4 weeks of data
    four_weeks_ago = datetime.now() - timedelta(days=28)
    
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id,
        models.CheckIn.timestamp >= four_weeks_ago,
        models.CheckIn.shipped != None
    ).order_by(models.CheckIn.timestamp.asc()).all()
    
    # Group by week
    weeks = {}
    for checkin in checkins:
        week_start = checkin.timestamp.date() - timedelta(days=checkin.timestamp.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weeks:
            weeks[week_key] = {
                "shipped": 0,
                "failed": 0,
                "total_energy": 0,
                "count": 0,
                "commitments": []
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
    
    # Format for response
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
    
    return {
        "weeks": summary,
        "total_weeks": len(summary)
    }

# ==================== BUSINESS METRICS ====================

@app.post("/business-metrics/{username}", response_model=BusinessMetricResponse)
def add_business_metric(
    username: str, 
    metric: BusinessMetricCreate, 
    db: Session = Depends(get_db)
):
    """Log a business metric (revenue, users, MRR, etc.)"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_metric = BusinessMetric(
        user_id=user.id,
        metric_type=metric.metric_type,
        value=metric.value,
        target=metric.target,
        notes=metric.notes
    )
    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    
    return new_metric


@app.get("/business-metrics/{username}")
def get_business_metrics(
    username: str, 
    days: int = 90, 
    db: Session = Depends(get_db)
):
    """Get historical business metrics with trend analysis"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    since = datetime.now() - timedelta(days=days)
    
    metrics = db.query(BusinessMetric).filter(
        BusinessMetric.user_id == user.id,
        BusinessMetric.date >= since
    ).order_by(BusinessMetric.date.desc()).all()
    
    # Group by metric type and calculate trends
    metrics_by_type = {}
    for metric in metrics:
        if metric.metric_type not in metrics_by_type:
            metrics_by_type[metric.metric_type] = []
        metrics_by_type[metric.metric_type].append({
            "value": metric.value,
            "target": metric.target,
            "date": metric.date.isoformat(),
            "notes": metric.notes
        })
    
    return {
        "period_days": days,
        "metrics": metrics_by_type
    }


# ==================== WEEKLY REVIEWS ====================

@app.post("/weekly-review/{username}", response_model=WeeklyReviewResponse)
async def create_weekly_review(
    username: str, 
    review: WeeklyReviewCreate, 
    db: Session = Depends(get_db)
):
    """Submit weekly business review, get AI feedback"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get start of current week (Monday)
    today = datetime.now()
    week_start = today - timedelta(days=today.weekday())
    
    # Check if review already exists for this week
    existing = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id,
        WeeklyReview.week_start >= week_start
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Weekly review already submitted for this week"
        )
    
    # Get founder agents
    from founder_agents import business_strategist, market_realist, execution_enforcer
    from crewai import Task, Crew, Process
    
    # Analyze wins vs. stated goals
    review_task = Task(
        description=f"""Analyze this founder's weekly review:
        
        Wins: {review.wins}
        Key Metrics: {review.key_metrics}
        Biggest Blocker: {review.biggest_blocker}
        What They're Avoiding: {review.what_avoiding}
        Next Week Focus: {review.next_week_focus}
        
        Your job:
        1. Are the wins actually impactful or just busy work?
        2. Do the metrics show real progress toward business goals?
        3. Is the "biggest blocker" real or an excuse?
        4. What pattern do you see in what they're avoiding?
        5. Is their next week focus specific and measurable enough?
        6. What's the ONE thing they should actually focus on?
        
        Be brutally honest. Call out founder theater.""",
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
    
    # Create review
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


@app.get("/weekly-reviews/{username}")
def get_weekly_reviews(
    username: str, 
    limit: int = 12, 
    db: Session = Depends(get_db)
):
    """Get past weekly reviews to spot patterns"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reviews = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id
    ).order_by(WeeklyReview.week_start.desc()).limit(limit).all()
    
    return reviews


# ==================== OKRs ====================

@app.post("/okrs/{username}", response_model=OKRResponse)
def create_okr(
    username: str, 
    okr: OKRCreate, 
    db: Session = Depends(get_db)
):
    """Set quarterly OKRs with AI validation"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # AI validates: Is this measurable? Ambitious but achievable?
    from founder_agents import business_strategist
    from crewai import Task, Crew, Process
    
    validation_task = Task(
        description=f"""Validate this OKR:
        
        Quarter: {okr.quarter}
        Objective: {okr.objective}
        Key Results: {okr.key_results}
        
        Your job:
        1. Is each key result actually measurable?
        2. Are the targets ambitious but achievable?
        3. Do these align with building a real business?
        4. What's missing or unrealistic?
        
        Provide brief validation feedback.""",
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


@app.get("/okrs/{username}")
def get_okrs(
    username: str,
    db: Session = Depends(get_db)
):
    """Get all OKRs for a user"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    okrs = db.query(OKR).filter(
        OKR.user_id == user.id
    ).order_by(OKR.quarter.desc()).all()
    
    return okrs


# ==================== TIME ALLOCATION ====================

@app.post("/time-allocation/{username}", response_model=TimeAllocationResponse)
def log_time_allocation(
    username: str, 
    allocation: TimeAllocationCreate, 
    db: Session = Depends(get_db)
):
    """Log how time was spent (product vs. sales vs. ops)"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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


@app.get("/time-analysis/{username}")
def analyze_time_allocation(
    username: str, 
    weeks: int = 4, 
    db: Session = Depends(get_db)
):
    """AI analysis: Where you SAID you'd focus vs. where you ACTUALLY spent time"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    since = datetime.now() - timedelta(weeks=weeks)
    
    allocations = db.query(TimeAllocation).filter(
        TimeAllocation.user_id == user.id,
        TimeAllocation.date >= since
    ).all()
    
    # Group by category
    time_by_category = {}
    for allocation in allocations:
        if allocation.category not in time_by_category:
            time_by_category[allocation.category] = 0
        time_by_category[allocation.category] += allocation.hours
    
    # Get stated priorities from recent reviews
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


# ==================== MODIFIED DASHBOARD ====================

@app.get("/dashboard-founder/{username}")
def get_founder_dashboard(username: str, db: Session = Depends(get_db)):
    """Return founder-specific dashboard data"""
    user = db.query(models.User).filter(
        models.User.github_username == username
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent metrics
    recent_metrics = db.query(BusinessMetric).filter(
        BusinessMetric.user_id == user.id
    ).order_by(BusinessMetric.date.desc()).limit(10).all()
    
    # Get current MRR and users
    current_mrr = next((m.value for m in recent_metrics if m.metric_type == 'mrr'), 0)
    current_users = next((m.value for m in recent_metrics if m.metric_type == 'users'), 0)
    
    # Get most recent review
    recent_review = db.query(WeeklyReview).filter(
        WeeklyReview.user_id == user.id
    ).order_by(WeeklyReview.week_start.desc()).first()
    
    return {
        "user": {
            "username": user.github_username,
            "member_since": user.created_at.strftime("%Y-%m-%d")
        },
        "metrics": {
            "current_mrr": current_mrr,
            "target_mrr": 10000,  # Get from OKRs or user settings
            "users": current_users,
            "runway_months": 8,  # Calculate from burn rate
            "burn_rate": 12000  # Get from metrics
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

@app.post("/users/onboard", response_model=UserResponse)
def complete_onboarding(
    onboarding: OnboardingData,
    email: str,
    full_name: str = None,
    db: Session = Depends(get_db)
):
    """
    Complete founder onboarding with business details
    """
    # Get or create user
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        user = models.User(
            email=email,
            full_name=full_name,
            github_username=onboarding.github_username
        )
        db.add(user)
    
    # Update with onboarding data
    user.business_stage = onboarding.business_stage
    user.primary_goal = onboarding.primary_goal
    user.check_in_frequency = onboarding.check_in_frequency
    user.accountability_style = onboarding.accountability_style
    user.key_metrics = {
        "metrics": onboarding.key_metrics,
        "configured_at": datetime.now().isoformat()
    }
    user.work_preferences = {
        "biggest_challenge": onboarding.biggest_challenge,
        "work_style": onboarding.work_style
    }
    user.onboarding_complete = True
    
    db.commit()
    db.refresh(user)
    
    # Generate initial AI insights based on onboarding
    initial_insights = sage_crew.generate_founder_insights(
        business_stage=onboarding.business_stage,
        primary_goal=onboarding.primary_goal,
        biggest_challenge=onboarding.biggest_challenge,
        accountability_style=onboarding.accountability_style
    )
    
    # Store initial advice
    advice = models.AgentAdvice(
        user_id=user.id,
        agent_name="Onboarding Strategist",
        advice=initial_insights["advice"],
        evidence={"onboarding_data": onboarding.dict()},
        interaction_type="onboarding"
    )
    db.add(advice)
    db.commit()
    
    return user


@app.post("/business-metrics/{email}")
def track_business_metric(
    email: str,
    metric: BusinessMetricCreate,
    db: Session = Depends(get_db)
):
    """Track business metrics"""
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    business_metric = models.BusinessMetric(
        user_id=user.id,
        metric_type=metric.metric_type,
        value=metric.value,
        unit=metric.unit,
        context=metric.context
    )
    db.add(business_metric)
    db.commit()
    
    return {"message": "Metric tracked", "metric_id": business_metric.id}


@app.get("/business-metrics/{email}/history")
def get_metric_history(
    email: str,
    metric_type: str = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get business metric history"""
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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
        ]
    }


@app.get("/dashboard-founder/{email}")
def get_founder_dashboard(email: str, db: Session = Depends(get_db)):
    """Founder-specific dashboard"""
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent metrics
    recent_metrics = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id
    ).order_by(models.BusinessMetric.timestamp.desc()).limit(20).all()
    
    # Organize metrics by type
    metrics_by_type = {}
    for metric in recent_metrics:
        if metric.metric_type not in metrics_by_type:
            metrics_by_type[metric.metric_type] = []
        metrics_by_type[metric.metric_type].append({
            "value": metric.value,
            "unit": metric.unit,
            "timestamp": metric.timestamp.isoformat()
        })
    
    # Get check-in stats
    checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()
    
    # Get latest advice
    latest_advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(3).all()
    
    # GitHub data (optional)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)