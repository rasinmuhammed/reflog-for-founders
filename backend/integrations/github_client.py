import random
from datetime import datetime, timedelta

class GitHubClient:
    def __init__(self, token: str = None):
        self.token = token

    def get_recent_activity(self, username: str):
        # Mock data for now
        # In production, use PyGithub or requests to fetch real events
        return {
            "total_commits_24h": random.randint(0, 15),
            "active_repos": random.randint(1, 5),
            "last_commit_time": datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        }
