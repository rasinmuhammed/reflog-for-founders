"""
Google Gmail Integration

Real Gmail API integration using OAuth credentials.
Implements the same interface as MockEmailService for seamless switching.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import base64
from email.utils import parsedate_to_datetime

from .google_auth import get_google_credentials


class GoogleEmailService:
    """
    Real Gmail service using OAuth.

    Mirrors MockEmailService interface for compatibility.
    """

    def __init__(self, db: Session, user_id: int, user_email: str = None):
        self.db = db
        self.user_id = user_id
        self.user_email = user_email
        self._service = None

    def _get_service(self):
        """Get authenticated Gmail API service."""
        if self._service:
            return self._service

        credentials = get_google_credentials(self.db, self.user_id)
        if not credentials:
            raise ValueError("Gmail not connected. Please connect your Google account.")

        self._service = build('gmail', 'v1', credentials=credentials)
        return self._service

    def is_connected(self) -> bool:
        """Check if user has valid Gmail connection."""
        credentials = get_google_credentials(self.db, self.user_id)
        return credentials is not None

    def get_inbox(self, max_results: int = 20) -> List[Dict]:
        """
        Get recent inbox emails.

        Args:
            max_results: Maximum number of emails to return

        Returns:
            List of email dicts with sender, subject, snippet, date, etc.
        """
        service = self._get_service()

        try:
            # Get message list
            results = service.users().messages().list(
                userId='me',
                labelIds=['INBOX'],
                maxResults=max_results
            ).execute()

            messages = results.get('messages', [])

            emails = []
            for msg in messages[:max_results]:
                email_data = self._get_message_details(service, msg['id'])
                if email_data:
                    emails.append(email_data)

            return emails
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []

    def get_threads_going_cold(self, days_threshold: int = 3) -> List[Dict]:
        """
        Get email threads that haven't received responses.

        Args:
            days_threshold: Days without reply to consider "cold"

        Returns:
            List of cold thread dicts
        """
        service = self._get_service()

        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
        query = f"is:inbox after:{threshold_date.strftime('%Y/%m/%d')}"

        try:
            # Get threads
            results = service.users().threads().list(
                userId='me',
                q=query,
                maxResults=30
            ).execute()

            threads = results.get('threads', [])
            cold_threads = []

            for thread in threads:
                thread_detail = service.users().threads().get(
                    userId='me',
                    id=thread['id'],
                    format='metadata',
                    metadataHeaders=['From', 'Subject', 'Date']
                ).execute()

                messages = thread_detail.get('messages', [])
                if len(messages) >= 1:
                    # Check if we sent the last message (means we're waiting for reply)
                    last_message = messages[-1]
                    headers = {h['name']: h['value'] for h in last_message.get('payload', {}).get('headers', [])}

                    from_addr = headers.get('From', '')

                    # If we sent the last message, this thread might be going cold
                    if self.user_email and self.user_email.lower() in from_addr.lower():
                        first_msg = messages[0]
                        first_headers = {h['name']: h['value'] for h in first_msg.get('payload', {}).get('headers', [])}

                        cold_threads.append({
                            "thread_id": thread['id'],
                            "subject": first_headers.get('Subject', 'No subject'),
                            "last_sender": "You",
                            "waiting_for": from_addr.split('<')[0].strip() if '<' in from_addr else from_addr,
                            "last_message_date": headers.get('Date', ''),
                            "message_count": len(messages),
                            "snippet": thread_detail.get('snippet', '')[:100]
                        })

            return cold_threads[:10]  # Return top 10 cold threads
        except Exception as e:
            print(f"Error finding cold threads: {e}")
            return []

    def _get_message_details(self, service, message_id: str) -> Optional[Dict]:
        """Get full details for a single message."""
        try:
            message = service.users().messages().get(
                userId='me',
                id=message_id,
                format='metadata',
                metadataHeaders=['From', 'To', 'Subject', 'Date']
            ).execute()

            headers = {}
            for header in message.get('payload', {}).get('headers', []):
                headers[header['name']] = header['value']

            # Parse sender
            from_raw = headers.get('From', 'Unknown')
            if '<' in from_raw:
                sender_name = from_raw.split('<')[0].strip().strip('"')
                sender_email = from_raw.split('<')[1].rstrip('>')
            else:
                sender_name = from_raw
                sender_email = from_raw

            # Determine priority/category
            labels = message.get('labelIds', [])
            is_important = 'IMPORTANT' in labels
            is_starred = 'STARRED' in labels
            is_unread = 'UNREAD' in labels

            priority = "normal"
            if is_important or is_starred:
                priority = "high"

            return {
                "id": message_id,
                "thread_id": message.get('threadId'),
                "sender": {
                    "name": sender_name,
                    "email": sender_email
                },
                "subject": headers.get('Subject', 'No subject'),
                "snippet": message.get('snippet', ''),
                "date": headers.get('Date', ''),
                "is_unread": is_unread,
                "is_important": is_important,
                "is_starred": is_starred,
                "priority": priority,
                "labels": labels
            }
        except Exception as e:
            print(f"Error getting message {message_id}: {e}")
            return None

    def get_email_summary(self) -> str:
        """Generate a text summary of inbox status."""
        try:
            emails = self.get_inbox(max_results=50)

            unread_count = sum(1 for e in emails if e.get('is_unread', False))
            important_count = sum(1 for e in emails if e.get('is_important', False))

            summary = f"You have {unread_count} unread emails"
            if important_count > 0:
                summary += f" ({important_count} marked important)"

            return summary
        except BaseException:
            return "Unable to fetch email summary. Please check your Google connection."

    def get_unread_count(self) -> int:
        """Get count of unread emails in inbox."""
        try:
            service = self._get_service()

            # Get unread count efficiently
            results = service.users().labels().get(
                userId='me',
                id='INBOX'
            ).execute()

            return results.get('messagesUnread', 0)
        except BaseException:
            return 0
