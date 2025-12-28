"""
Operating Context for AI Chief of Staff

These are the three inputs that make the AI behave like YOUR CoS:
1. Team Map - Who owns what, decision rights, capacity
2. Sprint Plan - Current priorities, goals, blockers
3. Backlog - What's deprioritized, distractions to cut

A real CoS spends week one building this context.
"""

from typing import Dict, List, Optional
from datetime import datetime, date
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models


# ==============================================================================
# Operating Context Models
# ==============================================================================

class TeamMemberContext(BaseModel):
    """Context about a team member for delegation decisions"""
    name: str
    role: str
    email: Optional[str] = None
    decision_rights: List[str] = []  # What they can decide without founder
    current_load: str = "normal"  # light, normal, overloaded
    strengths: List[str] = []
    availability: Optional[str] = None  # "out this week", "busy with X"


class SprintContext(BaseModel):
    """Current sprint for priority alignment"""
    name: str
    goal: str
    end_date: str
    priorities: List[Dict[str, str]]  # [{title, status, owner}]
    blockers: List[str] = []
    at_risk: List[str] = []  # Items that might slip


class BacklogItem(BaseModel):
    """Things explicitly NOT doing right now"""
    title: str
    reason_deprioritized: str
    revisit_date: Optional[str] = None
    distraction_risk: str = "low"  # How likely to pull founder attention


class OperatingContext(BaseModel):
    """Full operating context for AI CoS"""
    # Business basics
    company_name: Optional[str] = None
    business_stage: str = "idea"  # idea, building, scaling
    primary_goal: str = ""
    biggest_challenge: str = ""

    # Team context
    team_members: List[TeamMemberContext] = []
    founder_decision_areas: List[str] = []  # Only founder can decide

    # Sprint context
    current_sprint: Optional[SprintContext] = None

    # Backlog context
    backlog: List[BacklogItem] = []
    explicitly_cut: List[str] = []  # Things we said NO to

    # Communication preferences
    accountability_style: str = "direct"  # direct, gentle, encouraging
    founder_voice_notes: str = ""  # How founder writes emails

    # Time patterns
    focus_hours: Optional[str] = None  # "9am-12pm"
    no_meeting_days: List[str] = []  # ["Friday"]


# ==============================================================================
# Operating Context Manager
# ==============================================================================

class OperatingContextManager:
    """
    Manages the operating context for a founder.

    This is what makes the AI a personalized CoS instead of generic assistant.
    """

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_full_context(self) -> Dict:
        """
        Get the complete operating context for AI consumption.

        Returns a dict ready to be passed to the CoS engine.
        """
        user = self.db.query(models.User).filter(
            models.User.id == self.user_id
        ).first()

        if not user:
            return self._get_default_context()

        context = {
            "business": {
                "company_name": user.full_name or "Your Company",
                "stage": user.business_stage or "building",
                "primary_goal": user.primary_goal or "Not set",
                "biggest_challenge": user.biggest_challenge if hasattr(user, 'biggest_challenge') else "Not set"
            },
            "team": self._get_team_context(),
            "sprint": self._get_sprint_context(),
            "backlog": self._get_backlog_context(),
            "preferences": {
                "accountability_style": user.accountability_style or "direct",
                "focus_hours": None,
                "no_meeting_days": []
            }
        }

        return context

    def _get_team_context(self) -> List[Dict]:
        """Get team members for delegation suggestions"""
        # Check if TeamMember model exists
        if hasattr(models, 'TeamMember'):
            members = self.db.query(models.TeamMember).filter(
                models.TeamMember.user_id == self.user_id
            ).all()

            return [{
                "name": m.name,
                "role": m.role,
                "email": m.email,
                "decision_rights": m.decision_rights or [],
                "current_load": m.current_load or "normal"
            } for m in members]

        # No team members yet - solo founder mode
        return []

    def _get_sprint_context(self) -> Optional[Dict]:
        """Get active sprint context"""
        if hasattr(models, 'Sprint'):
            sprint = self.db.query(models.Sprint).filter(
                models.Sprint.user_id == self.user_id,
                models.Sprint.status == "active"
            ).first()

            if sprint:
                return {
                    "name": sprint.name,
                    "goal": sprint.goal,
                    "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                    "priorities": sprint.priorities or []
                }

        # Fallback to OKR if no sprint
        if hasattr(models, 'OKR'):
            okr = self.db.query(models.OKR).filter(
                models.OKR.user_id == self.user_id,
                models.OKR.achieved.is_(None)  # Active OKR
            ).first()

            if okr:
                return {
                    "name": f"Q{okr.quarter} OKR",
                    "goal": okr.objective,
                    "priorities": okr.key_results or []
                }

        return None

    def _get_backlog_context(self) -> List[Dict]:
        """Get deprioritized items (distraction prevention)"""
        # For now, return empty - will be populated as users add items
        return []

    def _get_default_context(self) -> Dict:
        """Default context for new users"""
        return {
            "business": {
                "company_name": "Your Company",
                "stage": "building",
                "primary_goal": "Not set - complete onboarding",
                "biggest_challenge": "Unknown"
            },
            "team": [],
            "sprint": None,
            "backlog": [],
            "preferences": {
                "accountability_style": "direct",
                "focus_hours": None,
                "no_meeting_days": []
            }
        }

    # ==========================================================================
    # Context Updates
    # ==========================================================================

    def update_team_member(
        self,
        name: str,
        role: str,
        email: Optional[str] = None,
        decision_rights: List[str] = None,
        current_load: str = "normal"
    ) -> Dict:
        """Add or update a team member"""
        if not hasattr(models, 'TeamMember'):
            return {"error": "TeamMember model not available"}

        member = self.db.query(models.TeamMember).filter(
            models.TeamMember.user_id == self.user_id,
            models.TeamMember.name == name
        ).first()

        if member:
            member.role = role
            member.email = email
            member.decision_rights = decision_rights or []
            member.current_load = current_load
        else:
            member = models.TeamMember(
                user_id=self.user_id,
                name=name,
                role=role,
                email=email,
                decision_rights=decision_rights or [],
                current_load=current_load
            )
            self.db.add(member)

        self.db.commit()
        return {"status": "success", "member": name}

    def set_sprint(
        self,
        name: str,
        goal: str,
        end_date: date,
        priorities: List[Dict]
    ) -> Dict:
        """Set or update current sprint"""
        if not hasattr(models, 'Sprint'):
            return {"error": "Sprint model not available"}

        # Deactivate any existing sprints
        self.db.query(models.Sprint).filter(
            models.Sprint.user_id == self.user_id,
            models.Sprint.status == "active"
        ).update({"status": "completed"})

        # Create new sprint
        sprint = models.Sprint(
            user_id=self.user_id,
            name=name,
            goal=goal,
            start_date=datetime.utcnow(),
            end_date=datetime.combine(end_date, datetime.min.time()),
            priorities=priorities,
            status="active"
        )
        self.db.add(sprint)
        self.db.commit()

        return {"status": "success", "sprint": name}

    def add_to_backlog(
        self,
        title: str,
        reason: str,
        revisit_date: Optional[date] = None
    ) -> Dict:
        """Add item to backlog (explicitly not doing)"""
        # Store in a simple JSON field on user for now
        # Will be proper model in Phase 2
        return {
            "title": title,
            "reason_deprioritized": reason,
            "revisit_date": revisit_date.isoformat() if revisit_date else None,
            "status": "added_to_backlog"
        }


# ==============================================================================
# Factory function
# ==============================================================================

def get_operating_context(db: Session, user_id: int) -> OperatingContextManager:
    """Get operating context manager for a user"""
    return OperatingContextManager(db, user_id)


def get_context_for_ai(db: Session, user_id: int) -> Dict:
    """Quick helper to get context dict for AI consumption"""
    manager = OperatingContextManager(db, user_id)
    return manager.get_full_context()
