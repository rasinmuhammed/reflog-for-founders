import random

class StripeClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key

    def get_mrr(self):
        # Mock data
        return random.randint(1000, 5000)

    def get_recent_charges(self, limit=5):
        # Mock data
        return [
            {"amount": 9900, "currency": "usd", "status": "succeeded"}
            for _ in range(limit)
        ]
