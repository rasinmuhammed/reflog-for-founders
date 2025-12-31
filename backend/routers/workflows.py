"""
AI Chief of Staff Workflow Endpoints

These are the core workflows that make the AI behave like an operator:
1. Daily Command Brief - Morning intelligence
2. Meeting Prep - Pre-meeting context
3. Meeting Wrap - Post-meeting execution package
4. Inbox Triage - Email prioritization
5. Weekly Review - End-of-week analysis

Also includes mock integrations for calendar and email.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
import models
from cos_engine import get_cos_engine, ChiefOfStaffEngine
from operating_context import get_context_for_ai
from encryption import decrypt_value
from integrations.mock_calendar import get_mock_calendar
from integrations.mock_email import get_mock_email

router = APIRouter(prefix="/cos", tags=["Reflog"])


# ==============================================================================
# Helper Functions
# ==============================================================================

def get_user_by_email(email: str, db: Session):
    """Get user by email"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_cos_for_user(user: models.User) -> ChiefOfStaffEngine:
    """
    Get CoS engine initialized with user's LLM provider config.

    Supports:
    - BYOK (Groq/OpenAI) for free tier
    - Platform key for paid tier (future)
    - Ollama for self-hosted
    """
    # Get user's provider preference (default to groq for BYOK)
    provider = getattr(user, 'llm_provider', None) or 'groq'

    # Check if user has BYOK key
    if provider in ['groq', 'openai']:
        if not user.groq_api_key:
            raise HTTPException(
                status_code=400,
                detail=f"API key not configured. Please add your {provider.upper()} API key in settings."
            )

        try:
            api_key = decrypt_value(user.groq_api_key)
        except BaseException:
            api_key = user.groq_api_key  # Fallback if not encrypted

        return ChiefOfStaffEngine(api_key=api_key, provider=provider)

    elif provider == 'ollama':
        # Ollama doesn't need API key, uses local server
        ollama_url = getattr(user, 'ollama_url', None) or 'http://localhost:11434'
        return ChiefOfStaffEngine(provider='ollama', base_url=ollama_url)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")


# ==============================================================================
# Daily Command Brief
# ==============================================================================

class DailyBriefRequest(BaseModel):
    calendar_events: List[Dict] = []
    recent_emails: List[Dict] = []


@router.post("/daily-brief/{email}")
async def generate_daily_brief(
    email: str,
    request: DailyBriefRequest,
    db: Session = Depends(get_db)
):
    """
    Generate the morning command brief.

    Returns:
    - Top 3 priorities (with WHY)
    - Calendar risk scan
    - Decision queue (ranked)
    - Follow-up radar (threads going cold)
    - Delegation candidates
    """
    user = get_user_by_email(email, db)
    cos = get_cos_for_user(user)

    # Get operating context
    operating_context = get_context_for_ai(db, user.id)

    # Get pending action items
    pending_actions = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == user.id,
        models.ActionItem.status.in_(["pending", "overdue"])
    ).all()

    action_items = [{
        "title": a.title,
        "owner": a.owner,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "priority": a.priority,
        "status": a.status
    } for a in pending_actions]

    # Get active sprint
    active_sprint = db.query(models.Sprint).filter(
        models.Sprint.user_id == user.id,
        models.Sprint.status == "active"
    ).first()

    sprint_status = None
    if active_sprint:
        sprint_status = {
            "name": active_sprint.name,
            "goal": active_sprint.goal,
            "end_date": active_sprint.end_date.isoformat() if active_sprint.end_date else None,
            "priorities": active_sprint.priorities or []
        }

    # Generate brief
    brief = cos.generate_daily_brief(
        operating_context=operating_context,
        calendar_events=request.calendar_events,
        pending_action_items=action_items,
        recent_emails=request.recent_emails,
        sprint_status=sprint_status
    )

    # Store the brief
    daily_brief = models.DailyBrief(
        user_id=user.id,
        brief_content=brief,
        top_priorities=brief.get("top_priorities"),
        decision_queue=brief.get("decision_queue"),
        follow_ups_flagged=len(brief.get("follow_up_radar", []))
    )
    db.add(daily_brief)
    db.commit()

    return {
        "status": "success",
        "brief": brief,
        "brief_id": daily_brief.id
    }


@router.get("/daily-brief/latest/{email}")
async def get_latest_daily_brief(email: str, db: Session = Depends(get_db)):
    """Get the most recent daily brief"""
    user = get_user_by_email(email, db)

    brief = db.query(models.DailyBrief).filter(
        models.DailyBrief.user_id == user.id
    ).order_by(models.DailyBrief.date.desc()).first()

    if not brief:
        raise HTTPException(status_code=404, detail="No daily brief found")

    # Mark as viewed
    brief.viewed = True
    db.commit()

    return brief.brief_content


# ==============================================================================
# Meeting Prep & Wrap
# ==============================================================================

@router.post("/meeting-prep/{meeting_id}")
async def generate_meeting_prep(
    meeting_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate pre-meeting intelligence brief.

    Returns:
    - Why this meeting matters
    - Max 2 decisions needed
    - 5 questions to ask
    - Likely derailers
    - "Don't leave without" next step
    """
    meeting = db.query(models.Meeting).filter(
        models.Meeting.id == meeting_id
    ).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    user = db.query(models.User).filter(
        models.User.id == meeting.user_id
    ).first()

    cos = get_cos_for_user(user)
    operating_context = get_context_for_ai(db, user.id)

    meeting_info = {
        "title": meeting.title,
        "description": meeting.description,
        "scheduled_at": meeting.scheduled_at.isoformat(),
        "duration_minutes": meeting.duration_minutes,
        "attendees": meeting.attendees or []
    }

    # Generate prep brief
    prep = cos.generate_meeting_prep(
        meeting_info=meeting_info,
        attendee_context=meeting.attendees,
        operating_context=operating_context
    )

    # Store on meeting
    meeting.prep_brief = prep
    db.commit()

    return {
        "status": "success",
        "prep": prep,
        "meeting_id": meeting_id
    }


@router.post("/meeting-wrap/{meeting_id}")
async def generate_meeting_wrap(
    meeting_id: int,
    notes_input: models.MeetingNotesInput,
    db: Session = Depends(get_db)
):
    """
    Generate post-meeting execution package.

    Creates:
    - Recap bullets
    - Decisions with trade-offs
    - Action items with owners + deadlines
    - Follow-up email draft
    """
    meeting = db.query(models.Meeting).filter(
        models.Meeting.id == meeting_id
    ).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    user = db.query(models.User).filter(
        models.User.id == meeting.user_id
    ).first()

    cos = get_cos_for_user(user)
    operating_context = get_context_for_ai(db, user.id)

    # Store notes
    meeting.notes = notes_input.notes

    meeting_info = {
        "title": meeting.title,
        "description": meeting.description,
        "scheduled_at": meeting.scheduled_at.isoformat()
    }

    attendee_names = [a.get("name", a.get("email", "Unknown")) for a in (meeting.attendees or [])]

    # Generate wrap
    wrap = cos.generate_meeting_wrap(
        meeting_info=meeting_info,
        meeting_notes=notes_input.notes,
        attendees=attendee_names,
        operating_context=operating_context
    )

    # Store wrap
    meeting.wrap = wrap
    meeting.decisions = wrap.get("decisions_made")
    meeting.follow_up_draft = wrap.get("follow_up_email_draft")
    meeting.status = "completed"

    # Create action items from wrap
    action_items = wrap.get("action_items", [])
    created_actions = []

    for item in action_items:
        try:
            deadline = datetime.fromisoformat(item.get("deadline", ""))
        except BaseException:
            deadline = datetime.utcnow() + timedelta(days=7)

        action = models.ActionItem(
            user_id=user.id,
            title=item.get("title", "Untitled action"),
            owner=item.get("owner", "TBD"),
            deadline=deadline,
            priority=item.get("priority", "medium"),
            source_type="meeting",
            source_id=meeting_id,
            context=item.get("context")
        )
        db.add(action)
        created_actions.append(action)

    db.commit()

    return {
        "status": "success",
        "wrap": wrap,
        "meeting_id": meeting_id,
        "action_items_created": len(created_actions)
    }


# ==============================================================================
# Inbox Triage
# ==============================================================================

class InboxTriageRequest(BaseModel):
    emails: List[Dict]  # [{id, subject, from, preview, date}]


@router.post("/inbox-triage/{email}")
async def triage_inbox(
    email: str,
    request: InboxTriageRequest,
    db: Session = Depends(get_db)
):
    """
    Categorize emails into action buckets.

    Returns:
    - Must reply today (with draft)
    - High value this week
    - Delegate (with suggested owner)
    - Archive
    """
    user = get_user_by_email(email, db)
    cos = get_cos_for_user(user)
    operating_context = get_context_for_ai(db, user.id)

    # Get team members for delegation
    team = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == user.id
    ).all()

    team_context = [{
        "name": m.name,
        "role": m.role,
        "current_load": m.current_load
    } for m in team]

    # Triage inbox
    result = cos.triage_inbox(
        emails=request.emails,
        team_members=team_context,
        operating_context=operating_context
    )

    return {
        "status": "success",
        "triage": result
    }


# ==============================================================================
# Weekly CoS Review
# ==============================================================================

@router.get("/weekly-review/{email}")
async def generate_weekly_review(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Generate end-of-week founder operating review.

    Returns:
    - Wins that matter
    - Root cause of stalls
    - 3 cuts (what to stop doing)
    - 3 delegations
    - Decisions being avoided
    - Next week's top 3 priorities
    """
    user = get_user_by_email(email, db)
    cos = get_cos_for_user(user)
    operating_context = get_context_for_ai(db, user.id)

    # Get this week's data
    week_start = datetime.utcnow() - timedelta(days=7)

    # Actions this week
    actions = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == user.id,
        models.ActionItem.created_at >= week_start
    ).all()

    week_actions = [{
        "title": a.title,
        "owner": a.owner,
        "status": a.status,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "completed_at": a.completed_at.isoformat() if a.completed_at else None
    } for a in actions]

    # Meetings this week
    meetings = db.query(models.Meeting).filter(
        models.Meeting.user_id == user.id,
        models.Meeting.scheduled_at >= week_start
    ).all()

    week_meetings = [{
        "title": m.title,
        "scheduled_at": m.scheduled_at.isoformat(),
        "status": m.status,
        "had_notes": bool(m.notes),
        "action_items_count": len(m.wrap.get("action_items", [])) if m.wrap else 0
    } for m in meetings]

    # Time allocation this week
    time_entries = db.query(models.TimeAllocation).filter(
        models.TimeAllocation.user_id == user.id,
        models.TimeAllocation.date >= week_start
    ).all()

    time_by_category = {}
    for entry in time_entries:
        cat = entry.category
        time_by_category[cat] = time_by_category.get(cat, 0) + entry.hours

    # Sprint progress
    sprint = db.query(models.Sprint).filter(
        models.Sprint.user_id == user.id,
        models.Sprint.status == "active"
    ).first()

    sprint_progress = None
    if sprint:
        sprint_progress = {
            "name": sprint.name,
            "goal": sprint.goal,
            "priorities": sprint.priorities,
            "blockers": sprint.blockers
        }

    # Generate review
    review = cos.generate_weekly_review(
        week_actions=week_actions,
        week_meetings=week_meetings,
        week_time_allocation=time_by_category,
        sprint_progress=sprint_progress,
        operating_context=operating_context
    )

    return {
        "status": "success",
        "review": review,
        "period": {
            "start": week_start.isoformat(),
            "end": datetime.utcnow().isoformat()
        }
    }


# ==============================================================================
# Quick Assist (Chat-like but operator-minded)
# ==============================================================================

class QuickAssistRequest(BaseModel):
    question: str


@router.post("/quick-assist/{email}")
async def quick_assist(
    email: str,
    request: QuickAssistRequest,
    db: Session = Depends(get_db)
):
    """
    Quick CoS response for ad-hoc questions.
    Still operator-minded, not chatbot-like.
    """
    user = get_user_by_email(email, db)
    cos = get_cos_for_user(user)
    operating_context = get_context_for_ai(db, user.id)

    response = cos.quick_assist(
        question=request.question,
        operating_context=operating_context
    )

    return {
        "status": "success",
        "response": response
    }


# Alias for frontend compatibility
class ChatRequest(BaseModel):
    message: str


@router.post("/chat/{email}")
async def cos_chat(
    email: str,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat endpoint for CoS - alias for quick_assist.
    Accepts 'message' parameter instead of 'question'.
    """
    user = get_user_by_email(email, db)
    cos = get_cos_for_user(user)
    operating_context = get_context_for_ai(db, user.id)

    response = cos.quick_assist(
        question=request.message,
        operating_context=operating_context
    )

    return {
        "status": "success",
        "response": response
    }


# ==============================================================================
# Action Item CRUD
# ==============================================================================

@router.get("/actions/{email}")
async def get_action_items(
    email: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all action items for a user"""
    user = get_user_by_email(email, db)

    query = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == user.id
    )

    if status:
        query = query.filter(models.ActionItem.status == status)

    actions = query.order_by(models.ActionItem.deadline).all()

    return [{
        "id": a.id,
        "title": a.title,
        "owner": a.owner,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "priority": a.priority,
        "status": a.status,
        "source_type": a.source_type,
        "created_at": a.created_at.isoformat()
    } for a in actions]


@router.post("/actions/{email}")
async def create_action_item(
    email: str,
    action: models.ActionItemCreate,
    db: Session = Depends(get_db)
):
    """Create a new action item"""
    user = get_user_by_email(email, db)

    try:
        deadline = datetime.fromisoformat(action.deadline)
    except BaseException:
        deadline = datetime.utcnow() + timedelta(days=7)

    new_action = models.ActionItem(
        user_id=user.id,
        title=action.title,
        description=action.description,
        owner=action.owner,
        deadline=deadline,
        priority=action.priority,
        source_type=action.source_type or "manual",
        source_id=action.source_id,
        context=action.context
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)

    return {
        "status": "success",
        "action_id": new_action.id
    }


@router.patch("/actions/{action_id}")
async def update_action_item(
    action_id: int,
    update: models.ActionItemUpdate,
    db: Session = Depends(get_db)
):
    """Update an action item"""
    action = db.query(models.ActionItem).filter(
        models.ActionItem.id == action_id
    ).first()

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if update.status:
        action.status = update.status
        if update.status == "completed":
            action.completed_at = datetime.utcnow()

    if update.owner:
        action.owner = update.owner

    if update.deadline:
        try:
            action.deadline = datetime.fromisoformat(update.deadline)
        except BaseException:
            pass

    if update.priority:
        action.priority = update.priority

    db.commit()

    return {"status": "success", "action_id": action_id}


# ==============================================================================
# Meeting CRUD
# ==============================================================================

@router.get("/meetings/{email}")
async def get_meetings(
    email: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all meetings for a user"""
    user = get_user_by_email(email, db)

    query = db.query(models.Meeting).filter(
        models.Meeting.user_id == user.id
    )

    if status:
        query = query.filter(models.Meeting.status == status)

    meetings = query.order_by(models.Meeting.scheduled_at.desc()).all()

    return [{
        "id": m.id,
        "title": m.title,
        "scheduled_at": m.scheduled_at.isoformat(),
        "duration_minutes": m.duration_minutes,
        "attendees": m.attendees,
        "status": m.status,
        "has_prep": bool(m.prep_brief),
        "has_wrap": bool(m.wrap)
    } for m in meetings]


@router.post("/meetings/{email}")
async def create_meeting(
    email: str,
    meeting: models.MeetingCreate,
    db: Session = Depends(get_db)
):
    """Create a new meeting"""
    user = get_user_by_email(email, db)

    try:
        scheduled_at = datetime.fromisoformat(meeting.scheduled_at)
    except BaseException:
        scheduled_at = datetime.utcnow() + timedelta(hours=1)

    new_meeting = models.Meeting(
        user_id=user.id,
        title=meeting.title,
        description=meeting.description,
        scheduled_at=scheduled_at,
        duration_minutes=meeting.duration_minutes,
        attendees=meeting.attendees
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    return {
        "status": "success",
        "meeting_id": new_meeting.id
    }


# ==============================================================================
# Team & Sprint Management
# ==============================================================================

@router.get("/team/{email}")
async def get_team_members(email: str, db: Session = Depends(get_db)):
    """Get all team members"""
    user = get_user_by_email(email, db)

    members = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == user.id
    ).all()

    return [{
        "id": m.id,
        "name": m.name,
        "role": m.role,
        "email": m.email,
        "decision_rights": m.decision_rights,
        "current_load": m.current_load
    } for m in members]


@router.post("/team/{email}")
async def add_team_member(
    email: str,
    member: models.TeamMemberCreate,
    db: Session = Depends(get_db)
):
    """Add a team member"""
    user = get_user_by_email(email, db)

    new_member = models.TeamMember(
        user_id=user.id,
        name=member.name,
        role=member.role,
        email=member.email,
        decision_rights=member.decision_rights,
        responsibilities=member.responsibilities,
        current_load=member.current_load
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return {"status": "success", "member_id": new_member.id}


@router.get("/sprint/{email}")
async def get_active_sprint(email: str, db: Session = Depends(get_db)):
    """Get active sprint"""
    user = get_user_by_email(email, db)

    sprint = db.query(models.Sprint).filter(
        models.Sprint.user_id == user.id,
        models.Sprint.status == "active"
    ).first()

    if not sprint:
        return {"status": "no_active_sprint"}

    return {
        "id": sprint.id,
        "name": sprint.name,
        "goal": sprint.goal,
        "start_date": sprint.start_date.isoformat(),
        "end_date": sprint.end_date.isoformat(),
        "priorities": sprint.priorities,
        "blockers": sprint.blockers
    }


@router.post("/sprint/{email}")
async def create_sprint(
    email: str,
    sprint: models.SprintCreate,
    db: Session = Depends(get_db)
):
    """Create a new sprint (deactivates previous)"""
    user = get_user_by_email(email, db)

    # Deactivate existing sprints
    db.query(models.Sprint).filter(
        models.Sprint.user_id == user.id,
        models.Sprint.status == "active"
    ).update({"status": "completed", "completed_at": datetime.utcnow()})

    try:
        end_date = datetime.fromisoformat(sprint.end_date)
    except BaseException:
        end_date = datetime.utcnow() + timedelta(weeks=2)

    new_sprint = models.Sprint(
        user_id=user.id,
        name=sprint.name,
        goal=sprint.goal,
        start_date=datetime.utcnow(),
        end_date=end_date,
        priorities=sprint.priorities
    )
    db.add(new_sprint)
    db.commit()
    db.refresh(new_sprint)

    return {"status": "success", "sprint_id": new_sprint.id}


# ==============================================================================
# Mock Data Endpoints (for development)
# ==============================================================================

@router.get("/mock/calendar/{email}")
async def get_mock_calendar_data(email: str):
    """Get mock calendar data for development"""
    calendar = get_mock_calendar(email)
    return {
        "todays_events": calendar.get_todays_events(),
        "upcoming": calendar.get_upcoming_meetings(7),
        "context": calendar.get_calendar_context_for_brief()
    }


@router.get("/mock/inbox/{email}")
async def get_mock_inbox_data(email: str):
    """Get mock email inbox for development"""
    email_service = get_mock_email(email)
    return {
        "inbox": email_service.get_inbox(15),
        "cold_threads": email_service.get_threads_going_cold(),
        "context": email_service.get_email_context_for_brief()
    }


# ==============================================================================
# Auto Brief (with mock data)
# ==============================================================================

@router.post("/auto-brief/{email}")
async def generate_auto_brief(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Generate a daily brief automatically using mock integrations.
    This pulls calendar + email data from mock services.
    """
    user = get_user_by_email(email, db)
    cos = get_cos_for_user(user)

    # Get mock data
    calendar = get_mock_calendar(email)
    email_service = get_mock_email(email)

    calendar_events = calendar.get_todays_events()
    email_context = email_service.get_email_context_for_brief()

    # Get operating context
    operating_context = get_context_for_ai(db, user.id)

    # Get pending action items
    pending_actions = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == user.id,
        models.ActionItem.status.in_(["pending", "overdue"])
    ).all()

    action_items = [{
        "title": a.title,
        "owner": a.owner,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "priority": a.priority,
        "status": a.status
    } for a in pending_actions]

    # Get active sprint
    active_sprint = db.query(models.Sprint).filter(
        models.Sprint.user_id == user.id,
        models.Sprint.status == "active"
    ).first()

    sprint_status = None
    if active_sprint:
        sprint_status = {
            "name": active_sprint.name,
            "goal": active_sprint.goal,
            "end_date": active_sprint.end_date.isoformat() if active_sprint.end_date else None,
            "priorities": active_sprint.priorities or []
        }

    # Generate brief
    brief = cos.generate_daily_brief(
        operating_context=operating_context,
        calendar_events=calendar_events,
        pending_action_items=action_items,
        recent_emails=email_context.get("needs_attention", []),
        sprint_status=sprint_status
    )

    # Store the brief
    daily_brief = models.DailyBrief(
        user_id=user.id,
        brief_content=brief,
        top_priorities=brief.get("top_priorities"),
        decision_queue=brief.get("decision_queue"),
        follow_ups_flagged=len(brief.get("follow_up_radar", []))
    )
    db.add(daily_brief)
    db.commit()

    return {
        "status": "success",
        "brief": brief,
        "brief_id": daily_brief.id,
        "calendar_summary": {
            "total_meetings": len(calendar_events),
            "first_meeting": calendar_events[0]["title"] if calendar_events else None
        },
        "email_summary": {
            "unread": email_context.get("total_unread", 0),
            "urgent": email_context.get("urgent_count", 0)
        }
    }


# ==============================================================================
# Founder Dashboard (Reflog + CoS Combined)
# ==============================================================================

@router.get("/founder-dashboard/{email}")
async def get_founder_dashboard(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Get complete founder dashboard combining reflog data with CoS intelligence.
    This is the unified view of the founder's world.
    """
    user = get_user_by_email(email, db)

    # Get recent check-ins (reflog core feature)
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(7).all()

    # Get life events/decisions
    life_events = db.query(models.LifeEvent).filter(
        models.LifeEvent.user_id == user.id
    ).order_by(models.LifeEvent.timestamp.desc()).limit(5).all()

    # Get action items
    pending_actions = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == user.id,
        models.ActionItem.status == "pending"
    ).order_by(models.ActionItem.deadline).limit(10).all()

    overdue_actions = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == user.id,
        models.ActionItem.status == "pending",
        models.ActionItem.deadline < datetime.utcnow()
    ).count()

    # Get upcoming meetings
    upcoming_meetings = db.query(models.Meeting).filter(
        models.Meeting.user_id == user.id,
        models.Meeting.scheduled_at >= datetime.utcnow(),
        models.Meeting.status == "scheduled"
    ).order_by(models.Meeting.scheduled_at).limit(5).all()

    # Get latest daily brief
    latest_brief = db.query(models.DailyBrief).filter(
        models.DailyBrief.user_id == user.id
    ).order_by(models.DailyBrief.date.desc()).first()

    # Get active sprint
    active_sprint = db.query(models.Sprint).filter(
        models.Sprint.user_id == user.id,
        models.Sprint.status == "active"
    ).first()

    # Get time allocation this week
    week_start = datetime.utcnow() - timedelta(days=7)
    time_entries = db.query(models.TimeAllocation).filter(
        models.TimeAllocation.user_id == user.id,
        models.TimeAllocation.date >= week_start
    ).all()

    time_by_category = {}
    for entry in time_entries:
        cat = entry.category
        time_by_category[cat] = time_by_category.get(cat, 0) + entry.hours

    # Get business metrics
    recent_metrics = db.query(models.BusinessMetric).filter(
        models.BusinessMetric.user_id == user.id
    ).order_by(models.BusinessMetric.timestamp.desc()).limit(10).all()

    # Compile streak and performance stats
    total_checkins = len(recent_checkins)
    shipped = sum(1 for c in recent_checkins if c.shipped == True)
    avg_energy = sum(c.energy_level for c in recent_checkins) / total_checkins if total_checkins > 0 else 0

    # Get mock calendar and email context
    calendar = get_mock_calendar(email)
    email_service = get_mock_email(email)

    return {
        # Unified Stats for Command Center
        "stats": {
            "pending_actions": len(pending_actions),
            "todays_meetings": len(calendar.get_todays_events()) if calendar else 0,
            "unread_emails": email_service.get_email_context_for_brief().get("total_unread", 0) if email_service else 0,
            "ship_rate": int((shipped / total_checkins) * 100) if total_checkins > 0 else 0,
            "energy_level": f"{avg_energy:.1f}" if avg_energy > 0 else None
        },

        # User info
        "user": {
            "email": user.email,
            "name": user.full_name,
            "business_stage": user.business_stage,
            "primary_goal": user.primary_goal,
            "streak": user.current_streak,
            "level": user.level,
            "xp": user.xp
        },

        # Reflog data
        "reflog": {
            "recent_checkins": [{
                "id": c.id,
                "commitment": c.commitment,
                "shipped": c.shipped,
                "energy": c.energy_level,
                "date": c.timestamp.isoformat(),
                "avoiding": c.avoiding_what
            } for c in recent_checkins],
            "life_decisions": [{
                "id": e.id,
                "type": e.event_type,
                "title": e.description,
                "date": e.timestamp.isoformat()
            } for e in life_events],
            "stats": {
                "total_checkins": total_checkins,
                "shipped_rate": f"{(shipped/total_checkins)*100:.0f}%" if total_checkins > 0 else "0%",
                "avg_energy": round(avg_energy, 1),
                "streak": user.current_streak
            }
        },

        # CoS data
        "cos": {
            "pending_actions": [{
                "id": a.id,
                "title": a.title,
                "owner": a.owner,
                "deadline": a.deadline.isoformat() if a.deadline else None,
                "priority": a.priority
            } for a in pending_actions],
            "overdue_count": overdue_actions,
            "upcoming_meetings": [{
                "id": m.id,
                "title": m.title,
                "scheduled_at": m.scheduled_at.isoformat(),
                "has_prep": bool(m.prep_brief)
            } for m in upcoming_meetings],
            "latest_brief": {
                "date": latest_brief.date.isoformat() if latest_brief else None,
                "viewed": latest_brief.viewed if latest_brief else False,
                "priorities": latest_brief.top_priorities if latest_brief else []
            } if latest_brief else None
        },

        # Sprint context
        "sprint": {
            "active": active_sprint is not None,
            "name": active_sprint.name if active_sprint else None,
            "goal": active_sprint.goal if active_sprint else None,
            "days_remaining": (active_sprint.end_date - datetime.utcnow()).days if active_sprint else 0,
            "priorities": active_sprint.priorities if active_sprint else []
        } if active_sprint else {"active": False},

        # Time & metrics
        "time_this_week": time_by_category,
        "business_metrics": [{
            "type": m.metric_type,
            "value": m.value,
            "unit": m.unit,
            "date": m.timestamp.isoformat()
        } for m in recent_metrics],

        # Mock integrations summary
        "integrations": {
            "calendar": calendar.get_calendar_context_for_brief(),
            "email": {
                "unread": email_service.get_email_context_for_brief().get("total_unread", 0),
                "urgent": email_service.get_email_context_for_brief().get("urgent_count", 0),
                "cold_threads": len(email_service.get_threads_going_cold())
            }
        }
    }


# ==============================================================================
# Quick Check-in (Streamlined for CoS)
# ==============================================================================

class QuickCheckinRequest(BaseModel):
    commitment: str
    energy_level: int = 7
    avoiding_what: Optional[str] = None


@router.post("/quick-checkin/{email}")
async def quick_checkin(
    email: str,
    checkin: QuickCheckinRequest,
    db: Session = Depends(get_db)
):
    """
    Quick daily check-in that feeds into CoS intelligence.
    Streamlined version for busy founders.
    """
    user = get_user_by_email(email, db)

    # Create check-in
    new_checkin = models.CheckIn(
        user_id=user.id,
        commitment=checkin.commitment,
        energy_level=checkin.energy_level,
        avoiding_what=checkin.avoiding_what
    )
    db.add(new_checkin)

    # Also create an action item from the commitment
    deadline = datetime.utcnow().replace(hour=23, minute=59, second=59)

    action = models.ActionItem(
        user_id=user.id,
        title=checkin.commitment,
        owner=user.full_name or user.email.split("@")[0],
        deadline=deadline,
        priority="high",
        source_type="checkin",
        context=f"From morning check-in. Energy: {checkin.energy_level}/10"
    )
    db.add(action)

    # Update streak
    if user.last_checkin_date:
        days_since = (datetime.utcnow().date() - user.last_checkin_date.date()).days
        if days_since == 1:
            user.current_streak += 1
        elif days_since > 1:
            user.current_streak = 1
    else:
        user.current_streak = 1

    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak

    user.last_checkin_date = datetime.utcnow()
    user.xp += 25  # XP for checking in

    db.commit()
    db.refresh(new_checkin)

    # Get CoS response if possible
    cos_response = None
    try:
        cos = get_cos_for_user(user)
        operating_context = get_context_for_ai(db, user.id)

        avoiding_text = f"I am avoiding: {checkin.avoiding_what}" if checkin.avoiding_what else ""
        prompt = (
            f"I just committed to: '{checkin.commitment}' (energy: {checkin.energy_level}/10). "
            f"{avoiding_text} "
            "Give me a quick reality check and one tactical tip to ship this today."
        )
        cos_response = cos.quick_assist(prompt, operating_context)
    except BaseException:
        pass  # API key might not be set

    return {
        "status": "success",
        "checkin_id": new_checkin.id,
        "action_id": action.id,
        "streak": user.current_streak,
        "xp_earned": 25,
        "cos_response": cos_response
    }
