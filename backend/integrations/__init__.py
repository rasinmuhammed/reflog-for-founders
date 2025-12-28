"""
Integration Service Factory

Provides a unified interface for calendar and email integrations.
Switches between mock and real implementations based on environment.

Supports:
- Mock mode (default): Uses mock data for development/demo
- Production mode: Uses real Google APIs with OAuth
"""

from .mock_email import get_mock_email, MockEmailService
from .mock_calendar import get_mock_calendar, MockCalendarService
import os
from typing import Optional
from sqlalchemy.orm import Session

# Environment variable to control integration mode
INTEGRATION_MODE = os.getenv("INTEGRATION_MODE", "mock")  # "mock" or "production"


def get_calendar_service(user_email: str = None, db: Session = None, user_id: int = None):
    """
    Factory function for calendar service.
    Returns mock or real implementation based on INTEGRATION_MODE.

    Args:
        user_email: User's email (for mock mode)
        db: Database session (for production mode)
        user_id: User's ID (for production mode)
    """
    if INTEGRATION_MODE == "production" and db and user_id:
        from .google_calendar import GoogleCalendarService
        return GoogleCalendarService(db=db, user_id=user_id, user_email=user_email)
    else:
        from .mock_calendar import MockCalendarService
        return MockCalendarService(user_email)


def get_email_service(user_email: str = None, db: Session = None, user_id: int = None):
    """
    Factory function for email service.
    Returns mock or real implementation based on INTEGRATION_MODE.

    Args:
        user_email: User's email (for mock mode)
        db: Database session (for production mode)
        user_id: User's ID (for production mode)
    """
    if INTEGRATION_MODE == "production" and db and user_id:
        from .google_email import GoogleEmailService
        return GoogleEmailService(db=db, user_id=user_id, user_email=user_email)
    else:
        from .mock_email import MockEmailService
        return MockEmailService(user_email)


def is_production_mode() -> bool:
    """Check if running in production mode with real integrations."""
    return INTEGRATION_MODE == "production"


def get_integration_status(db: Session = None, user_id: int = None) -> dict:
    """
    Get status of integrations for a user.

    Returns:
        Dict with mode and connection status for each integration
    """
    status = {
        "mode": INTEGRATION_MODE,
        "calendar": {"connected": False, "provider": "mock" if INTEGRATION_MODE == "mock" else "google"},
        "email": {"connected": False, "provider": "mock" if INTEGRATION_MODE == "mock" else "google"}
    }

    if INTEGRATION_MODE == "mock":
        status["calendar"]["connected"] = True
        status["email"]["connected"] = True
    elif db and user_id:
        from .google_auth import get_connection_status
        google_status = get_connection_status(db, user_id)
        status["calendar"]["connected"] = google_status["is_connected"]
        status["email"]["connected"] = google_status["is_connected"]
        status["google_scopes"] = google_status.get("scopes", [])

    return status


# Re-export for backwards compatibility
