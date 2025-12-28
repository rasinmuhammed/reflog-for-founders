"""
Google Calendar Integration

Real Google Calendar API integration using OAuth credentials.
Implements the same interface as MockCalendarService for seamless switching.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from .google_auth import get_google_credentials


class GoogleCalendarService:
    """
    Real Google Calendar service using OAuth.

    Mirrors MockCalendarService interface for compatibility.
    """

    def __init__(self, db: Session, user_id: int, user_email: str = None):
        self.db = db
        self.user_id = user_id
        self.user_email = user_email
        self._service = None

    def _get_service(self):
        """Get authenticated Calendar API service."""
        if self._service:
            return self._service

        credentials = get_google_credentials(self.db, self.user_id)
        if not credentials:
            raise ValueError("Google Calendar not connected. Please connect your Google account.")

        self._service = build('calendar', 'v3', credentials=credentials)
        return self._service

    def is_connected(self) -> bool:
        """Check if user has valid Google Calendar connection."""
        credentials = get_google_credentials(self.db, self.user_id)
        return credentials is not None

    def get_todays_events(self) -> List[Dict]:
        """
        Get today's calendar events.

        Returns:
            List of event dicts with title, start_time, end_time, attendees, type
        """
        service = self._get_service()

        # Get today's range
        today = datetime.utcnow().date()
        time_min = datetime.combine(today, datetime.min.time()).isoformat() + 'Z'
        time_max = datetime.combine(today, datetime.max.time()).isoformat() + 'Z'

        try:
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime',
                maxResults=20
            ).execute()

            events = events_result.get('items', [])

            return [self._format_event(event) for event in events]
        except Exception as e:
            print(f"Error fetching calendar events: {e}")
            return []

    def get_upcoming_meetings(self, days: int = 7) -> List[Dict]:
        """
        Get upcoming meetings for the next N days.

        Args:
            days: Number of days to look ahead

        Returns:
            List of meeting dicts
        """
        service = self._get_service()

        now = datetime.utcnow()
        time_max = (now + timedelta(days=days)).isoformat() + 'Z'

        try:
            events_result = service.events().list(
                calendarId='primary',
                timeMin=now.isoformat() + 'Z',
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime',
                maxResults=50
            ).execute()

            events = events_result.get('items', [])

            # Filter to only meetings (events with attendees)
            meetings = [
                self._format_event(event)
                for event in events
                if event.get('attendees')
            ]

            return meetings
        except Exception as e:
            print(f"Error fetching upcoming meetings: {e}")
            return []

    def _format_event(self, event: Dict) -> Dict:
        """Format Google Calendar event to our standard format."""
        start = event.get('start', {})
        end = event.get('end', {})

        # Handle all-day events
        if 'dateTime' in start:
            start_time = start['dateTime']
            end_time = end.get('dateTime', start_time)
        else:
            start_time = start.get('date', '')
            end_time = end.get('date', start_time)

        # Get attendees
        attendees = []
        for attendee in event.get('attendees', []):
            attendees.append({
                "name": attendee.get('displayName', attendee.get('email', 'Unknown')),
                "email": attendee.get('email'),
                "response": attendee.get('responseStatus', 'needsAction')
            })

        # Determine event type
        event_type = "meeting"
        if not attendees:
            event_type = "focus_time"
        elif len(attendees) == 1:
            event_type = "one_on_one"
        elif len(attendees) > 5:
            event_type = "all_hands"

        # Check for video conferencing
        has_video = bool(event.get('hangoutLink') or event.get('conferenceData'))

        return {
            "id": event.get('id'),
            "title": event.get('summary', 'No title'),
            "description": event.get('description', ''),
            "start_time": start_time,
            "end_time": end_time,
            "attendees": attendees,
            "type": event_type,
            "location": event.get('location', ''),
            "has_video": has_video,
            "video_link": event.get('hangoutLink') or self._get_conference_link(event),
            "organizer": event.get('organizer', {}).get('email', ''),
            "status": event.get('status', 'confirmed')
        }

    def _get_conference_link(self, event: Dict) -> Optional[str]:
        """Extract video conference link from event."""
        conference_data = event.get('conferenceData', {})
        entry_points = conference_data.get('entryPoints', [])

        for entry in entry_points:
            if entry.get('entryPointType') == 'video':
                return entry.get('uri')

        return None

    def get_calendar_summary(self) -> str:
        """Generate a text summary of today's calendar."""
        events = self.get_todays_events()

        if not events:
            return "No events scheduled for today."

        summary_parts = [f"You have {len(events)} event(s) today:"]

        for event in events:
            time_str = event['start_time']
            if 'T' in time_str:
                time_str = time_str.split('T')[1][:5]  # Get HH:MM

            attendee_count = len(event['attendees'])
            if attendee_count > 0:
                summary_parts.append(f"- {time_str}: {event['title']} ({attendee_count} attendees)")
            else:
                summary_parts.append(f"- {time_str}: {event['title']}")

        return "\n".join(summary_parts)
