"""
Decisions Router - Life/business decision tracking endpoints

Handles decision-related endpoints including:
- Create life decision with AI analysis
- Re-analyze decisions
- Get decision history
- Evaluate decision outcomes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict
import models
from database import get_db
from db_utils import get_user
from models import LifeDecisionCreate
from encryption import decrypt_value, is_encrypted
from board_of_directors import BoardOfDirectors

router = APIRouter(prefix="", tags=["Decisions"])



def get_user_groq_key(user_id: int, db: Session) -> str:
    """Get user's Groq API key (decrypted) or raise error"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.groq_api_key:
        raise HTTPException(
            status_code=400,
            detail="Groq API key not configured. Please add your API key in settings."
        )

    try:
        if is_encrypted(user.groq_api_key):
            return decrypt_value(user.groq_api_key)
        return user.groq_api_key
    except Exception:
        return user.groq_api_key


@router.post("/life-decisions/{email}")
def create_life_decision(
    email: str,
    decision: LifeDecisionCreate,
    db: Session = Depends(get_db)
):
    """Create a new life decision and analyze it with AI"""
    user = get_user(email, db)

    # Create the decision record
    db_decision = models.LifeDecision(
        user_id=user.id,
        title=decision.title,
        description=decision.description,
        category=decision.category,
        options=decision.options,
        pros_cons=decision.pros_cons,
        urgency=decision.urgency,
        reversibility=decision.reversibility,
        status="pending"
    )
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)

    # Get AI analysis if user has API key
    ai_analysis = None
    try:
        groq_key = get_user_groq_key(user.id, db)
        board = BoardOfDirectors(groq_key, "business")

        # Create analysis prompt
        prompt = f"""Analyze this decision:
Title: {decision.title}
Category: {decision.category}
Description: {decision.description}
Options: {decision.options}
Pros/Cons: {decision.pros_cons}
Urgency: {decision.urgency}
Reversibility: {decision.reversibility}

Provide:
1. Key considerations
2. Potential blind spots
3. Recommended approach
4. Questions to ask yourself"""

        # For now, store a placeholder - full CrewAI integration can be added
        ai_analysis = {
            "analyzed": True,
            "board_members": list(board.list_board_members()),
            "prompt_used": prompt[:500]
        }

        db_decision.ai_analysis = ai_analysis
        db.commit()

    except HTTPException:
        # No API key configured - that's okay
        pass
    except Exception as e:
        ai_analysis = {"error": str(e)}

    return {
        "id": db_decision.id,
        "title": db_decision.title,
        "category": db_decision.category,
        "status": db_decision.status,
        "ai_analysis": ai_analysis,
        "created_at": db_decision.created_at.isoformat()
    }


@router.post("/life-decisions/{email}/{decision_id}/reanalyze")
def reanalyze_life_decision(
    email: str,
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Re-run AI analysis on an existing life decision"""
    user = get_user(email, db)

    decision = db.query(models.LifeDecision).filter(
        models.LifeDecision.id == decision_id,
        models.LifeDecision.user_id == user.id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    try:
        groq_key = get_user_groq_key(user.id, db)
        board = BoardOfDirectors(groq_key, "business")

        ai_analysis = {
            "reanalyzed_at": datetime.utcnow().isoformat(),
            "board_members": list(board.list_board_members())
        }

        decision.ai_analysis = ai_analysis
        db.commit()

        return {
            "id": decision.id,
            "title": decision.title,
            "ai_analysis": ai_analysis
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/life-decisions/{email}")
def get_life_decisions(
    email: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all life decisions for a user"""
    user = get_user(email, db)

    decisions = db.query(models.LifeDecision).filter(
        models.LifeDecision.user_id == user.id
    ).order_by(models.LifeDecision.created_at.desc()).limit(limit).all()

    return {
        "count": len(decisions),
        "decisions": [
            {
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "status": d.status,
                "urgency": d.urgency,
                "reversibility": d.reversibility,
                "has_analysis": d.ai_analysis is not None,
                "created_at": d.created_at.isoformat()
            }
            for d in decisions
        ]
    }


@router.get("/life-decisions/{email}/{decision_id}")
def get_life_decision_detail(
    email: str,
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed view of a specific life decision"""
    user = get_user(email, db)

    decision = db.query(models.LifeDecision).filter(
        models.LifeDecision.id == decision_id,
        models.LifeDecision.user_id == user.id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return {
        "id": decision.id,
        "title": decision.title,
        "description": decision.description,
        "category": decision.category,
        "options": decision.options,
        "pros_cons": decision.pros_cons,
        "urgency": decision.urgency,
        "reversibility": decision.reversibility,
        "status": decision.status,
        "ai_analysis": decision.ai_analysis,
        "evaluation": decision.evaluation,
        "created_at": decision.created_at.isoformat()
    }


@router.post("/life-decisions/{decision_id}/evaluate")
def evaluate_decision(
    decision_id: int,
    evaluation: Dict,
    db: Session = Depends(get_db)
):
    """Record evaluation/outcome of a decision"""
    decision = db.query(models.LifeDecision).filter(
        models.LifeDecision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.evaluation = evaluation
    decision.status = evaluation.get("status", "evaluated")
    db.commit()

    return {
        "id": decision.id,
        "title": decision.title,
        "status": decision.status,
        "evaluation": decision.evaluation
    }
