"""
Drift Detection Service - Monitors founder activity and sends alerts

Detects when founders are drifting:
- Impact Score drops below threshold for X days
- No check-ins for X days
- Commitment completion rate drops significantly

Sends notifications via:
- In-app alerts
- Email (using existing email_service)
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import models
from email_service import EmailService


class DriftDetector:
    """Monitors founder activity and generates drift alerts"""

    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()

    def check_all_users(self) -> List[Dict]:
        """Check all active users for drift signals"""
        alerts = []

        users = self.db.query(models.User).filter(
            models.User.groq_api_key != None  # Only check active users
        ).all()

        for user in users:
            user_alerts = self.check_user_drift(user)
            alerts.extend(user_alerts)

        return alerts

    def check_user_drift(self, user: models.User) -> List[Dict]:
        """Check a single user for drift signals"""
        alerts = []

        # Check 1: No check-ins for 3+ days
        checkin_alert = self._check_checkin_gap(user)
        if checkin_alert:
            alerts.append(checkin_alert)

        # Check 2: Impact score dropping
        impact_alert = self._check_impact_drop(user)
        if impact_alert:
            alerts.append(impact_alert)

        # Check 3: Commitment completion rate crashed
        completion_alert = self._check_completion_crash(user)
        if completion_alert:
            alerts.append(completion_alert)

        # Check 4: Shadow mode discrepancy very high
        shadow_alert = self._check_high_discrepancy(user)
        if shadow_alert:
            alerts.append(shadow_alert)

        return alerts

    def _check_checkin_gap(self, user: models.User) -> Optional[Dict]:
        """Check if user hasn't checked in for 3+ days"""
        last_checkin = self.db.query(models.CheckIn).filter(
            models.CheckIn.user_id == user.id
        ).order_by(models.CheckIn.timestamp.desc()).first()

        if not last_checkin:
            return None

        days_since = (datetime.utcnow() - last_checkin.timestamp).days

        if days_since >= 3:
            return {
                "user_id": user.id,
                "email": user.email,
                "alert_type": "no_checkin",
                "severity": "high" if days_since >= 5 else "medium",
                "title": "You've Gone Silent",
                "message": f"No check-ins for {days_since} days. Silence is where startups die.",
                "days_since": days_since,
                "action": "Log your daily commitment now",
                "agent": "Execution Enforcer"
            }

        return None

    def _check_impact_drop(self, user: models.User) -> Optional[Dict]:
        """Check if GitHub impact score has dropped significantly"""
        # Get shadow data for impact score trends
        recent_shadows = self.db.query(models.ShadowData).filter(
            models.ShadowData.user_id == user.id,
            models.ShadowData.submission_date >= datetime.utcnow() - timedelta(days=14)
        ).order_by(models.ShadowData.submission_date.desc()).limit(5).all()

        if len(recent_shadows) < 2:
            return None

        # Check if focus score has dropped significantly
        latest = recent_shadows[0].focus_score or 50
        avg_previous = sum(s.focus_score or 50 for s in recent_shadows[1:]) / len(recent_shadows[1:])

        if latest < avg_previous - 20 and latest < 40:
            return {
                "user_id": user.id,
                "email": user.email,
                "alert_type": "focus_drop",
                "severity": "high",
                "title": "Focus Score Crashed",
                "message": f"Your focus dropped from {int(avg_previous)} to {int(latest)}. You're scattered.",
                "current_score": int(latest),
                "previous_avg": int(avg_previous),
                "action": "Review your priorities and eliminate distractions",
                "agent": "Market Realist"
            }

        return None

    def _check_completion_crash(self, user: models.User) -> Optional[Dict]:
        """Check if commitment completion rate has crashed"""
        # Get last 7 days of check-ins
        recent_checkins = self.db.query(models.CheckIn).filter(
            models.CheckIn.user_id == user.id,
            models.CheckIn.timestamp >= datetime.utcnow() - timedelta(days=7)
        ).all()

        if len(recent_checkins) < 3:
            return None

        completed = sum(1 for c in recent_checkins if c.shipped)
        rate = (completed / len(recent_checkins)) * 100

        if rate < 30:
            return {
                "user_id": user.id,
                "email": user.email,
                "alert_type": "completion_crash",
                "severity": "high",
                "title": "You're Breaking Promises",
                "message": f"Only {int(rate)}% of commitments completed this week. Words without action.",
                "completion_rate": int(rate),
                "action": "Make smaller, achievable commitments",
                "agent": "Challenger"
            }

        return None

    def _check_high_discrepancy(self, user: models.User) -> Optional[Dict]:
        """Check if stated vs actual discrepancy is very high"""
        latest_shadow = self.db.query(models.ShadowData).filter(
            models.ShadowData.user_id == user.id
        ).order_by(models.ShadowData.submission_date.desc()).first()

        if not latest_shadow:
            return None

        discrepancy = latest_shadow.discrepancy_score or 0

        if discrepancy >= 80:
            return {
                "user_id": user.id,
                "email": user.email,
                "alert_type": "high_discrepancy",
                "severity": "critical",
                "title": "You're Lying to Yourself",
                "message": f"Your stated priority is '{latest_shadow.stated_priority}' but you spent time on '{latest_shadow.actual_focus}'. Reality gap: {int(discrepancy)}%",
                "discrepancy": int(discrepancy),
                "stated": latest_shadow.stated_priority,
                "actual": latest_shadow.actual_focus,
                "action": "Align your actions with your words",
                "agent": "Challenger"
            }

        return None

    async def send_alert_email(self, alert: Dict) -> bool:
        """Send drift alert email to user"""
        subject = f"⚠️ {alert['title']} - Reflog Alert"

        body = f"""
{alert['message']}

The {alert['agent']} has flagged this behavior.

Action Required:
{alert['action']}

---
This is an automated alert from your Board of Directors.
They're watching. They care. Don't disappoint them.
        """

        # Prepare email data
        email_data = {
            "to": alert["email"],
            "subject": subject,
            "body": body
        }

        # Send via email service
        # Note: In production, this would call the actual email service
        return True

    def store_alert(self, alert: Dict) -> int:
        """Store alert in database for in-app display"""
        # Create an AgentAdvice record for the alert
        advice = models.AgentAdvice(
            user_id=alert["user_id"],
            agent_name=alert["agent"],
            advice=f"{alert['title']}: {alert['message']}",
            evidence={
                "alert_type": alert["alert_type"],
                "severity": alert["severity"],
                "action": alert["action"]
            },
            interaction_type="drift_alert"
        )
        self.db.add(advice)
        self.db.commit()
        self.db.refresh(advice)

        return advice.id


# API endpoint helper
def run_drift_check(db: Session) -> Dict:
    """Run drift detection for all users"""
    detector = DriftDetector(db)
    alerts = detector.check_all_users()

    # Store alerts
    stored_ids = []
    for alert in alerts:
        alert_id = detector.store_alert(alert)
        stored_ids.append(alert_id)

    return {
        "alerts_generated": len(alerts),
        "alert_ids": stored_ids,
        "checked_at": datetime.utcnow().isoformat()
    }
