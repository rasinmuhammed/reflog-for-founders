"""
Google OAuth Authentication Handler

Handles the OAuth 2.0 flow for Google Calendar and Gmail access:
1. Generate authorization URL
2. Exchange code for tokens
3. Refresh expired tokens
4. Store/retrieve tokens from database
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from sqlalchemy.orm import Session
from encryption import encrypt_value, decrypt_value

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

# Scopes we request
SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",  # Read calendar events
    "https://www.googleapis.com/auth/gmail.readonly",     # Read emails
    "https://www.googleapis.com/auth/gmail.labels",       # Read labels
]

# Client config for OAuth flow
CLIENT_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [GOOGLE_REDIRECT_URI],
    }
}


def is_google_oauth_configured() -> bool:
    """Check if Google OAuth credentials are configured."""
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def get_authorization_url(state: Optional[str] = None) -> str:
    """
    Generate the Google OAuth authorization URL.

    Args:
        state: Optional state parameter for CSRF protection

    Returns:
        Authorization URL to redirect user to
    """
    if not is_google_oauth_configured():
        raise ValueError("Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")

    flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI

    authorization_url, _ = flow.authorization_url(
        access_type='offline',  # Get refresh token
        include_granted_scopes='true',
        prompt='consent',  # Force consent to get refresh token
        state=state
    )

    return authorization_url


def exchange_code_for_tokens(code: str) -> Dict:
    """
    Exchange authorization code for access and refresh tokens.

    Args:
        code: Authorization code from Google callback

    Returns:
        Dict with access_token, refresh_token, expiry, and scopes
    """
    if not is_google_oauth_configured():
        raise ValueError("Google OAuth not configured.")

    flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI

    # Exchange code for tokens
    flow.fetch_token(code=code)
    credentials = flow.credentials

    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "expiry": credentials.expiry,
        "scopes": list(credentials.scopes) if credentials.scopes else SCOPES
    }


def refresh_access_token(refresh_token: str) -> Dict:
    """
    Refresh an expired access token.

    Args:
        refresh_token: The refresh token

    Returns:
        Dict with new access_token and expiry
    """
    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    credentials.refresh(Request())

    return {
        "access_token": credentials.token,
        "expiry": credentials.expiry
    }


def store_google_tokens(db: Session, user_id: int, tokens: Dict) -> None:
    """
    Store Google OAuth tokens in the database (encrypted).

    Args:
        db: Database session
        user_id: User's ID
        tokens: Dict with access_token, refresh_token, expiry, scopes
    """
    from models import GoogleToken

    # Check if user already has tokens
    existing = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()

    # Encrypt tokens
    encrypted_access = encrypt_value(tokens["access_token"])
    encrypted_refresh = encrypt_value(tokens["refresh_token"]) if tokens.get("refresh_token") else None

    if existing:
        # Update existing tokens
        existing.access_token = encrypted_access
        if encrypted_refresh:
            existing.refresh_token = encrypted_refresh
        existing.token_expiry = tokens.get("expiry")
        existing.scopes = tokens.get("scopes", SCOPES)
        existing.is_connected = True
        existing.last_refreshed = datetime.utcnow()
        existing.updated_at = datetime.utcnow()
    else:
        # Create new token record
        new_token = GoogleToken(
            user_id=user_id,
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            token_expiry=tokens.get("expiry"),
            scopes=tokens.get("scopes", SCOPES),
            is_connected=True
        )
        db.add(new_token)

    db.commit()


def get_google_credentials(db: Session, user_id: int) -> Optional[Credentials]:
    """
    Get valid Google credentials for a user.
    Automatically refreshes if expired.

    Args:
        db: Database session
        user_id: User's ID

    Returns:
        Google Credentials object or None if not connected
    """
    from models import GoogleToken

    token_record = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()

    if not token_record:
        return None

    # Decrypt tokens
    try:
        access_token = decrypt_value(token_record.access_token)
        refresh_token = decrypt_value(token_record.refresh_token) if token_record.refresh_token else None
    except BaseException:
        # Fallback if not encrypted
        access_token = token_record.access_token
        refresh_token = token_record.refresh_token

    # Create credentials object
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        expiry=token_record.token_expiry
    )

    # Check if expired and refresh if needed
    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())

            # Update stored tokens
            token_record.access_token = encrypt_value(credentials.token)
            token_record.token_expiry = credentials.expiry
            token_record.last_refreshed = datetime.utcnow()
            db.commit()
        except Exception as e:
            # Token refresh failed - mark as disconnected
            token_record.is_connected = False
            db.commit()
            return None

    return credentials


def revoke_google_connection(db: Session, user_id: int) -> bool:
    """
    Revoke Google OAuth connection for a user.

    Args:
        db: Database session
        user_id: User's ID

    Returns:
        True if successfully revoked
    """
    from models import GoogleToken

    token_record = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()

    if token_record:
        db.delete(token_record)
        db.commit()
        return True

    return False


def get_connection_status(db: Session, user_id: int) -> Dict:
    """
    Get Google connection status for a user.

    Returns:
        Dict with is_connected, last_refreshed, scopes
    """
    from models import GoogleToken

    token_record = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()

    if not token_record:
        return {
            "is_connected": False,
            "scopes": []
        }

    return {
        "is_connected": token_record.is_connected,
        "last_refreshed": token_record.last_refreshed.isoformat() if token_record.last_refreshed else None,
        "scopes": token_record.scopes or []
    }
