"""
Mock Email Integration

Provides simulated email data for development and testing.
In production, this would be replaced with real Gmail OAuth.
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import random


class MockEmailService:
    """
    Mock Gmail service for development.
    Generates realistic-looking emails for inbox triage.
    DETERMINISTIC: Same user email always produces same inbox.
    """

    def __init__(self, user_email: str = None):
        self.user_email = user_email or "demo@reflog.ai"

        # Seed for deterministic output
        self._seed = hash(self.user_email) % (2**32)
        self._rng = random.Random()
        self._rng.seed(self._seed)

        # Sample email templates by category
        self.email_templates = {
            "urgent": [
                {"subject": "URGENT: {company} contract expiring", "from": "legal@company.com"},
                {"subject": "Critical bug in production", "from": "{name}@company.com"},
                {"subject": "Investor wants to talk today", "from": "investor@vc.com"},
                {"subject": "RE: Need your decision on hiring", "from": "{name}@company.com"},
            ],
            "customer": [
                {"subject": "Question about pricing", "from": "contact@{company}.com"},
                {"subject": "Feature request - {feature}", "from": "{name}@{company}.com"},
                {"subject": "Loved the product demo!", "from": "{name}@{company}.com"},
                {"subject": "Issue with our integration", "from": "tech@{company}.com"},
            ],
            "internal": [
                {"subject": "FYI: Updated roadmap", "from": "{name}@company.com"},
                {"subject": "PTO request next week", "from": "{name}@company.com"},
                {"subject": "Weekly metrics report", "from": "analytics@company.com"},
                {"subject": "New hire starting Monday", "from": "hr@company.com"},
            ],
            "investor": [
                {"subject": "Monthly update request", "from": "{name}@vc.com"},
                {"subject": "Intro to potential customer", "from": "{name}@vc.com"},
                {"subject": "RE: Q4 board materials", "from": "{name}@vc.com"},
            ],
            "noise": [
                {"subject": "Your SaaS weekly digest", "from": "digest@saasweekly.com"},
                {"subject": "Webinar: 10x your productivity", "from": "marketing@tool.com"},
                {"subject": "New connection request", "from": "notifications@linkedin.com"},
                {"subject": "Your invoice from AWS", "from": "billing@aws.amazon.com"},
            ]
        }

        self.sample_companies = ["Acme Corp", "TechStart", "CloudNine", "DataFlow", "NextGen"]
        self.sample_names = ["Sarah", "Mike", "Alex", "Jordan", "Taylor", "Chris", "Pat", "Sam"]
        self.sample_features = ["bulk import", "API webhooks", "SSO", "custom reports"]
        self.sample_vcs = ["Sequoia", "A16Z", "YC", "First Round", "Benchmark"]

    def _fill_template(self, template: Dict, rng: random.Random = None) -> Dict:
        """Fill in template placeholders with deterministic data"""
        rng = rng or self._rng
        result = template.copy()

        for key in ["subject", "from"]:
            value = result[key]
            if "{company}" in value:
                value = value.replace("{company}", rng.choice(self.sample_companies).lower().replace(" ", ""))
            if "{name}" in value:
                value = value.replace("{name}", rng.choice(self.sample_names).lower())
            if "{feature}" in value:
                value = value.replace("{feature}", rng.choice(self.sample_features))
            result[key] = value

        return result

    def get_inbox(self, limit: int = 15) -> List[Dict]:
        """Get simulated inbox emails (deterministic)"""
        # Create a fresh RNG seeded for inbox generation
        rng = random.Random()
        rng.seed(self._seed + 1000)  # Offset seed for inbox

        emails = []

        # Weight categories (urgent is rare, noise is common)
        category_weights = [
            ("urgent", 1),
            ("customer", 3),
            ("internal", 2),
            ("investor", 1),
            ("noise", 4)
        ]

        total_weight = sum(w for _, w in category_weights)

        for i in range(limit):
            # Pick category based on weights
            rand = rng.randint(1, total_weight)
            cumulative = 0
            category = "noise"
            for cat, weight in category_weights:
                cumulative += weight
                if rand <= cumulative:
                    category = cat
                    break

            template = rng.choice(self.email_templates[category])
            filled = self._fill_template(template, rng)

            # Generate realistic timestamp (last 3 days, more recent = more common)
            hours_ago = rng.randint(1, 72)
            timestamp = datetime.now() - timedelta(hours=hours_ago)

            email = {
                "id": f"email_{rng.randint(10000, 99999)}",
                "subject": filled["subject"],
                "from": filled["from"],
                "from_name": filled["from"].split("@")[0].replace(".", " ").title(),
                "timestamp": timestamp.isoformat(),
                "timestamp_display": self._format_timestamp(timestamp),
                "category": category,
                "preview": self._generate_preview(category),
                "is_read": rng.random() > 0.6,
                "is_starred": rng.random() > 0.9,
                "days_old": hours_ago // 24
            }
            emails.append(email)

        # Sort by timestamp (newest first)
        emails.sort(key=lambda x: x["timestamp"], reverse=True)
        return emails

    def _format_timestamp(self, ts: datetime) -> str:
        """Format timestamp for display"""
        now = datetime.now()
        diff = now - ts

        if diff.days == 0:
            if diff.seconds < 3600:
                return f"{diff.seconds // 60} min ago"
            return f"{diff.seconds // 3600} hours ago"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        else:
            return ts.strftime("%b %d")

    def _generate_preview(self, category: str) -> str:
        """Generate email preview text"""
        previews = {
            "urgent": "This needs your immediate attention. We're running low on time and...",
            "customer": "Hi, I wanted to reach out about our experience with your product...",
            "internal": "Hey, quick update on what we discussed. I've made progress on...",
            "investor": "Hope you're doing well. I wanted to follow up on our last conversation...",
            "noise": "You're receiving this email because you subscribed to..."
        }
        return previews.get(category, "")

    def get_threads_going_cold(self) -> List[Dict]:
        """Get email threads that haven't been responded to (deterministic)"""
        # Create a fresh RNG seeded for cold threads
        rng = random.Random()
        rng.seed(self._seed + 2000)  # Offset seed for cold threads

        cold_threads = []

        templates = [
            {"subject": "RE: Partnership discussion", "from": "partner@company.com", "days": 3},
            {"subject": "Following up on our call", "from": "customer@acme.com", "days": 4},
            {"subject": "RE: Proposal feedback", "from": "investor@vc.com", "days": 2},
            {"subject": "Still waiting on your response", "from": "vendor@tool.com", "days": 5},
        ]

        for template in templates:
            if rng.random() > 0.5:  # 50% chance each thread shows up (deterministic)
                cold_threads.append({
                    "subject": template["subject"],
                    "from": template["from"],
                    "days_cold": template["days"],
                    "last_message": f"{template['days']} days ago",
                    "suggested_action": "Send quick follow-up or close the loop"
                })

        return cold_threads

    def get_email_context_for_brief(self) -> Dict:
        """Get email context formatted for daily brief"""
        inbox = self.get_inbox(20)
        cold_threads = self.get_threads_going_cold()

        unread = [e for e in inbox if not e["is_read"]]
        urgent = [e for e in inbox if e["category"] == "urgent"]
        customer = [e for e in inbox if e["category"] == "customer"]

        return {
            "total_unread": len(unread),
            "urgent_count": len(urgent),
            "customer_emails": len(customer),
            "cold_threads": cold_threads,
            "needs_attention": urgent + [e for e in customer if not e["is_read"]][:3],
            "inbox_sample": inbox[:10]
        }


def get_mock_email(user_email: str = None) -> MockEmailService:
    """Factory function for mock email"""
    return MockEmailService(user_email)
