"""
Notification scheduler - runs periodic tasks for email reminders
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, time, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from email_service import EmailService

scheduler = BackgroundScheduler()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


def send_morning_reminders():
    """
    Send morning check-in reminders to users who:
    1. Have email notifications enabled
    2. Haven't checked in today yet
    """
    print(f"\n⏰ Running morning reminders at {datetime.now()}")
    db = SessionLocal()
    
    try:
        # Get all users with notifications enabled
        users = db.query(models.User).filter(
            models.User.email_notifications_enabled == True,
            models.User.onboarding_complete == True
        ).all()
        
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        sent_count = 0
        skipped_count = 0
        
        for user in users:
            # Check if user already has a check-in today
            existing_checkin = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == user.id,
                models.CheckIn.timestamp >= today_start
            ).first()
            
            if existing_checkin:
                skipped_count += 1
                print(f"  ⏭️  Skipped {user.email} - already checked in")
                continue
            
            # Send reminder
            success = EmailService.send_morning_reminder(
                to_email=user.email,
                user_name=user.full_name or user.email.split('@')[0],
                accountability_style=user.accountability_style or 'balanced'
            )
            
            if success:
                sent_count += 1
        
        print(f"✅ Morning reminders complete: {sent_count} sent, {skipped_count} skipped")
        
    except Exception as e:
        print(f"❌ Error in morning reminders: {str(e)}")
    finally:
        db.close()


def send_evening_reminders():
    """
    Send evening review reminders to users who:
    1. Have email notifications enabled
    2. Have a check-in today that hasn't been reviewed (shipped = null)
    """
    print(f"\n⏰ Running evening reminders at {datetime.now()}")
    db = SessionLocal()
    
    try:
        # Get all users with notifications enabled
        users = db.query(models.User).filter(
            models.User.email_notifications_enabled == True,
            models.User.onboarding_complete == True
        ).all()
        
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        current_hour = datetime.now().hour
        
        sent_count = 0
        skipped_count = 0
        
        for user in users:
            # Find today's unreviewed check-in
            pending_checkin = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == user.id,
                models.CheckIn.timestamp >= today_start,
                models.CheckIn.timestamp <= today_end,
                models.CheckIn.shipped == None  # Not reviewed yet
            ).first()
            
            if not pending_checkin:
                skipped_count += 1
                continue
            
            # Determine if urgent (after 8 PM)
            is_urgent = current_hour >= 20
            
            # Send reminder
            success = EmailService.send_evening_reminder(
                to_email=user.email,
                user_name=user.full_name or user.email.split('@')[0],
                commitment=pending_checkin.commitment,
                accountability_style=user.accountability_style or 'balanced',
                is_urgent=is_urgent
            )
            
            if success:
                sent_count += 1
        
        print(f"✅ Evening reminders complete: {sent_count} sent, {skipped_count} skipped")
        
    except Exception as e:
        print(f"❌ Error in evening reminders: {str(e)}")
    finally:
        db.close()


def send_weekly_summaries():
    """
    Send weekly summary emails (runs every Monday morning)
    """
    print(f"\n⏰ Running weekly summaries at {datetime.now()}")
    db = SessionLocal()
    
    try:
        users = db.query(models.User).filter(
            models.User.email_notifications_enabled == True,
            models.User.onboarding_complete == True
        ).all()
        
        seven_days_ago = datetime.now() - timedelta(days=7)
        sent_count = 0
        
        for user in users:
            # Get last week's check-ins
            checkins = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == user.id,
                models.CheckIn.timestamp >= seven_days_ago,
                models.CheckIn.shipped != None  # Only reviewed check-ins
            ).all()
            
            if not checkins:
                continue
            
            # Calculate stats
            total = len(checkins)
            shipped = sum(1 for c in checkins if c.shipped)
            success_rate = (shipped / total * 100) if total > 0 else 0
            
            stats = {
                'total_commitments': total,
                'shipped': shipped,
                'success_rate': success_rate
            }
            
            # Send summary
            success = EmailService.send_weekly_summary(
                to_email=user.email,
                user_name=user.full_name or user.email.split('@')[0],
                stats=stats,
                accountability_style=user.accountability_style or 'balanced'
            )
            
            if success:
                sent_count += 1
        
        print(f"✅ Weekly summaries complete: {sent_count} sent")
        
    except Exception as e:
        print(f"❌ Error in weekly summaries: {str(e)}")
    finally:
        db.close()


def start_scheduler():
    """Start the notification scheduler"""
    print("\n🚀 Starting notification scheduler...")
    
    # Morning reminders - 9 AM daily
    scheduler.add_job(
        send_morning_reminders,
        CronTrigger(hour=9, minute=0),
        id='morning_reminders',
        name='Send morning check-in reminders',
        replace_existing=True
    )
    
    # Evening reminders - 6 PM daily
    scheduler.add_job(
        send_evening_reminders,
        CronTrigger(hour=18, minute=0),
        id='evening_reminders',
        name='Send evening review reminders',
        replace_existing=True
    )
    
    # Late evening reminders - 8 PM daily (urgent)
    scheduler.add_job(
        send_evening_reminders,
        CronTrigger(hour=20, minute=0),
        id='urgent_evening_reminders',
        name='Send urgent evening reminders',
        replace_existing=True
    )
    
    # Weekly summaries - Monday 9 AM
    scheduler.add_job(
        send_weekly_summaries,
        CronTrigger(day_of_week='mon', hour=9, minute=0),
        id='weekly_summaries',
        name='Send weekly summary emails',
        replace_existing=True
    )
    
    scheduler.start()
    print("✅ Scheduler started successfully")
    print("\n📅 Scheduled jobs:")
    for job in scheduler.get_jobs():
        print(f"  - {job.name} (next run: {job.next_run_time})")


def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    print("⏹️  Scheduler stopped")