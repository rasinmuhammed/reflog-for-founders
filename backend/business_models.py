from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from database import Base
from pydantic import BaseModel
from typing import Optional, List, Dict

# SQLAlchemy Models for Business Tracking


class BusinessMetric(Base):
    __tablename__ = "business_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    metric_type = Column(String(100))  # mrr, users, runway, etc.
    value = Column(Float)
    unit = Column(String(50), nullable=True)  # dollars, days, count, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    context = Column(JSON, nullable=True)  # Additional context


class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    week_start = Column(DateTime)
    wins = Column(JSON)  # ["Closed 2 customers", "Shipped feature X"]
    key_metrics = Column(JSON)  # {"mrr": 8400, "users": 1247}
    biggest_blocker = Column(Text)
    what_avoiding = Column(Text)
    next_week_focus = Column(Text)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class OKR(Base):
    __tablename__ = "okrs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    quarter = Column(String(10))  # "2025-Q2"
    objective = Column(Text)
    key_results = Column(JSON)  # [{"kr": "Reach $10K MRR", "target": 10000, "current": 8400}]
    progress_updates = Column(JSON)  # Weekly check-ins
    achieved = Column(Boolean, nullable=True)


class TimeAllocation(Base):
    __tablename__ = "time_allocation"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String(50))  # 'product', 'sales', 'fundraising', 'ops', 'marketing'
    hours = Column(Float)
    notes = Column(Text, nullable=True)

# Pydantic Schemas


class BusinessMetricCreate(BaseModel):
    metric_type: str
    value: float
    target: Optional[float] = None
    notes: Optional[str] = None


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
    key_metrics: Dict[str, float]  # {"mrr": 8400, "users": 1247}
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
    quarter: str  # "2025-Q2"
    objective: str
    key_results: List[Dict]  # [{"kr": "Reach $10K MRR", "target": 10000, "current": 8400}]


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
    category: str  # 'product', 'sales', 'fundraising', 'ops', 'marketing'
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
