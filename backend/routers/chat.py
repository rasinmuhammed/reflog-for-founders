"""
Chat Router - AI mentor chat endpoints

Handles chat-related endpoints including:
- Chat with mentor (multi-agent)
- Get advice history
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models
from database import get_db
from models import ChatMessage
from encryption import decrypt_value, is_encrypted
from board_of_directors import BoardOfDirectors

router = APIRouter(prefix="", tags=["Chat"])


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


@router.post("/chat/{email}")
def chat_with_mentor(
    email: str,
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    """Chat with AI mentor using Board of Directors architecture"""
    user = get_user_by_email_lookup(email, db)

    try:
        groq_key = get_user_groq_key(user.id, db)
    except HTTPException as e:
        return {
            "response": "Please configure your Groq API key in Settings to enable AI features.",
            "error": True
        }

    # Determine founder type from user profile
    founder_type = "business"
    if user.work_style == "technical":
        founder_type = "technical"
    elif user.primary_goal and "sales" in user.primary_goal.lower():
        founder_type = "sales"

    try:
        board = BoardOfDirectors(groq_key, founder_type)
        agents = board.get_agents()

        # Build context from user history
        recent_checkins = db.query(models.CheckIn).filter(
            models.CheckIn.user_id == user.id
        ).order_by(models.CheckIn.timestamp.desc()).limit(5).all()

        context = f"""
User: {user.full_name or user.email}
Business Stage: {user.business_stage or 'Not specified'}
Primary Goal: {user.primary_goal or 'Not specified'}
Recent Activity: {len(recent_checkins)} check-ins, {sum(1 for c in recent_checkins if c.shipped)} shipped
Active Board Members: {', '.join(board.list_board_members())}

User Message: {message.message}
"""

        # For now, create a placeholder response
        # Full CrewAI integration would process through agents here
        response = {
            "message": message.message,
            "board_members": board.list_board_members(),
            "founder_type": founder_type,
            "response": f"Your Board of Directors ({', '.join(board.list_board_members())}) is reviewing your question. This is a placeholder - full AI integration coming soon.",
            "context_used": True
        }

        # Store advice record
        advice = models.AgentAdvice(
            user_id=user.id,
            agent_name="Board of Directors",
            advice=response["response"],
            context={"message": message.message, "board": board.list_board_members()},
            interaction_type="chat"
        )
        db.add(advice)
        db.commit()

        return response

    except Exception as e:
        return {
            "response": f"Sorry, I encountered an error: {str(e)}",
            "error": True
        }


@router.get("/advice/{email}")
def get_advice(email: str, limit: int = 20, db: Session = Depends(get_db)):
    """Get advice history for a user"""
    user = get_user_by_email_lookup(email, db)

    advice = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id
    ).order_by(models.AgentAdvice.created_at.desc()).limit(limit).all()

    return {
        "count": len(advice),
        "advice": [
            {
                "id": a.id,
                "agent": a.agent_name,
                "advice": a.advice,
                "type": a.interaction_type,
                "created_at": a.created_at.isoformat()
            }
            for a in advice
        ]
    }


@router.get("/chat-history/{email}")
def get_chat_history(email: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get chat history with AI mentor"""
    user = get_user_by_email_lookup(email, db)

    chats = db.query(models.AgentAdvice).filter(
        models.AgentAdvice.user_id == user.id,
        models.AgentAdvice.interaction_type == "chat"
    ).order_by(models.AgentAdvice.created_at.desc()).limit(limit).all()

    return {
        "count": len(chats),
        "messages": [
            {
                "id": c.id,
                "agent": c.agent_name,
                "response": c.advice,
                "context": c.context,
                "timestamp": c.created_at.isoformat()
            }
            for c in chats
        ]
    }
