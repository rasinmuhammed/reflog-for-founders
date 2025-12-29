"""
GitHub Client - Real Activity Data Integration

Uses PyGithub to fetch actual founder activity from GitHub.
Replaces the mock data with real commit, PR, and issue metrics.
"""
from github import Github, GithubException
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os


class GitHubClient:
    """
    GitHub API client for fetching real founder activity.
    
    Requires a GitHub personal access token for authenticated requests.
    Without a token, rate limits are very restrictive (60 requests/hour).
    """

    def __init__(self, token: str = None):
        """
        Initialize GitHub client.
        
        Args:
            token: GitHub Personal Access Token. If not provided,
                   tries to read from GITHUB_TOKEN environment variable.
        """
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.github = Github(self.token) if self.token else Github()
        self._rate_limit_remaining = None

    def get_founder_activity(
        self,
        username: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get real founder activity from GitHub.
        
        Args:
            username: GitHub username to analyze
            days: Number of days to look back (default: 7)
        
        Returns:
            Dict with commits, PRs merged, issues commented, and impact score
        """
        try:
            user = self.github.get_user(username)
            cutoff = datetime.utcnow() - timedelta(days=days)

            # Initialize counters
            commits = 0
            prs_merged = 0
            prs_opened = 0
            issues_commented = 0
            issues_opened = 0
            reviews_given = 0
            repos_contributed = set()

            # Fetch events (GitHub API returns up to 300 events, ~90 days)
            try:
                for event in user.get_events():
                    if event.created_at.replace(tzinfo=None) < cutoff:
                        break

                    event_type = event.type
                    payload = event.payload

                    if event_type == "PushEvent":
                        commit_count = len(payload.get("commits", []))
                        commits += commit_count
                        if event.repo:
                            repos_contributed.add(event.repo.name)

                    elif event_type == "PullRequestEvent":
                        action = payload.get("action")
                        pr = payload.get("pull_request", {})
                        if action == "opened":
                            prs_opened += 1
                        elif action == "closed" and pr.get("merged"):
                            prs_merged += 1
                        if event.repo:
                            repos_contributed.add(event.repo.name)

                    elif event_type == "IssueCommentEvent":
                        issues_commented += 1

                    elif event_type == "IssuesEvent":
                        if payload.get("action") == "opened":
                            issues_opened += 1

                    elif event_type == "PullRequestReviewEvent":
                        reviews_given += 1

            except GithubException as e:
                if e.status == 404:
                    return self._empty_activity(days, error="User not found")
                raise

            # Calculate Impact Score
            # Weights: Commits (1), PRs merged (5), PRs opened (2), 
            # Issues (1), Reviews (3)
            impact_score = (
                commits * 1 +
                prs_merged * 5 +
                prs_opened * 2 +
                issues_commented * 1 +
                issues_opened * 1 +
                reviews_given * 3
            )

            # Determine activity level
            if impact_score >= 50:
                activity_level = "high"
            elif impact_score >= 20:
                activity_level = "medium"
            elif impact_score > 0:
                activity_level = "low"
            else:
                activity_level = "inactive"

            return {
                "username": username,
                "period_days": days,
                "commits": commits,
                "prs_merged": prs_merged,
                "prs_opened": prs_opened,
                "issues_commented": issues_commented,
                "issues_opened": issues_opened,
                "reviews_given": reviews_given,
                "repos_contributed": len(repos_contributed),
                "impact_score": impact_score,
                "activity_level": activity_level,
                "last_updated": datetime.utcnow().isoformat(),
                "is_real_data": True
            }

        except GithubException as e:
            return self._empty_activity(
                days,
                error=f"GitHub API error: {e.data.get('message', str(e))}"
            )
        except Exception as e:
            return self._empty_activity(days, error=str(e))

    def get_recent_activity(self, username: str) -> Dict[str, Any]:
        """
        Backwards compatible method for existing code.
        Returns activity for last 24 hours.
        """
        activity = self.get_founder_activity(username, days=1)
        
        # Map to old format for backwards compatibility
        return {
            "total_commits_24h": activity.get("commits", 0),
            "active_repos": activity.get("repos_contributed", 0),
            "last_commit_time": datetime.utcnow() - timedelta(hours=1),
            "impact_score": activity.get("impact_score", 0),
            "is_real_data": activity.get("is_real_data", False)
        }

    def get_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        """Get basic GitHub profile information"""
        try:
            user = self.github.get_user(username)
            return {
                "login": user.login,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "bio": user.bio,
                "company": user.company,
                "location": user.location,
                "public_repos": user.public_repos,
                "followers": user.followers,
                "following": user.following,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        except GithubException:
            return None

    def check_rate_limit(self) -> Dict[str, int]:
        """Check current GitHub API rate limit status"""
        rate_limit = self.github.get_rate_limit()
        core = rate_limit.core
        return {
            "remaining": core.remaining,
            "limit": core.limit,
            "reset_at": core.reset.isoformat()
        }

    def _empty_activity(
        self,
        days: int,
        error: str = None
    ) -> Dict[str, Any]:
        """Return empty activity structure"""
        return {
            "username": None,
            "period_days": days,
            "commits": 0,
            "prs_merged": 0,
            "prs_opened": 0,
            "issues_commented": 0,
            "issues_opened": 0,
            "reviews_given": 0,
            "repos_contributed": 0,
            "impact_score": 0,
            "activity_level": "unknown",
            "last_updated": datetime.utcnow().isoformat(),
            "is_real_data": False,
            "error": error
        }
