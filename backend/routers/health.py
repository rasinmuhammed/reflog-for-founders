"""
Health check endpoint for monitoring
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import os

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """
    Health check endpoint for uptime monitoring
    Returns 200 if service is healthy
    """
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "2.0.0"
    }

@router.get("/health/db")
async def database_health(db: Session = Depends(get_db)):
    """
    Database health check
    """
    try:
        # Simple query to test database connection
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }, 503
