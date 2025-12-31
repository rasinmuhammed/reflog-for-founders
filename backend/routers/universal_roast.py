"""
Universal Roast Generator

Generates personalized roasts for founders based on their accountability source.
"""

from typing import Dict, List
from datetime import datetime, timedelta


def generate_universal_roast(
    stated_priority: str,
    work_source: str,
    user_context: Dict,
    activity_data: Dict
) -> Dict:
    """
    Generate roast based on founder type and actual activity
    
    Args:
        stated_priority: What the founder says they focus on
        work_source: github, calendar, email, or manual
        user_context: User metadata (goals, stage, etc.)
        activity_data: Source-specific activity metrics
        
    Returns:
        Dict with roast, discrepancy_score, truth_bombs, focus_score
    """
    
    if work_source == "calendar":
        return _roast_calendar_founder(stated_priority, activity_data)
    elif work_source == "email":
        return _roast_email_founder(stated_priority, activity_data)
    elif work_source == "manual":
        return _roast_manual_founder(stated_priority, activity_data)
    else:  # github (default)
        return _roast_github_founder(stated_priority, activity_data)


def _roast_calendar_founder(stated_priority: str, data: Dict) -> Dict:
    """Roast for Sales/CEO founders based on calendar activity"""
    
    meeting_count = data.get("meeting_count", 0)
    focus_time_hours = data.get("focus_time_hours", 0)
    back_to_back_ratio = data.get("back_to_back_ratio", 0)
    
    roast = ""
    truth_bombs = []
    discrepancy_score = 0
    
    # Sales/Revenue founders with low meetings
    if "sales" in stated_priority.lower() or "revenue" in stated_priority.lower():
        if meeting_count < 5:
            roast = (
                f"You call yourself a CEO focused on '{stated_priority}', "
                f"but your calendar has {meeting_count} meetings this week. "
                "A retired librarian has a busier schedule than you."
            )
            discrepancy_score = 85
            truth_bombs.append(f"Only {meeting_count} meetings for a 'sales-focused' CEO? Your pipeline is a desert.")
        else:
            roast = (
                f"You have {meeting_count} meetings this week. That's good. "
                "But are they the RIGHT meetings, or just calendar filler to look busy?"
            )
            discrepancy_score = 30
    
    # Over-meeting founders
    elif meeting_count > 25:
        roast = (
            f"You had {meeting_count} meetings this week. At this rate, "
            "your calendar IS your job. When do you actually build anything?"
        )
        discrepancy_score = 70
        truth_bombs.append("Meeting addiction detected. You're confusing 'busy' with 'productive'.")
    
    # Back-to-back meeting hell
    if back_to_back_ratio > 0.7:
        truth_bombs.append(
            f"{int(back_to_back_ratio * 100)}% of your meetings are back-to-back. "
            "No time to think = no time to lead."
        )
    
    # Low focus time
    if focus_time_hours < 2:
        truth_bombs.append(
            f"Only {focus_time_hours}h of focus time this week. "
            "You're a reactive founder, not a strategic one."
        )
    
    # Calculate focus score (inverse of meeting chaos)
    focus_score = max(0, 100 - (meeting_count * 2) - (back_to_back_ratio * 30))
    
    if not roast:
        roast = f"Your calendar looks... normal. Which might be the problem. Normal founders don't build exceptional companies."
        discrepancy_score = 40
    
    if not truth_bombs:
        truth_bombs.append("Your calendar hygiene is decent, but 'decent' doesn't win markets.")
    
    return {
        "roast": roast,
        "discrepancy_score": int(discrepancy_score),
        "truth_bombs": truth_bombs,
        "focus_score": int(focus_score),
        "actual_focus": f"{meeting_count} meetings/week, {focus_time_hours}h focus time"
    }


def _roast_email_founder(stated_priority: str, data: Dict) -> Dict:
    """Roast for Operations founders based on email activity"""
    
    emails_sent = data.get("emails_sent", 0)
    avg_response_time_hours = data.get("avg_response_time", 24)
    
    roast = ""
    truth_bombs = []
    discrepancy_score = 0
    
    # Low email volume for operations
    if "operations" in stated_priority.lower() or "growth" in stated_priority.lower():
        if emails_sent < 20:
            roast = (
                f"You say you're focused on '{stated_priority}', "
                f"but you sent only {emails_sent} emails this week. "
                "Either you're delegating like a boss or hiding from the work."
            )
            discrepancy_score = 75
            truth_bombs.append("Low email = low action. You're either strategic or stuck.")
        else:
            roast = f"You sent {emails_sent} emails. That's participation. But volume ≠ value."
            discrepancy_score = 40
    
    # Slow response times
    if avg_response_time_hours > 12:
        truth_bombs.append(
            f"Average response time: {int(avg_response_time_hours)}h. "
            "In startup time, that's geological pace."
        )
    
    # Email overload
    if emails_sent > 100:
        roast = (
            f"You sent {emails_sent} emails this week. You're either incredibly productive "
            "or drowning in fake work. Email is not execution."
        )
        discrepancy_score = 60
        truth_bombs.append("Email addiction detected. If you spent this time building, you'd be further along.")
    
    focus_score = min(100, emails_sent) if emails_sent < 50 else max(0, 100 - (emails_sent - 50))
    
    if not roast:
        roast = "Your email activity looks... fine. But 'fine' is the enemy of great."
        discrepancy_score = 35
    
    if not truth_bombs:
        truth_bombs.append("Email hygiene is decent. But are you shipping or just communicating?")
    
    return {
        "roast": roast,
        "discrepancy_score": int(discrepancy_score),
        "truth_bombs": truth_bombs,
        "focus_score": int(focus_score),
        "actual_focus": f"{emails_sent} emails sent, {avg_response_time_hours}h avg response"
    }


def _roast_manual_founder(stated_priority: str, data: Dict) -> Dict:
    """Roast for founders using manual daily logs"""
    
    daily_log = data.get("daily_log", "")
    hours_worked = data.get("hours_worked", 0)
    commitment = data.get("commitment", "")
    
    roast = ""
    truth_bombs = []
    discrepancy_score = 0
    
    # Too vague
    if len(daily_log) < 50:
        roast = (
            "Your daily log is 2 sentences. Either you did nothing worth mentioning "
            "or you're too lazy to reflect. Both are bad."
        )
        discrepancy_score = 80
        truth_bombs.append("Vague logging = vague thinking = vague results.")
    
    # Hours mismatch
    elif hours_worked > 12:
        roast = (
            f"You logged {hours_worked} hours. You're either lying, inefficient, "
            "or confusing 'time at desk' with 'actual work'."
        )
        discrepancy_score = 70
        truth_bombs.append("Long hours ≠ progress. Track outcomes, not time.")
    
    elif hours_worked < 4:
        roast = (
            f"Only {hours_worked}h logged? You're either a 10x founder who ships in 4 hours "
            "or you're phoning it in."
        )
        discrepancy_score = 65
    
    # Check commitment alignment
    if commitment and daily_log:
        if commitment.lower() not in daily_log.lower():
            roast = (
                f"Your commitment was '{commitment}'. Your log doesn't mention it. "
                "You're lying to yourself, which is worse than lying to investors."
            )
            discrepancy_score = 90
            truth_bombs.append("Commitment != Execution. Classic founder self-deception.")
    
    focus_score = min(100, len(daily_log) // 2) if hours_worked <= 10 else 40
    
    if not roast:
        roast = "Your log looks fine. But are you tracking what matters or just going through the motions?"
        discrepancy_score = 45
    
    if not truth_bombs:
        truth_bombs.append("Logging is good. But reflection without action is just journaling.")
    
    return {
        "roast": roast,
        "discrepancy_score": int(discrepancy_score),
        "truth_bombs": truth_bombs,
        "focus_score": int(focus_score),
        "actual_focus": f"{hours_worked}h logged, {len(daily_log)} chars detail"
    }


def _roast_github_founder(stated_priority: str, data: Dict) -> Dict:
    """Roast for technical founders (existing GitHub logic)"""
    
    by_directory = data.get("by_directory", {})
    by_file_type = data.get("by_file_type", {})
    commit_hours = data.get("commit_hours", {})
    
    if not by_directory:
        return {
            "roast": "No commit data. You're either not shipping or hiding from accountability.",
            "discrepancy_score": 0,
            "truth_bombs": ["No data = no truth."],
            "focus_score": 0,
            "actual_focus": "No activity"
        }
    
    # Calculate focus
    total = sum(by_directory.values())
    concentration = sum((count / total) ** 2 for count in by_directory.values()) if total > 0 else 0
    focus_score = int(concentration * 100)
    
    # Determine actual focus
    top_dir = max(by_directory.items(), key=lambda x: x[1])[0]
    actual_focus = f"{top_dir} ({int(by_directory[top_dir]/total*100)}% of work)"
    
    # Build roast
    roast = ""
    truth_bombs = []
    discrepancy_score = 0
    
    # Late night coding
    late_hours = sum(commit_hours.get(h, 0) for h in [22, 23, 0, 1, 2, 3])
    total_commits = sum(commit_hours.values())
    if total_commits > 0 and late_hours / total_commits > 0.4:
        truth_bombs.append(
            f"You code most between 10pm-3am. That's not hustle, that's unsustainable. Peak: {max(commit_hours, key=commit_hours.get)}:00"
        )
    
    # CSS obsession
    css_commits = by_file_type.get(".css", 0) + by_file_type.get(".scss", 0)
    if total > 0 and css_commits / total > 0.4:
        roast = (
            f"You say '{stated_priority}' but {int(css_commits/total*100)}% of your commits are CSS. "
            "You're procrastinating with pixels. Customers don't care about button shadows."
        )
        discrepancy_score = 85
    
    # Low focus
    if focus_score < 30:
        truth_bombs.append(f"Focus score: {focus_score}/100. You're scattered. Pick one thing and finish it.")
    
    if not roast:
        roast = f"You worked on {top_dir} most. That aligns with '{stated_priority}'... barely."
        discrepancy_score = 50
    
    if not truth_bombs:
        truth_bombs.append("Your code patterns are normal. And normal doesn't build unicorns.")
    
    return {
        "roast": roast,
        "discrepancy_score": discrepancy_score,
        "truth_bombs": truth_bombs,
        "focus_score": focus_score,
        "actual_focus": actual_focus
    }
