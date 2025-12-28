"""
Stripe client placeholder.
This is a stub that returns None instead of fake data.
Replace with actual Stripe integration when ready.
"""
import os
from typing import Optional, List, Dict, Any

STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")


class StripeClient:
    """
    Stripe API client placeholder.
    Returns None for all methods until properly configured.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or STRIPE_API_KEY
        self.is_configured = bool(self.api_key)

    def get_mrr(self) -> Optional[int]:
        """
        Get Monthly Recurring Revenue.
        Returns None if Stripe is not configured.
        """
        if not self.is_configured:
            return None
        # TODO: Implement actual Stripe API call
        # import stripe
        # stripe.api_key = self.api_key
        # ... calculate MRR from subscriptions
        return None

    def get_recent_charges(self, limit: int = 5) -> Optional[List[Dict[str, Any]]]:
        """
        Get recent charges.
        Returns None if Stripe is not configured.
        """
        if not self.is_configured:
            return None
        # TODO: Implement actual Stripe API call
        return None

    def get_customer_count(self) -> Optional[int]:
        """
        Get total customer count.
        Returns None if Stripe is not configured.
        """
        if not self.is_configured:
            return None
        # TODO: Implement actual Stripe API call
        return None


# Singleton instance
stripe_client = StripeClient() if STRIPE_API_KEY else None
