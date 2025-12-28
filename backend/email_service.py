"""
Email notification service using Resend
Smart, provocative emails that hold founders accountable
"""
import os
import random
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


# Provocative subject lines by accountability style
MORNING_SUBJECTS = {
    'intense': [
        "⚡ Another day of excuses, or are you shipping?",
        "🔥 Your competition woke up 2 hours ago",
        "💀 Your runway burns while you read this",
        "⏰ Time to stop pretending and start doing",
        "🎯 One task. No excuses. What is it?",
    ],
    'balanced': [
        "🎯 What's your one non-negotiable today?",
        "☀️ Time to set today's commitment",
        "🚀 New day, new opportunity to ship",
        "📍 What will you accomplish today?",
    ],
    'gentle': [
        "☀️ Good morning! Ready to make progress?",
        "🌱 What small win can you achieve today?",
        "💫 You've got this. What's the plan?",
    ]
}

EVENING_SUBJECTS = {
    'intense': [
        "⏰ Time's up. Did you ship or not?",
        "🔍 The AI is waiting for your excuse",
        "💀 Did you waste another day?",
        "🎭 Reality check: shipped or just busy?",
        "⚠️ Your future self is watching",
    ],
    'balanced': [
        "📊 Evening review: How did you do?",
        "🌙 Time to be honest about today",
        "✓ Did you complete your commitment?",
    ],
    'gentle': [
        "🌙 How did today go?",
        "✨ Time to reflect on your progress",
        "💭 Let's review today together",
    ]
}

PROVOCATIVE_MESSAGES = {
    'no_checkin_3days': [
        "You've been quiet for 3 days. Either you're shipping so hard you forgot to check in, or you're hiding from accountability. Which is it?",
        "Founders who disappear from their accountability systems are usually avoiding something. What are you avoiding?",
        "Radio silence for 3 days. Your AI council is... concerned.",
    ],
    'low_success_rate': [
        "Your ship rate is {rate}%. At this pace, your runway burns faster than your progress. Something needs to change.",
        "More commitments broken than kept. The pattern is clear. What are you going to do about it?",
        "You're not shipping what you promise. Either your commitments are unrealistic, or you're not prioritizing. Which is it?",
    ],
    'streak_broken': [
        "Your {streak}-day streak just broke. Get back on the horse TODAY, or momentum dies.",
        "Streak broken at {streak} days. One missed day is a slip. Two is a pattern. Don't let it become a habit.",
    ],
    'big_streak': [
        "🔥 {streak} days in a row! You're building something real. Don't stop now.",
        "💪 {streak}-day streak! This is the discipline that separates successful founders from wannabes.",
    ]
}


class EmailService:
    """Service for sending smart, provocative email notifications"""

    @staticmethod
    def _get_random_subject(subjects: list) -> str:
        """Get a random subject line for variety"""
        return random.choice(subjects)

    @staticmethod
    def _get_email_template(
        header_title: str,
        main_content: str,
        cta_text: str,
        cta_url: str,
        footer_note: str = None
    ) -> str:
        """Generate consistent premium email template"""
        return f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">{header_title}</h1>
                </div>

                <!-- Body -->
                <div style="padding: 32px 24px;">
                    {main_content}

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{cta_url}"
                           style="background: linear-gradient(135deg, #933DC9 0%, #53118F 100%);
                                  color: white;
                                  padding: 16px 32px;
                                  text-decoration: none;
                                  border-radius: 12px;
                                  font-weight: 600;
                                  font-size: 15px;
                                  display: inline-block;
                                  box-shadow: 0 4px 12px rgba(147, 61, 201, 0.3);">
                            {cta_text}
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f8f8; padding: 20px 24px; border-top: 1px solid #e8e8e8;">
                    {f'<p style="margin: 0 0 12px 0; font-size: 13px; color: #666;">{footer_note}</p>' if footer_note else ''}
                    <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                        <a href="{APP_URL}/settings" style="color: #933DC9; text-decoration: none;">Manage preferences</a>
                        &nbsp;•&nbsp;
                        <a href="{APP_URL}" style="color: #933DC9; text-decoration: none;">Open Reflog</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

    @staticmethod
    def send_morning_reminder(
        to_email: str,
        user_name: str,
        accountability_style: str = 'balanced',
        current_streak: int = 0,
        success_rate: float = None
    ) -> bool:
        """Send morning check-in reminder with smart content"""
        if not RESEND_API_KEY:
            print(f"⚠️  Skipping email to {to_email} - no API key")
            return False

        style = accountability_style if accountability_style in MORNING_SUBJECTS else 'balanced'
        subject = EmailService._get_random_subject(MORNING_SUBJECTS[style])

        # Build personalized content
        greeting = f"Hey {user_name.split()[0] if user_name else 'founder'},"

        if accountability_style == 'intense':
            main_message = """
                <p style="font-size: 16px; margin-bottom: 16px;"><strong>Let's cut the BS.</strong></p>
                <p style="font-size: 15px; color: #444; margin-bottom: 20px;">
                    Another day where you can either ship something real or find new ways to look busy.
                    Your customers don't care about your to-do list. They care about results.
                </p>
                <div style="background: #fff8f0; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; font-size: 14px; color: #9a3412;">
                        <strong>Challenge:</strong> Can you commit to ONE thing that a customer would actually pay for?
                    </p>
                </div>
            """
        elif accountability_style == 'gentle':
            main_message = f"""
                <p style="font-size: 16px; margin-bottom: 16px;"><strong>{greeting}</strong></p>
                <p style="font-size: 15px; color: #444; margin-bottom: 20px;">
                    Hope you're having a good morning! Take a moment to set your focus for today.
                    What's one thing you can accomplish that will move you forward?
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; font-size: 14px; color: #166534;">
                        💡 <strong>Tip:</strong> Small, specific commitments work best. You've got this!
                    </p>
                </div>
            """
        else:
            main_message = f"""
                <p style="font-size: 16px; margin-bottom: 16px;"><strong>{greeting}</strong></p>
                <p style="font-size: 15px; color: #444; margin-bottom: 20px;">
                    Time to set your daily commitment. What's the one thing you'll ship today?
                </p>
                <div style="background: #f8f0ff; border-left: 4px solid #933DC9; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; font-size: 14px; color: #581c87;">
                        🎯 <strong>Focus:</strong> Be specific. "Work on feature" is vague. "Deploy user auth by 3pm" is a commitment.
                    </p>
                </div>
            """

        # Add streak/stats if available
        if current_streak > 5:
            main_message += f"""
                <div style="background: #fef9c3; padding: 12px 16px; border-radius: 8px; margin-top: 16px;">
                    <p style="margin: 0; font-size: 14px; color: #854d0e;">
                        🔥 You're on a <strong>{current_streak}-day streak</strong>! Don't break it.
                    </p>
                </div>
            """

        html_content = EmailService._get_email_template(
            header_title="Daily Reality Check",
            main_content=main_message,
            cta_text="Set Today's Commitment →",
            cta_url=APP_URL,
            footer_note="Your AI council is waiting."
        )

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
            return False

        style = accountability_style if accountability_style in EVENING_SUBJECTS else 'balanced'

        if is_urgent:
            subject = "🚨 Final call: Did you ship today or not?"
        else:
            subject = EmailService._get_random_subject(EVENING_SUBJECTS[style])

        commitment_display = commitment[:100] + "..." if len(commitment) > 100 else commitment

        if accountability_style == 'intense':
            main_message = f"""
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>Time's up. No more hiding.</strong></p>

                <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Your commitment:</p>
                    <p style="margin: 0; font-size: 16px; color: #fff; font-weight: 500;">"{commitment_display}"</p>
                </div>

                <p style="font-size: 15px; color: #444;">
                    Did you actually do it, or are you about to type another excuse?
                    The AI tracks your patterns. Consistent excuses get called out.
                </p>
            """
        else:
            main_message = f"""
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>Time for your evening review.</strong></p>

                <div style="background: #f8f0ff; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e9d5ff;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #7e22ce; text-transform: uppercase; letter-spacing: 1px;">Your commitment:</p>
                    <p style="margin: 0; font-size: 16px; color: #1a1a1a; font-weight: 500;">"{commitment_display}"</p>
                </div>

                <p style="font-size: 15px; color: #444;">
                    Be honest with yourself. Did you ship what you promised?
                </p>
            """

        html_content = EmailService._get_email_template(
            header_title="Evening Review",
            main_content=main_message,
            cta_text="Complete Review →",
            cta_url=APP_URL
        )

        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_content
            })
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_streak_notification(
        to_email: str,
        user_name: str,
        streak_count: int,
        is_broken: bool = False
    ) -> bool:
        """Send streak milestone or broken streak notification"""
        if not RESEND_API_KEY:
            return False

        if is_broken:
            subject = f"⚠️ Your {streak_count}-day streak just broke"
            message = random.choice(PROVOCATIVE_MESSAGES['streak_broken']).format(streak=streak_count)
            main_message = f"""
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>{message}</strong></p>
                <p style="font-size: 15px; color: #444;">
                    Momentum is fragile. Check in today to start rebuilding.
                </p>
            """
        else:
            subject = f"🔥 {streak_count}-day streak! You're on fire"
            message = random.choice(PROVOCATIVE_MESSAGES['big_streak']).format(streak=streak_count)
            main_message = f"""
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>{message}</strong></p>
                <p style="font-size: 15px; color: #444;">
                    Consistency compounds. Keep going.
                </p>
            """

        html_content = EmailService._get_email_template(
            header_title="Streak Update",
            main_content=main_message,
            cta_text="Continue Streak →",
            cta_url=APP_URL
        )

        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_content
            })
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_inactive_nudge(
        to_email: str,
        user_name: str,
        days_inactive: int,
        accountability_style: str = 'balanced'
    ) -> bool:
        """Send nudge for inactive users"""
        if not RESEND_API_KEY:
            return False

        if days_inactive >= 7:
            subject = "😶 It's been a week. Are you okay?"
            message = """
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>We haven't heard from you in a week.</strong></p>
                <p style="font-size: 15px; color: #444; margin-bottom: 16px;">
                    Either you're crushing it so hard you forgot to check in...
                    or you're avoiding accountability.
                </p>
                <p style="font-size: 15px; color: #444;">
                    The founders who succeed aren't the ones who disappear when things get hard.
                    They're the ones who show up anyway.
                </p>
            """
        else:
            subject = f"👀 {days_inactive} days without a check-in"
            message = f"""
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>You've been quiet for {days_inactive} days.</strong></p>
                <p style="font-size: 15px; color: #444;">
                    Consistency is what separates successful founders from the rest.
                    Take 2 minutes to check in and keep the momentum going.
                </p>
            """

        html_content = EmailService._get_email_template(
            header_title="Missing You",
            main_content=message,
            cta_text="Come Back →",
            cta_url=APP_URL
        )

        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_content
            })
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_weekly_summary(
        to_email: str,
        user_name: str,
        stats: dict,
        accountability_style: str = 'balanced'
    ) -> bool:
        """Send weekly summary with performance analysis"""
        if not RESEND_API_KEY:
            return False

        success_rate = stats.get('success_rate', 0)
        shipped = stats.get('shipped', 0)
        total = stats.get('total_commitments', 0)

        # Performance messaging
        if success_rate >= 80:
            performance_emoji = "🔥"
            performance_title = "Outstanding Week"
            performance_color = "#22c55e"
            message = "You're in the top tier. Keep this discipline and momentum compounds."
        elif success_rate >= 60:
            performance_emoji = "💪"
            performance_title = "Solid Progress"
            performance_color = "#933DC9"
            message = "Good week. Push for 80%+ to build unstoppable momentum."
        elif success_rate >= 40:
            performance_emoji = "⚠️"
            performance_title = "Room to Improve"
            performance_color = "#f97316"
            message = "You're slipping. Time to identify what's actually blocking you."
        else:
            performance_emoji = "🚨"
            performance_title = "Wake Up Call"
            performance_color = "#ef4444"
            message = "More excuses than shipped work. Something fundamental needs to change."

        main_message = f"""
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 8px;">{performance_emoji}</div>
                <h2 style="margin: 0; font-size: 24px; color: {performance_color};">{performance_title}</h2>
            </div>

            <p style="font-size: 15px; color: #444; text-align: center; margin-bottom: 24px;">{message}</p>

            <!-- Stats Grid -->
            <div style="display: flex; background: #f8f8f8; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <div style="flex: 1; text-align: center; padding: 24px; border-right: 1px solid #e8e8e8;">
                    <div style="font-size: 36px; font-weight: 700; color: {performance_color};">{success_rate:.0f}%</div>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">Success Rate</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 24px; border-right: 1px solid #e8e8e8;">
                    <div style="font-size: 36px; font-weight: 700; color: #22c55e;">{shipped}</div>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">Shipped</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 24px;">
                    <div style="font-size: 36px; font-weight: 700; color: #ef4444;">{total - shipped}</div>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">Missed</div>
                </div>
            </div>
        """

        html_content = EmailService._get_email_template(
            header_title="Your Weekly Summary",
            main_content=main_message,
            cta_text="View Full Dashboard →",
            cta_url=APP_URL
        )

        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": f"{performance_emoji} Weekly Summary: {success_rate:.0f}% Success Rate",
                "html": html_content
            })
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(
        to_email: str,
        user_name: str,
        accountability_style: str = 'balanced'
    ) -> bool:
        """Send welcome email after onboarding"""
        if not RESEND_API_KEY:
            return False

        style_messages = {
            'intense': "You chose the 'No BS' style. Good. Expect direct, uncomfortable questions that most advisors are too polite to ask.",
            'balanced': "You chose a balanced approach. We'll be direct but empathetic—pushing you to grow without being exhausting.",
            'gentle': "You chose a supportive style. We'll encourage you forward with gentle pushes and celebrate your wins."
        }

        main_message = f"""
            <p style="font-size: 16px; margin-bottom: 20px;"><strong>Welcome to Reflog, {user_name.split()[0] if user_name else 'founder'}.</strong></p>

            <p style="font-size: 15px; color: #444; margin-bottom: 16px;">
                {style_messages.get(accountability_style, style_messages['balanced'])}
            </p>

            <div style="background: #f8f0ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #7e22ce;">Your AI Advisory Board:</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #444;">
                    <li style="margin-bottom: 8px;"><strong>The Strategist</strong> — Revenue, growth, business fundamentals</li>
                    <li style="margin-bottom: 8px;"><strong>The Realist</strong> — Market dynamics, competition, reality checks</li>
                    <li style="margin-bottom: 8px;"><strong>The Enforcer</strong> — Execution, accountability, no excuses</li>
                    <li><strong>The Challenger</strong> — Questions assumptions, prevents self-delusion</li>
                </ul>
            </div>

            <p style="font-size: 15px; color: #444;">
                Start with your first Reality Check. It takes 2 minutes and sets the tone for how you'll work with Reflog.
            </p>
        """

        html_content = EmailService._get_email_template(
            header_title="Welcome to Reflog",
            main_content=main_message,
            cta_text="Start Your First Check-in →",
            cta_url=APP_URL
        )

        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": to_email,
                "subject": "🚀 Welcome to Reflog — Your AI Advisory Board awaits",
                "html": html_content
            })
            return True
        except Exception as e:
            print(f"❌ Failed to send welcome email: {str(e)}")
            return False
