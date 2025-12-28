"""
Mock Calendar Integration

Provides simulated calendar events for development and testing.
In production, this would be replaced with real Google Calendar OAuth.
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import random


class MockCalendarService:
    """
    Mock Google Calendar service for development.
    Generates realistic-looking calendar events.
    DETERMINISTIC: Same user email always produces same calendar.
    """

    def __init__(self, user_email: str = None):
        self.user_email = user_email or "demo@reflog.ai"

        # Seed random with user email for deterministic output
        self._seed = hash(self.user_email) % (2**32)

        # Sample meeting templates
        self.meeting_templates = [
            {"title": "Team Standup", "duration": 15, "attendees": ["team"]},
            {"title": "Product Review", "duration": 60, "attendees": ["product", "design"]},
            {"title": "Customer Call - {company}", "duration": 30, "attendees": ["customer"]},
            {"title": "1:1 with {person}", "duration": 30, "attendees": ["{person}"]},
            {"title": "Investor Update", "duration": 45, "attendees": ["investors"]},
            {"title": "Sprint Planning", "duration": 90, "attendees": ["team"]},
            {"title": "Sales Pipeline Review", "duration": 30, "attendees": ["sales"]},
            {"title": "Marketing Sync", "duration": 30, "attendees": ["marketing"]},
            {"title": "Technical Architecture Discussion", "duration": 60, "attendees": ["engineering"]},
            {"title": "Board Meeting Prep", "duration": 60, "attendees": ["exec"]},
        ]

        self.sample_companies = ["Acme Corp", "TechStart", "CloudNine", "DataFlow", "NextGen"]
        self.sample_people = ["Sarah", "Mike", "Alex", "Jordan", "Taylor", "Chris"]

    def _get_rng(self, day_offset: int = 0) -> random.Random:
        """Get a deterministic random generator for this user and day."""
        rng = random.Random()
        rng.seed(self._seed + day_offset)
        return rng

    def get_todays_events(self) -> List[Dict]:
        """Get simulated calendar events for today (deterministic)"""
        rng = self._get_rng(day_offset=0)
        today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        events = []

        # Generate 3-5 meetings for today
        num_meetings = rng.randint(3, 5)
        current_time = today

        for _ in range(num_meetings):
            template = rng.choice(self.meeting_templates)
            title = template["title"]

            # Fill in template placeholders
            if "{company}" in title:
                title = title.format(company=rng.choice(self.sample_companies))
            if "{person}" in title:
                title = title.format(person=rng.choice(self.sample_people))

            # Generate attendees
            attendees = []
            for att in template["attendees"]:
                if att == "team":
                    attendees.extend([{"name": p, "email": f"{p.lower()}@company.com"}
                                     for p in rng.sample(self.sample_people, 3)])
                elif att == "customer":
                    company = rng.choice(self.sample_companies)
                    attendees.append({"name": f"Contact at {company}",
                                      "email": f"contact@{company.lower().replace(' ', '')}.com"})
                elif att.startswith("{"):
                    person = rng.choice(self.sample_people)
                    attendees.append({"name": person, "email": f"{person.lower()}@company.com"})
                else:
                    attendees.append({"name": f"{att.title()} Lead", "email": f"{att}@company.com"})

            event = {
                "id": f"event_{rng.randint(1000, 9999)}",
                "title": title,
                "start_time": current_time.isoformat(),
                "end_time": (current_time + timedelta(minutes=template["duration"])).isoformat(),
                "duration_minutes": template["duration"],
                "attendees": attendees,
                "location": rng.choice(["Zoom", "Google Meet", "Conference Room A", ""])
            }
            events.append(event)

            # Add gap between meetings (30-90 mins)
            current_time = current_time + timedelta(minutes=template["duration"] + rng.randint(30, 90))

        return events

    def get_upcoming_meetings(self, days: int = 7) -> List[Dict]:
        """Get upcoming meetings for the next N days (deterministic)"""
        meetings = []

        for day_offset in range(days):
            rng = self._get_rng(day_offset=day_offset)
            day = datetime.now() + timedelta(days=day_offset)
            day = day.replace(hour=9, minute=0, second=0, microsecond=0)

            # Fewer meetings on weekends
            if day.weekday() >= 5:  # Saturday or Sunday
                num_meetings = rng.randint(0, 1)
            else:
                num_meetings = rng.randint(2, 5)

            current_time = day
            for _ in range(num_meetings):
                template = rng.choice(self.meeting_templates)
                title = template["title"]

                if "{company}" in title:
                    title = title.format(company=rng.choice(self.sample_companies))
                if "{person}" in title:
                    title = title.format(person=rng.choice(self.sample_people))

                meeting = {
                    "id": f"event_{rng.randint(1000, 9999)}",
                    "title": title,
                    "start_time": current_time.isoformat(),
                    "duration_minutes": template["duration"],
                    "day": day.strftime("%A, %B %d")
                }
                meetings.append(meeting)
                current_time = current_time + timedelta(minutes=template["duration"] + rng.randint(30, 90))

        return meetings

    def get_calendar_context_for_brief(self) -> Dict:
        """Get calendar context formatted for daily brief"""
        events = self.get_todays_events()

        return {
            "total_meetings_today": len(events),
            "first_meeting": events[0] if events else None,
            "total_meeting_hours": sum(e["duration_minutes"] for e in events) / 60,
            "events": events,
            "context_switching_risk": len(events) > 4,
            "back_to_back": any(
                i < len(events) - 1 and
                datetime.fromisoformat(events[i]["end_time"]) >=
                datetime.fromisoformat(events[i + 1]["start_time"])
                for i in range(len(events) - 1)
            ) if len(events) > 1 else False
        }


def get_mock_calendar(user_email: str = None) -> MockCalendarService:
    """Factory function for mock calendar"""
    return MockCalendarService(user_email)
