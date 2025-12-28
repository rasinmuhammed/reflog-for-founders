"""
Google OAuth Router

Provides OAuth endpoints for connecting Google Calendar and Gmail.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User
from integrations.google_auth import (
    is_google_oauth_configured,
    get_authorization_url,
    exchange_code_for_tokens,
    store_google_tokens,
    revoke_google_connection,
    get_connection_status
)

router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])


def get_user_by_email(email: str, db: Session) -> User:
    """Get user by email."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/status/{email}")
async def check_google_connection(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Check if user has connected their Google account.

    Returns:
        - is_configured: Whether Google OAuth is set up on the platform
        - is_connected: Whether user has connected their account
        - scopes: List of granted scopes
    """
    user = get_user_by_email(email, db)

    status = get_connection_status(db, user.id)
    status["is_configured"] = is_google_oauth_configured()

    return status


@router.get("/connect/{email}")
async def initiate_google_connection(
    email: str,
    redirect_uri: Optional[str] = Query(None, description="Where to redirect after OAuth"),
    db: Session = Depends(get_db)
):
    """
    Initiate Google OAuth connection.
    Returns the authorization URL to redirect the user to.

    The user will be redirected to Google's login page.
    After authorization, they'll be sent to /auth/google/callback.
    """
    if not is_google_oauth_configured():
        raise HTTPException(
            status_code=503,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )

    user = get_user_by_email(email, db)

    # Use email as state for callback identification
    state = f"{email}|{redirect_uri or ''}"

    auth_url = get_authorization_url(state=state)

    return {"authorization_url": auth_url}


@router.get("/callback")
async def google_oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query("", description="State parameter containing user email"),
    error: str = Query(None),
    db: Session = Depends(get_db)
):
    """
    Handle OAuth callback from Google.
    Exchanges code for tokens and stores them.
    """
    if error:
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"http://localhost:3000/settings?google_error={error}",
            status_code=302
        )

    # Parse state
    parts = state.split("|")
    email = parts[0] if parts else ""
    redirect_uri = parts[1] if len(parts) > 1 and parts[1] else "http://localhost:3000/settings"

    if not email:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    user = get_user_by_email(email, db)

    try:
        # Exchange code for tokens
        tokens = exchange_code_for_tokens(code)

        # Store tokens
        store_google_tokens(db, user.id, tokens)

        # Redirect to frontend with success
        return RedirectResponse(
            url=f"{redirect_uri}?google_connected=true",
            status_code=302
        )
    except Exception as e:
        print(f"OAuth callback error: {e}")
        return RedirectResponse(
            url=f"{redirect_uri}?google_error=token_exchange_failed",
            status_code=302
        )


@router.delete("/disconnect/{email}")
async def disconnect_google(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Disconnect Google account for a user.
    Removes stored tokens.
    """
    user = get_user_by_email(email, db)

    success = revoke_google_connection(db, user.id)

    return {
        "success": success,
        "message": "Google account disconnected" if success else "No connection found"
    }
