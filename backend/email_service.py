"""
Email notification service using Resend
"""
import os
from datetime import datetime
from typing import Optional
import resend
from dotenv import load_dotenv

load_dotenv()

# Configure Resend
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Reflog <noreply@reflog.ai>")
APP_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    print("✓ Email service configured")
else:
    print("⚠️  RESEND_API_KEY not set - email notifications disabled")


class EmailService:
    """Service for sending email notifications"""
    
    @staticmethod
    def send_morning_reminder(
        to_email: str,
        user_name: str,
        accountability_style: str = 'balanced'
    ) -> bool:
        """Send morning check-in reminder"""
        if not RESEND_API_KEY:
            print(f"⚠️  Skipping email to {to_email} - no API key")
            return False
        
        # Customize tone based on accountability style
        if accountability_style == 'intense':
            subject = "⚡ Time to commit. What are you shipping today?"
            greeting = "Let's cut the BS."
            message = "Another day of excuses, or are you actually going to ship something? Set your commitment now."
        elif accountability_style == 'gentle':
            subject = "☀️ Good morning! Ready to set today's goal?"
            greeting = "Hope you're having a great morning!"
            message = "Take a moment to set your commitment for today. What's one thing you can ship?"
        else:  # balanced
            subject = "🎯 Daily Check-in: Set Your Commitment"
            greeting = "Good morning!"
            message = "Time for your daily check-in. What will you ship today?"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Reflog</h1>
                </div>
                
                <p style="font-size: 16px;"><strong>{greeting}</strong></p>
                
                <p style="font-size: 16px;">{message}</p>
                
                <div style="background: #f8f9fa; border-left: 4px solid #933DC9; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #666;">💡 <strong>Tip:</strong> Specific commitments work best. Instead of "work on feature," try "deploy user auth by 3pm."</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}" 
                       style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold;
                              display: inline-block;">
                        Set Today's Commitment
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    You're receiving this because you enabled email reminders in Reflog.<br>
                    <a href="{APP_URL}/settings" style="color: #933DC9;">Manage notification preferences</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_content
            })
            print(f"✓ Sent morning reminder to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_evening_reminder(
        to_email: str,
        user_name: str,
        commitment: str,
        accountability_style: str = 'balanced',
        is_urgent: bool = False
    ) -> bool:
        """Send evening review reminder"""
        if not RESEND_API_KEY:
            print(f"⚠️  Skipping email to {to_email} - no API key")
            return False
        
        # Customize based on style and urgency
        if is_urgent:
            subject = "🚨 URGENT: Review your commitment NOW"
            message = "The day is almost over. Did you ship what you committed to?"
        elif accountability_style == 'intense':
            subject = "⏰ No excuses. Did you ship or not?"
            message = "Time's up. Let's see if you actually followed through today."
        elif accountability_style == 'gentle':
            subject = "🌙 Time to reflect: How did today go?"
            message = "Take a moment to review your day. Did you complete your commitment?"
        else:  # balanced
            subject = "📊 Evening Review: Did You Ship?"
            message = "Time to be honest with yourself. Did you complete today's commitment?"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Reflog</h1>
                </div>
                
                <p style="font-size: 16px;"><strong>{message}</strong></p>
                
                <div style="background: #f8f9fa; border-left: 4px solid #933DC9; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">YOUR COMMITMENT:</p>
                    <p style="margin: 0; font-size: 16px; font-weight: bold;">"{commitment}"</p>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                    Be honest in your review. The AI analyzes your patterns - consistent excuses get called out.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}" 
                       style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold;
                              display: inline-block;">
                        Review Your Day
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    You're receiving this because you enabled email reminders in Reflog.<br>
                    <a href="{APP_URL}/settings" style="color: #933DC9;">Manage notification preferences</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_content
            })
            print(f"✓ Sent evening reminder to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_weekly_summary(
        to_email: str,
        user_name: str,
        stats: dict,
        accountability_style: str = 'balanced'
    ) -> bool:
        """Send weekly summary email"""
        if not RESEND_API_KEY:
            print(f"⚠️  Skipping email to {to_email} - no API key")
            return False
        
        success_rate = stats.get('success_rate', 0)
        shipped = stats.get('shipped', 0)
        total = stats.get('total_commitments', 0)
        
        # Performance message based on success rate
        if success_rate >= 80:
            performance = "🔥 Outstanding week!"
            message = "You're crushing it. Keep this momentum going."
        elif success_rate >= 60:
            performance = "💪 Solid week"
            message = "Good progress. Let's push for 80%+ next week."
        elif success_rate >= 40:
            performance = "⚠️ Room for improvement"
            message = "You're slipping. Time to identify what's blocking you."
        else:
            performance = "🚨 Wake up call"
            message = "More excuses than shipped work. Something needs to change."
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Your Weekly Summary</h1>
                </div>
                
                <h2 style="color: #333;">{performance}</h2>
                <p style="font-size: 16px;">{message}</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; font-weight: bold; color: #933DC9;">{success_rate:.0f}%</div>
                        <div style="color: #666;">Success Rate</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 32px; font-weight: bold; color: #28a745;">{shipped}</div>
                            <div style="color: #666; font-size: 14px;">Shipped</div>
                        </div>
                        <div>
                            <div style="font-size: 32px; font-weight: bold; color: #dc3545;">{total - shipped}</div>
                            <div style="color: #666; font-size: 14px;">Missed</div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}" 
                       style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold;
                              display: inline-block;">
                        View Full Dashboard
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    <a href="{APP_URL}/settings" style="color: #933DC9;">Manage notification preferences</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": f"📊 Weekly Summary: {success_rate:.0f}% Success Rate",
                "html": html_content
            })
            print(f"✓ Sent weekly summary to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False