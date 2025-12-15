"""
Pattern Analysis Service
Analyzes check-in history to detect avoidance patterns and say-vs-do gaps.
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import Counter
import re


def analyze_avoidance_patterns(checkins: List[Dict]) -> Dict:
    """
    Analyze check-in history for avoidance patterns.
    Returns insights about what user says vs what they do.
    """
    if not checkins or len(checkins) < 3:
        return {
            "has_patterns": False,
            "message": "Need more check-ins to detect patterns",
            "patterns": []
        }
    
    # Track commitments and outcomes
    commitments = []
    shipped = 0
    not_shipped = 0
    excuses = []
    
    for checkin in checkins:
        commitment = checkin.get("commitment") or checkin.get("did_i_ship_yesterday", "")
        shipped_today = checkin.get("shipped", checkin.get("shipped_yesterday", False))
        excuse = checkin.get("excuse") or checkin.get("blocker", "")
        
        if commitment:
            commitments.append(commitment.lower())
        if shipped_today:
            shipped += 1
        else:
            not_shipped += 1
        if excuse:
            excuses.append(excuse.lower())
    
    # Calculate ship rate
    total = shipped + not_shipped
    ship_rate = (shipped / total * 100) if total > 0 else 0
    
    # Extract common topics from commitments
    topic_keywords = {
        "sales": ["sales", "customer", "call", "outreach", "cold", "lead", "prospect", "pitch"],
        "product": ["build", "code", "feature", "ship", "deploy", "launch", "fix", "bug"],
        "marketing": ["content", "post", "social", "email", "campaign", "ads", "blog"],
        "admin": ["meeting", "report", "documentation", "admin", "organize", "plan"],
        "hiring": ["hire", "interview", "candidate", "recruit", "team"]
    }
    
    topic_counts = Counter()
    avoided_topics = Counter()
    
    for i, checkin in enumerate(checkins):
        commitment = (checkin.get("commitment") or "").lower()
        shipped_result = checkin.get("shipped", True)
        
        for topic, keywords in topic_keywords.items():
            if any(kw in commitment for kw in keywords):
                topic_counts[topic] += 1
                if not shipped_result:
                    avoided_topics[topic] += 1
    
    # Build avoidance insights
    patterns = []
    
    for topic, avoided_count in avoided_topics.most_common(3):
        total_mentions = topic_counts[topic]
        if total_mentions >= 2 and avoided_count / total_mentions > 0.5:
            patterns.append({
                "topic": topic.title(),
                "mentioned": total_mentions,
                "avoided": avoided_count,
                "avoidance_rate": round(avoided_count / total_mentions * 100),
                "message": f"You mention {topic} often but rarely follow through"
            })
    
    # Analyze excuse patterns
    excuse_patterns = []
    excuse_keywords = {
        "time": ["time", "busy", "schedule", "later", "tomorrow"],
        "energy": ["tired", "energy", "exhausted", "burned"],
        "external": ["waiting", "someone", "depend", "blocked"],
        "priority": ["urgent", "priority", "important", "other"]
    }
    
    excuse_counter = Counter()
    for excuse in excuses:
        for category, keywords in excuse_keywords.items():
            if any(kw in excuse for kw in keywords):
                excuse_counter[category] += 1
    
    if excuse_counter:
        top_excuse = excuse_counter.most_common(1)[0]
        excuse_patterns.append({
            "category": top_excuse[0].title(),
            "count": top_excuse[1],
            "message": f"Your go-to excuse: {top_excuse[0]}"
        })
    
    # Calculate best/worst days
    day_performance = {}
    for checkin in checkins:
        ts = checkin.get("timestamp") or checkin.get("created_at")
        if ts:
            if isinstance(ts, str):
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except:
                    continue
            else:
                dt = ts
            day_name = dt.strftime("%A")
            if day_name not in day_performance:
                day_performance[day_name] = {"shipped": 0, "total": 0}
            day_performance[day_name]["total"] += 1
            if checkin.get("shipped", checkin.get("shipped_yesterday", False)):
                day_performance[day_name]["shipped"] += 1
    
    best_day = None
    worst_day = None
    best_rate = 0
    worst_rate = 100
    
    for day, stats in day_performance.items():
        if stats["total"] >= 2:
            rate = stats["shipped"] / stats["total"] * 100
            if rate > best_rate:
                best_rate = rate
                best_day = day
            if rate < worst_rate:
                worst_rate = rate
                worst_day = day
    
    return {
        "has_patterns": len(patterns) > 0 or len(excuse_patterns) > 0,
        "ship_rate": round(ship_rate),
        "total_checkins": len(checkins),
        "shipped_count": shipped,
        "patterns": patterns,
        "excuse_patterns": excuse_patterns,
        "best_day": {"day": best_day, "rate": round(best_rate)} if best_day else None,
        "worst_day": {"day": worst_day, "rate": round(worst_rate)} if worst_day else None,
        "brutal_insight": generate_brutal_insight(patterns, ship_rate, excuse_patterns)
    }


def generate_brutal_insight(patterns: List, ship_rate: float, excuse_patterns: List) -> str:
    """Generate a brutally honest insight based on patterns."""
    if ship_rate >= 80:
        return "You're executing. Keep shipping."
    
    if ship_rate < 40:
        if patterns:
            topic = patterns[0]["topic"].lower()
            return f"Let's be real: you're avoiding {topic}. It's been weeks. Either do it or admit it's not happening."
        return "Your ship rate is below 40%. Something is fundamentally broken in how you work."
    
    if excuse_patterns:
        excuse = excuse_patterns[0]["category"].lower()
        if excuse == "time":
            return "You keep saying 'no time.' But time isn't the problem. Priorities are."
        if excuse == "energy":
            return "Feeling tired isn't an excuse when your runway is limited. Rest, then ship."
        if excuse == "external":
            return "Stop waiting for others. What can YOU ship without any dependencies?"
    
    if patterns:
        return f"You talk about {patterns[0]['topic'].lower()} but don't deliver. Actions > intentions."
    
    return "Consistency is your biggest gap. Focus on shipping something small every single day."


def calculate_progress_comparison(checkins: List[Dict], weeks_back: int = 4) -> Dict:
    """
    Compare performance between now and X weeks ago.
    """
    if not checkins:
        return {"has_data": False}
    
    now = datetime.now()
    cutoff = now - timedelta(weeks=weeks_back)
    
    recent = []  # Last 7 days
    past = []    # 4 weeks ago window
    
    for checkin in checkins:
        ts = checkin.get("timestamp") or checkin.get("created_at")
        if ts:
            if isinstance(ts, str):
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except:
                    continue
            else:
                dt = ts
            
            days_ago = (now - dt.replace(tzinfo=None)).days
            if days_ago <= 7:
                recent.append(checkin)
            elif weeks_back * 7 <= days_ago <= (weeks_back + 1) * 7:
                past.append(checkin)
    
    def calc_rate(items):
        if not items:
            return None
        shipped = sum(1 for i in items if i.get("shipped", i.get("shipped_yesterday", False)))
        return round(shipped / len(items) * 100)
    
    recent_rate = calc_rate(recent)
    past_rate = calc_rate(past)
    
    if recent_rate is None:
        return {"has_data": False}
    
    improvement = None
    if past_rate is not None and past_rate > 0:
        improvement = recent_rate - past_rate
    
    return {
        "has_data": True,
        "recent_rate": recent_rate,
        "past_rate": past_rate,
        "improvement": improvement,
        "recent_count": len(recent),
        "past_count": len(past),
        "message": generate_progress_message(recent_rate, past_rate, improvement)
    }


def generate_progress_message(recent: int, past: Optional[int], improvement: Optional[int]) -> str:
    """Generate a message about progress."""
    if past is None or improvement is None:
        if recent >= 70:
            return "Strong start. Keep this momentum."
        return "Building your track record. Commit to consistency."
    
    if improvement > 20:
        return f"Massive improvement: {past}% → {recent}%. You're transforming."
    if improvement > 0:
        return f"Progress: {past}% → {recent}%. Keep pushing."
    if improvement < -20:
        return f"Slipping: {past}% → {recent}%. What changed?"
    if improvement < 0:
        return f"Small dip: {past}% → {recent}%. Refocus this week."
    
    return "Consistent performance. Time to level up."
