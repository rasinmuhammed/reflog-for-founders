"""
Pivot Simulator Router - Simulate startup pivots before burning cash

Endpoints:
- POST /simulate-pivot/{email} - Run pivot simulation
- GET /simulation/{email}/{decision_id} - Get simulation results
- GET /pivot-patterns - Get available pivot patterns for UI
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel
import models
from database import get_db
from db_utils import get_user
from encryption import decrypt_value, is_encrypted

router = APIRouter(prefix="", tags=["Pivot Simulator"])


# Pydantic models for requests/responses
class PivotSimulationRequest(BaseModel):
    title: str
    description: str
    current_situation: str
    target_market: Optional[str] = None
    impact_areas: Optional[List[str]] = None
    current_metrics: Optional[Dict] = None


class PivotSimulationResponse(BaseModel):
    id: int
    title: str
    pivot_type: str
    survival_probability: int
    confidence: str
    comparable_startups: List[Dict]
    risk_factors: List[str]
    brutal_truth: str
    recommendations: List[str]
    simulated_at: str



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


@router.post("/simulate-pivot/{email}")
def simulate_pivot(
    email: str,
    pivot: PivotSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate a startup pivot using AI Market Realist agent

    The lure: "Simulate your pivot before you burn the cash"

    Returns:
    - Survival probability (0-100%)
    - Comparable startup pivots (success/failure examples)
    - Risk factors
    - 90-day projected outcome
    - "The Brutal Truth" - one paragraph of honest assessment
    """
    user = get_user(email, db)

    # Get Groq API key (required for AI analysis)
    try:
        groq_key = get_user_groq_key(user.id, db)
    except HTTPException:
        # Can still run simulation without AI, just less personalized
        groq_key = None

    # Import pivot engine
    from services.pivot_engine import PivotEngine

    # Initialize engine (works with or without API key)
    if groq_key:
        engine = PivotEngine(groq_key)
    else:
        # Create engine without full AI integration
        class SimplePivotEngine:
            def simulate(self, title, description, impact_areas=None, current_metrics=None):
                from services.pivot_engine import PivotEngine as PE
                # Use a placeholder - simulation still works but less personalized
                temp = PE.__new__(PE)
                temp.board = None
                temp.market_realist = None
                pivot_type = temp.categorize_pivot(description)
                survival_data = temp.calculate_survival_probability(pivot_type, description, current_metrics)
                comparables = temp.find_comparable_startups(pivot_type)
                risks = temp.get_risk_factors(pivot_type)
                brutal_truth = temp.generate_brutal_truth(
                    title, description, pivot_type, survival_data["probability"], risks
                )
                return {
                    "pivot_type": pivot_type,
                    "survival_probability": survival_data,
                    "comparable_startups": comparables,
                    "risk_factors": risks,
                    "brutal_truth": brutal_truth,
                    "recommendations": ["Configure your Groq API key for personalized recommendations"],
                    "simulated_at": datetime.utcnow().isoformat()
                }

        engine = SimplePivotEngine()

    # Run simulation
    full_description = f"{pivot.description}\n\nCurrent Situation: {pivot.current_situation}"
    if pivot.target_market:
        full_description += f"\nTarget Market: {pivot.target_market}"

    result = engine.simulate(
        title=pivot.title,
        description=full_description,
        impact_areas=pivot.impact_areas,
        current_metrics=pivot.current_metrics
    )

    # Store as LifeEvent with simulation data
    life_event = models.LifeEvent(
        user_id=user.id,
        event_type="pivot_simulation",
        description=full_description,
        context={
            "title": pivot.title,
            "current_situation": pivot.current_situation,
            "target_market": pivot.target_market,
            "impact_areas": pivot.impact_areas
        },
        # Store simulation results
        simulation_result=result,
        simulation_type=result["pivot_type"],
        survival_probability=result["survival_probability"]["probability"],
        comparable_startups=result["comparable_startups"],
        simulation_date=datetime.utcnow(),
        brutal_truth=result["brutal_truth"]
    )
    db.add(life_event)
    db.commit()
    db.refresh(life_event)

    return {
        "id": life_event.id,
        "title": pivot.title,
        "pivot_type": result["pivot_type"],
        "survival_probability": result["survival_probability"]["probability"],
        "confidence": result["survival_probability"]["confidence"],
        "probability_factors": result["survival_probability"]["factors"],
        "comparable_startups": result["comparable_startups"],
        "risk_factors": result["risk_factors"],
        "brutal_truth": result["brutal_truth"],
        "recommendations": result["recommendations"],
        "simulated_at": result["simulated_at"]
    }


@router.get("/simulation/{email}/{decision_id}")
def get_simulation_result(
    email: str,
    decision_id: int,
    db: Session = Depends(get_db)
):
    """Get a previously run simulation result"""
    user = get_user(email, db)

    event = db.query(models.LifeEvent).filter(
        models.LifeEvent.id == decision_id,
        models.LifeEvent.user_id == user.id,
        models.LifeEvent.event_type == "pivot_simulation"
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {
        "id": event.id,
        "title": event.context.get("title", "Untitled Pivot"),
        "description": event.description,
        "pivot_type": event.simulation_type,
        "survival_probability": event.survival_probability,
        "comparable_startups": event.comparable_startups,
        "simulation_result": event.simulation_result,
        "brutal_truth": event.brutal_truth,
        "simulated_at": event.simulation_date.isoformat() if event.simulation_date else None
    }


@router.get("/simulations/{email}")
def get_all_simulations(
    email: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all pivot simulations for a user"""
    user = get_user(email, db)

    events = db.query(models.LifeEvent).filter(
        models.LifeEvent.user_id == user.id,
        models.LifeEvent.event_type == "pivot_simulation"
    ).order_by(models.LifeEvent.timestamp.desc()).limit(limit).all()

    return {
        "count": len(events),
        "simulations": [
            {
                "id": e.id,
                "title": e.context.get("title", "Untitled Pivot") if e.context else "Untitled",
                "pivot_type": e.simulation_type,
                "survival_probability": e.survival_probability,
                "brutal_truth": e.brutal_truth[:200] + "..." if e.brutal_truth and len(e.brutal_truth) > 200 else e.brutal_truth,
                "simulated_at": e.simulation_date.isoformat() if e.simulation_date else None
            }
            for e in events
        ]
    }


@router.get("/pivot-patterns")
def get_pivot_patterns():
    """Get available pivot pattern categories for UI dropdowns"""
    return {
        "patterns": [
            {"id": "b2c_to_b2b", "name": "B2C → B2B", "description": "Shifting from consumer to enterprise focus"},
            {"id": "b2b_to_b2c", "name": "B2B → B2C", "description": "Moving from enterprise to consumer market"},
            {"id": "pivot_to_saas", "name": "Product → SaaS", "description": "Converting to subscription model"},
            {"id": "market_expansion", "name": "Market Expansion", "description": "Entering new markets or verticals"},
            {"id": "tech_pivot", "name": "Technology Pivot", "description": "Changing core technology or platform"},
            {"id": "business_model_pivot", "name": "Business Model", "description": "Changing how you make money"}
        ]
    }
