"""
Pydantic schemas for API request/response models.
Extracted from main.py to avoid circular imports.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class UnifiedMetricsUpdate(BaseModel):
    """Request model for updating all metrics at once from MetricsInput component"""
    mrr: float = 0
    customers: int = 0
    activeUsers: int = 0
    runway: float = 0
    churnRate: float = 0
    salesCalls: int = 0
    meetingsBooked: int = 0


class TimeAllocationEntry(BaseModel):
    """Request model for saving daily time allocation"""
    entries: Dict[str, float] = Field(
        default_factory=dict,
        description="Category to hours mapping, e.g. {'product': 4, 'sales': 2}"
    )


class DashboardResponse(BaseModel):
    """Response model for dashboard data"""
    user_id: int
    email: str
    streak: int
    total_checkins: int
    shipped_count: int
    ship_rate: float
    recent_checkins: List[dict]
    current_streak: int
    longest_streak: int
    weekly_breakdown: Dict[str, int]


class CommitmentStatsResponse(BaseModel):
    """Response model for commitment statistics"""
    total_commitments: int
    shipped_count: int
    failed_count: int
    pending_count: int
    ship_rate: float
    current_streak: int
    longest_streak: int
    weekly_breakdown: Dict[str, int]
    avg_energy: Optional[float] = None


class FounderScoreResponse(BaseModel):
    """Response model for founder composite health score"""
    overall_score: int = Field(ge=0, le=100)
    execution_score: int
    consistency_score: int
    momentum_score: int
    metrics_score: int
    insights: List[str]
    trend: str  # "up", "down", "stable"


class GitHubActivityResponse(BaseModel):
    """Response model for GitHub activity data"""
    commits: int
    prs_merged: int
    issues_commented: int
    impact_score: int
    period_days: int
    last_updated: datetime


class BoardMemberResponse(BaseModel):
    """Response model for a board advisor's input"""
    role: str
    perspective: str
    key_insight: str
    action_item: Optional[str] = None


class BoardDeliberationResponse(BaseModel):
    """Response model for full board deliberation"""
    topic: str
    board_members: List[BoardMemberResponse]
    consensus: Optional[str] = None
    dissenting_views: List[str] = []
    recommended_actions: List[str]
