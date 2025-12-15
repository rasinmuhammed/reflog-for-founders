"""
Celery tasks for scheduled email reminders and background jobs
"""
from celery_app import celery_app
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
import models
from email_service import EmailService


@celery_app.task
def send_morning_reminders():
    """
    Send morning check-in reminders to all users who have enabled email notifications.
    Should be scheduled to run via Celery Beat at 8:00 AM user's timezone (or a default).
    """
    db = SessionLocal()
    try:
        # Get users with email notifications enabled who should receive morning reminders
        users = db.query(models.User).filter(
            models.User.email_notifications == True,
            models.User.email.isnot(None)
        ).all()
        
        sent_count = 0
        for user in users:
            # Skip if user has already checked in today
            today_start = datetime.combine(datetime.now().date(), datetime.min.time())
            today_checkin = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == user.id,
                models.CheckIn.timestamp >= today_start
            ).first()
            
            if today_checkin:
                continue
            
            # Send morning reminder
            success = EmailService.send_morning_reminder(
                to_email=user.email,
                user_name=user.full_name or 'Founder',
                accountability_style=user.accountability_style or 'balanced',
                current_streak=user.current_streak or 0,
                success_rate=user.success_rate
            )
            
            if success:
                sent_count += 1
        
        return f"Sent {sent_count} morning reminders"
    finally:
        db.close()


@celery_app.task
def send_evening_reminders():
    """
    Send evening review reminders to users who have a commitment but haven't reviewed yet.
    Should be scheduled to run via Celery Beat at 6:00 PM user's timezone.
    """
    db = SessionLocal()
    try:
        # Get today's start
        today_start = datetime.combine(datetime.now().date(), datetime.min.time())
        
        # Find check-ins from today that have a commitment but haven't been reviewed (shipped is null)
        unreviewd_checkins = db.query(models.CheckIn).filter(
            models.CheckIn.timestamp >= today_start,
            models.CheckIn.commitment.isnot(None),
            models.CheckIn.commitment != '',
            models.CheckIn.shipped.is_(None)
        ).all()
        
        sent_count = 0
        for checkin in unreviewd_checkins:
            user = db.query(models.User).filter(models.User.id == checkin.user_id).first()
            
            if not user or not user.email or not user.email_notifications:
                continue
            
            success = EmailService.send_evening_reminder(
                to_email=user.email,
                user_name=user.full_name or 'Founder',
                commitment=checkin.commitment,
                accountability_style=user.accountability_style or 'balanced',
                is_urgent=False
            )
            
            if success:
                sent_count += 1
        
        return f"Sent {sent_count} evening reminders"
    finally:
        db.close()


@celery_app.task
def send_urgent_evening_reminders():
    """
    Send urgent evening reminders at 9:00 PM for users who still haven't reviewed.
    More aggressive messaging.
    """
    db = SessionLocal()
    try:
        today_start = datetime.combine(datetime.now().date(), datetime.min.time())
        
        unreviewd_checkins = db.query(models.CheckIn).filter(
            models.CheckIn.timestamp >= today_start,
            models.CheckIn.commitment.isnot(None),
            models.CheckIn.commitment != '',
            models.CheckIn.shipped.is_(None)
        ).all()
        
        sent_count = 0
        for checkin in unreviewd_checkins:
            user = db.query(models.User).filter(models.User.id == checkin.user_id).first()
            
            if not user or not user.email or not user.email_notifications:
                continue
            
            success = EmailService.send_evening_reminder(
                to_email=user.email,
                user_name=user.full_name or 'Founder',
                commitment=checkin.commitment,
                accountability_style=user.accountability_style or 'balanced',
                is_urgent=True  # More aggressive messaging
            )
            
            if success:
                sent_count += 1
        
        return f"Sent {sent_count} urgent evening reminders"
    finally:
        db.close()


@celery_app.task
def send_inactive_nudges():
    """
    Send nudge emails to users who haven't checked in for 3+ days.
    Should be scheduled to run daily.
    """
    db = SessionLocal()
    try:
        three_days_ago = datetime.now() - timedelta(days=3)
        
        # Find users with email notifications who haven't checked in recently
        users = db.query(models.User).filter(
            models.User.email_notifications == True,
            models.User.email.isnot(None)
        ).all()
        
        sent_count = 0
        for user in users:
            # Get their last check-in
            last_checkin = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == user.id
            ).order_by(models.CheckIn.timestamp.desc()).first()
            
            if last_checkin and last_checkin.timestamp < three_days_ago:
                days_inactive = (datetime.now() - last_checkin.timestamp).days
                
                success = EmailService.send_inactive_nudge(
                    to_email=user.email,
                    user_name=user.full_name or 'Founder',
                    days_inactive=days_inactive,
                    accountability_style=user.accountability_style or 'balanced'
                )
                
                if success:
                    sent_count += 1
        
        return f"Sent {sent_count} inactive nudges"
    finally:
        db.close()


@celery_app.task
def send_weekly_summaries():
    """
    Send weekly summary emails every Monday morning.
    """
    db = SessionLocal()
    try:
        # Calculate last week's date range
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        week_start = datetime.combine(week_ago, datetime.min.time())
        week_end = datetime.combine(today, datetime.min.time())
        
        users = db.query(models.User).filter(
            models.User.email_notifications == True,
            models.User.email.isnot(None)
        ).all()
        
        sent_count = 0
        for user in users:
            # Get last week's check-ins
            checkins = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == user.id,
                models.CheckIn.timestamp >= week_start,
                models.CheckIn.timestamp < week_end,
                models.CheckIn.shipped.isnot(None)
            ).all()
            
            if not checkins:
                continue
            
            shipped = sum(1 for c in checkins if c.shipped)
            total = len(checkins)
            success_rate = (shipped / total * 100) if total > 0 else 0
            
            EmailService.send_weekly_summary(
                to_email=user.email,
                user_name=user.full_name or 'Founder',
                stats={
                    'success_rate': success_rate,
                    'shipped': shipped,
                    'total_commitments': total
                },
                accountability_style=user.accountability_style or 'balanced'
            )
            sent_count += 1
        
        return f"Sent {sent_count} weekly summaries"
    finally:
        db.close()


@celery_app.task
def check_streak_milestones():
    """
    Check for streak milestones and notify users.
    Run daily to catch milestone achievements.
    """
    db = SessionLocal()
    try:
        milestones = [7, 14, 21, 30, 60, 90, 100]
        
        users = db.query(models.User).filter(
            models.User.email_notifications == True,
            models.User.email.isnot(None),
            models.User.current_streak.in_(milestones)
        ).all()
        
        sent_count = 0
        for user in users:
            EmailService.send_streak_notification(
                to_email=user.email,
                user_name=user.full_name or 'Founder',
                streak_count=user.current_streak,
                is_broken=False
            )
            sent_count += 1
        
        return f"Sent {sent_count} streak milestone notifications"
    finally:
        db.close()


@celery_app.task
def send_welcome_email_task(email: str, user_name: str, accountability_style: str):
    """
    Send welcome email after successful onboarding.
    Called directly from the onboarding endpoint.
    """
    return EmailService.send_welcome_email(
        to_email=email,
        user_name=user_name,
        accountability_style=accountability_style
    )


# Celery Beat Schedule Configuration
# Add this to celery_app.py or a separate beat_schedule.py
CELERY_BEAT_SCHEDULE = {
    'morning-reminders': {
        'task': 'tasks.send_morning_reminders',
        'schedule': {
            'hour': 8,
            'minute': 0,
        },
    },
    'evening-reminders': {
        'task': 'tasks.send_evening_reminders',
        'schedule': {
            'hour': 18,
            'minute': 0,
        },
    },
    'urgent-evening-reminders': {
        'task': 'tasks.send_urgent_evening_reminders',
        'schedule': {
            'hour': 21,
            'minute': 0,
        },
    },
    'inactive-nudges': {
        'task': 'tasks.send_inactive_nudges',
        'schedule': {
            'hour': 10,
            'minute': 0,
        },
    },
    'weekly-summaries': {
        'task': 'tasks.send_weekly_summaries',
        'schedule': {
            'day_of_week': 'monday',
            'hour': 9,
            'minute': 0,
        },
    },
    'streak-milestones': {
        'task': 'tasks.check_streak_milestones',
        'schedule': {
            'hour': 12,
            'minute': 0,
        },
    },
}
