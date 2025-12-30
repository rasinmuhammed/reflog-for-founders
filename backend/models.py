from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from database import Base
from pydantic import BaseModel
from typing import Optional, List, Dict

# ==============================================================================
# SQLAlchemy Models (Database Tables)
# ==============================================================================


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    github_username = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    onboarding_complete = Column(Boolean, default=False)

    # Founder-specific fields
    business_stage = Column(String(100), nullable=True)
    primary_goal = Column(Text, nullable=True)
    check_in_frequency = Column(String(50), default='daily')
    accountability_style = Column(String(50), default='balanced')
    key_metrics = Column(JSON, nullable=True)
    work_preferences = Column(JSON, nullable=True)

    # NEW: User's own Groq API key (encrypted in production)
    groq_api_key = Column(String(500), nullable=True)

    # Notification preferences
    email_notifications_enabled = Column(Boolean, default=True)
    morning_reminder_time = Column(String(10), default='09:00')
    evening_reminder_time = Column(String(10), default='18:00')
    timezone = Column(String(50), default='UTC')

    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_checkin_date = Column(DateTime, nullable=True)

    @property
    def has_groq_key(self) -> bool:
        return bool(self.groq_api_key)

# ... (rest of the models remain the same)


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    energy_level = Column(Integer)
    avoiding_what = Column(Text)
    commitment = Column(Text)
    shipped = Column(Boolean, nullable=True)
    excuse = Column(Text, nullable=True)
    mood = Column(String(100), nullable=True)
    ai_analysis = Column(Text, nullable=True)
    agent_debate = Column(JSON, nullable=True)

    # Founder-specific fields
    revenue_update = Column(Float, nullable=True)
    user_update = Column(Integer, nullable=True)
    customer_wins = Column(Text, nullable=True)
    blockers = Column(Text, nullable=True)

    # Indexes for performance
    __table_args__ = (
        Index('idx_checkin_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_checkin_user_shipped', 'user_id', 'shipped'),
    )


class GitHubAnalysis(Base):
    __tablename__ = "github_analysis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    username = Column(String(255))
    total_repos = Column(Integer)
    active_repos = Column(Integer)
    total_commits = Column(Integer)
    languages = Column(JSON)
    patterns = Column(JSON)
    analyzed_at = Column(DateTime, default=datetime.utcnow)


class AgentAdvice(Base):
    __tablename__ = "agent_advice"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    agent_name = Column(String(100))
    advice = Column(Text)
    evidence = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    followed = Column(Boolean, nullable=True)
    outcome = Column(Text, nullable=True)
    interaction_type = Column(String(50), default="analysis")


class LifeEvent(Base):
    __tablename__ = "life_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    event_type = Column(String(100))
    description = Column(Text)
    context = Column(JSON, nullable=True, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    time_horizon = Column(String(50), nullable=True)
    outcome = Column(Text, nullable=True)

    # Pivot Simulator fields
    simulation_result = Column(JSON, nullable=True)  # AI simulation output
    simulation_type = Column(String(50), nullable=True)  # "pivot", "feature", "market"
    survival_probability = Column(Float, nullable=True)  # 0-100%
    comparable_startups = Column(JSON, nullable=True)  # Similar pivots from data
    simulation_date = Column(DateTime, nullable=True)
    brutal_truth = Column(Text, nullable=True)  # One paragraph honest assessment

    # Index for user queries
    __table_args__ = (
        Index('idx_life_event_user_time', 'user_id', 'timestamp'),
        Index('idx_life_event_type', 'user_id', 'event_type'),
    )


class ShadowData(Base):
    """Stores metadata from Local Truth Agent - NO CODE, only stats"""
    __tablename__ = "shadow_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    submission_date = Column(DateTime, default=datetime.utcnow)

    # Git metadata (NEVER actual code)
    total_commits = Column(Integer, default=0)
    by_directory = Column(JSON, nullable=True)  # {"frontend": 40, "backend": 10}
    by_file_type = Column(JSON, nullable=True)  # {".css": 30, ".py": 20}
    commit_hours = Column(JSON, nullable=True)  # Distribution by hour of day
    commit_days = Column(JSON, nullable=True)  # Distribution by day of week
    focus_score = Column(Float, nullable=True)  # 0-100, how scattered vs focused

    # Analysis results
    stated_priority = Column(String(100), nullable=True)
    actual_focus = Column(String(100), nullable=True)
    discrepancy_score = Column(Float, nullable=True)  # 0-100, how far off

    # AI-generated roast
    roast_text = Column(Text, nullable=True)
    truth_bombs = Column(JSON, nullable=True)  # List of uncomfortable truths

    # Indexes for fast queries
    __table_args__ = (
        Index('idx_shadow_user_date', 'user_id', 'submission_date'),
        Index('idx_shadow_user_latest', 'user_id', 'id'),
    )


class BusinessMetric(Base):
    __tablename__ = "business_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    metric_type = Column(String(100))
    value = Column(Float)
    unit = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    context = Column(JSON, nullable=True)


class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    week_start = Column(DateTime)
    wins = Column(JSON)
    key_metrics = Column(JSON)
    biggest_blocker = Column(Text)
    what_avoiding = Column(Text)
    next_week_focus = Column(Text)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class OKR(Base):
    __tablename__ = "okrs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    quarter = Column(String(10))
    objective = Column(Text)
    key_results = Column(JSON)
    progress_updates = Column(JSON)
    achieved = Column(Boolean, nullable=True)


class TimeAllocation(Base):
    __tablename__ = "time_allocation"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String(50))
    hours = Column(Float)
    notes = Column(Text, nullable=True)


# ==============================================================================
# Google OAuth Token Storage
# ==============================================================================

class GoogleToken(Base):
    """
    Stores Google OAuth tokens for Calendar and Gmail access.
    Tokens are encrypted at rest for security.
    """
    __tablename__ = "google_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, unique=True)  # One token per user

    # OAuth tokens (encrypted)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)

    # Scopes granted
    scopes = Column(JSON, nullable=True)  # List of granted scopes

    # Connection status
    is_connected = Column(Boolean, default=True)
    last_refreshed = Column(DateTime, default=datetime.utcnow)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ==============================================================================
# AI Chief of Staff Models
# ==============================================================================

class AIConversationMemory(Base):
    """
    Persistent memory for AI conversations.
    Stores summaries of past interactions to provide context for future ones.
    This is a lightweight RAG alternative - no vector DB required.
    """
    __tablename__ = "ai_conversation_memory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)

    # Conversation metadata
    conversation_type = Column(String(50))  # chat, daily_brief, meeting_prep, weekly_review
    topic = Column(String(500), nullable=True)  # Auto-extracted topic

    # Content
    user_input = Column(Text)  # What the user said/asked
    ai_response_summary = Column(Text)  # Condensed summary of AI response
    key_insights = Column(JSON, nullable=True)  # Extracted insights/decisions

    # Context markers
    importance = Column(String(20), default="normal")  # low, normal, high, critical
    referenced_count = Column(Integer, default=0)  # How often this memory was used

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_referenced_at = Column(DateTime, nullable=True)


class ActionItem(Base):
    """Every action must have owner + deadline - the CoS core principle"""
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(Text)
    description = Column(Text, nullable=True)
    owner = Column(String(255))  # Who's responsible (REQUIRED)
    deadline = Column(DateTime)  # When it's due (REQUIRED)
    priority = Column(String(20), default="medium")  # high, medium, low
    status = Column(String(20), default="pending")  # pending, completed, overdue, delegated

    # Source tracking
    source_type = Column(String(50), nullable=True)  # meeting, email, manual, daily_brief
    source_id = Column(Integer, nullable=True)  # ID of meeting/email source

    # Follow-up tracking
    follow_up_sent = Column(Boolean, default=False)
    follow_up_date = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    context = Column(Text, nullable=True)  # Additional context


class Meeting(Base):
    """Track meetings with decisions + follow-ups"""
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)

    # Basic info
    title = Column(String(500))
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime)
    duration_minutes = Column(Integer, default=30)
    attendees = Column(JSON)  # List of {name, email, role}

    # Calendar integration
    calendar_event_id = Column(String(255), nullable=True)
    calendar_link = Column(String(500), nullable=True)

    # CoS Intelligence
    prep_brief = Column(JSON, nullable=True)  # AI-generated prep
    notes = Column(Text, nullable=True)  # Raw meeting notes
    wrap = Column(JSON, nullable=True)  # Post-meeting wrap output

    # Extracted content
    decisions = Column(JSON, nullable=True)  # List of decisions made
    follow_up_draft = Column(Text, nullable=True)  # Draft follow-up email
    follow_up_sent = Column(Boolean, default=False)

    # Status
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)


class Sprint(Base):
    """Current sprint context for AI priority alignment"""
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)

    name = Column(String(255))
    goal = Column(Text)

    start_date = Column(DateTime)
    end_date = Column(DateTime)

    # Priorities (ranked list)
    priorities = Column(JSON)  # [{title, status, owner, notes}]

    # Status tracking
    status = Column(String(20), default="active")  # active, completed, cancelled
    blockers = Column(JSON, nullable=True)  # List of current blockers
    at_risk = Column(JSON, nullable=True)  # Items that might slip

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class TeamMember(Base):
    """Team context for delegation decisions"""
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # The founder who owns this team

    name = Column(String(255))
    role = Column(String(255))
    email = Column(String(255), nullable=True)

    # Delegation context
    decision_rights = Column(JSON, nullable=True)  # What they can decide without founder
    responsibilities = Column(JSON, nullable=True)  # Areas they own
    strengths = Column(JSON, nullable=True)  # What they're good at

    # Capacity tracking
    current_load = Column(String(20), default="normal")  # light, normal, overloaded
    availability_notes = Column(Text, nullable=True)  # "out next week", "busy with X"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DailyBrief(Base):
    """Store daily command briefs for history/patterns"""
    __tablename__ = "daily_briefs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)

    date = Column(DateTime, default=datetime.utcnow)
    brief_content = Column(JSON)  # Full brief output

    # Key extractions for quick access
    top_priorities = Column(JSON, nullable=True)
    decision_queue = Column(JSON, nullable=True)
    follow_ups_flagged = Column(Integer, default=0)

    # Tracking
    viewed = Column(Boolean, default=False)
    actions_taken = Column(Integer, default=0)


# ==============================================================================
# Pydantic Schemas (API Data Models)
# ==============================================================================

class UserCreate(BaseModel):
    email: str
    full_name: Optional[str] = None
    github_username: Optional[str] = None


class OnboardingData(BaseModel):
    business_stage: str
    primary_goal: str
    check_in_frequency: str
    accountability_style: str
    key_metrics: List[str]
    biggest_challenge: str
    work_style: str
    github_username: Optional[str] = None
    groq_api_key: Optional[str] = None  # NEW: Optional API key during onboarding


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    github_username: Optional[str]
    onboarding_complete: bool
    business_stage: Optional[str]
    primary_goal: Optional[str]
    check_in_frequency: str
    accountability_style: str
    has_groq_key: bool
    xp: int
    level: int
    current_streak: int

    class Config:
        from_attributes = True


class GroqApiKeyUpdate(BaseModel):
    groq_api_key: str


class CheckInCreate(BaseModel):
    energy_level: int
    avoiding_what: str
    commitment: str
    mood: Optional[str] = None
    revenue_update: Optional[float] = None
    customer_wins: Optional[str] = None
    blockers: Optional[str] = None


class CheckInUpdate(BaseModel):
    shipped: bool
    excuse: Optional[str] = None


class CheckInResponse(BaseModel):
    id: int
    timestamp: datetime
    energy_level: int
    avoiding_what: str
    commitment: str
    shipped: Optional[bool]
    excuse: Optional[str]
    mood: Optional[str]
    ai_analysis: Optional[str]
    agent_debate: Optional[Dict]
    revenue_update: Optional[float]
    customer_wins: Optional[str]
    blockers: Optional[str]

    class Config:
        from_attributes = True


class AgentAdviceResponse(BaseModel):
    id: int
    agent_name: str
    advice: str
    evidence: Dict
    created_at: datetime
    interaction_type: str

    class Config:
        from_attributes = True


class GitHubAnalysisResponse(BaseModel):
    username: str
    total_repos: int
    active_repos: int
    total_commits: int
    languages: Dict
    patterns: Dict
    analyzed_at: datetime

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict] = None


class LifeDecisionCreate(BaseModel):
    title: str
    description: str
    decision_type: str
    impact_areas: List[str]
    time_horizon: Optional[str] = "medium_term"
    context: Optional[Dict] = None


class LifeDecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    decision_type: str
    impact_areas: List[str]
    timestamp: datetime
    time_horizon: Optional[str]
    ai_analysis: Optional[str] = None
    lessons_learned: Optional[List[str]] = None

    class Config:
        from_attributes = True


class BusinessMetricCreate(BaseModel):
    metric_type: str
    value: float
    unit: Optional[str] = None
    context: Optional[Dict] = None


class BusinessMetricResponse(BaseModel):
    id: int
    metric_type: str
    value: float
    target: Optional[float]
    date: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


class WeeklyReviewCreate(BaseModel):
    wins: List[str]
    key_metrics: Dict[str, float]
    biggest_blocker: str
    what_avoiding: str
    next_week_focus: str


class WeeklyReviewResponse(BaseModel):
    id: int
    week_start: datetime
    wins: List[str]
    key_metrics: Dict[str, float]
    biggest_blocker: str
    what_avoiding: str
    next_week_focus: str
    ai_analysis: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class OKRCreate(BaseModel):
    quarter: str
    objective: str
    key_results: List[Dict]


class OKRResponse(BaseModel):
    id: int
    quarter: str
    objective: str
    key_results: List[Dict]
    progress_updates: Optional[List[Dict]]
    achieved: Optional[bool]

    class Config:
        from_attributes = True


class TimeAllocationCreate(BaseModel):
    category: str
    hours: float
    notes: Optional[str] = None


class TimeAllocationResponse(BaseModel):
    id: int
    date: datetime
    category: str
    hours: float
    notes: Optional[str]

    class Config:
        from_attributes = True


class NotificationPreferences(BaseModel):
    email_notifications_enabled: bool
    morning_reminder_time: Optional[str] = '09:00'
    evening_reminder_time: Optional[str] = '18:00'
    timezone: Optional[str] = 'UTC'


class NotificationPreferencesResponse(BaseModel):
    email_notifications_enabled: bool
    morning_reminder_time: str
    evening_reminder_time: str
    timezone: str

    class Config:
        from_attributes = True


# ==============================================================================
# AI Chief of Staff Pydantic Schemas
# ==============================================================================

class ActionItemCreate(BaseModel):
    title: str
    owner: str
    deadline: str  # ISO date string
    priority: str = "medium"
    description: Optional[str] = None
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    context: Optional[str] = None


class ActionItemUpdate(BaseModel):
    status: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None


class ActionItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    owner: str
    deadline: datetime
    priority: str
    status: str
    source_type: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class MeetingCreate(BaseModel):
    title: str
    scheduled_at: str  # ISO datetime
    duration_minutes: int = 30
    attendees: List[Dict] = []  # [{name, email, role}]
    description: Optional[str] = None


class MeetingNotesInput(BaseModel):
    notes: str


class MeetingResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    scheduled_at: datetime
    duration_minutes: int
    attendees: List[Dict]
    prep_brief: Optional[Dict]
    notes: Optional[str]
    wrap: Optional[Dict]
    decisions: Optional[List[Dict]]
    follow_up_draft: Optional[str]
    status: str

    class Config:
        from_attributes = True


class SprintCreate(BaseModel):
    name: str
    goal: str
    end_date: str  # ISO date
    priorities: List[Dict] = []  # [{title, status, owner}]


class SprintResponse(BaseModel):
    id: int
    name: str
    goal: str
    start_date: datetime
    end_date: datetime
    priorities: List[Dict]
    status: str
    blockers: Optional[List[str]]

    class Config:
        from_attributes = True


class TeamMemberCreate(BaseModel):
    name: str
    role: str
    email: Optional[str] = None
    decision_rights: List[str] = []
    responsibilities: List[str] = []
    current_load: str = "normal"


class TeamMemberResponse(BaseModel):
    id: int
    name: str
    role: str
    email: Optional[str]
    decision_rights: Optional[List[str]]
    responsibilities: Optional[List[str]]
    current_load: str

    class Config:
        from_attributes = True


class DailyBriefResponse(BaseModel):
    id: int
    date: datetime
    brief_content: Dict
    top_priorities: Optional[List[Dict]]
    decision_queue: Optional[List[Dict]]
    follow_ups_flagged: int
    viewed: bool

    class Config:
        from_attributes = True
