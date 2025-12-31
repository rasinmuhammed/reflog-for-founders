"""
Load Test for Reflog Executive Intelligence API

Tests API endpoints under load to ensure production readiness.
Target: 100 concurrent users
"""

from locust import HttpUser, task, between
import random


class ReflogUser(HttpUser):
    """Simulates a typical Reflog user"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Setup: Create a test user email"""
        self.email = f"loadtest_{random.randint(1000, 9999)}@test.com"
    
    @task(3)  # Weight: 30% of requests
    def get_dashboard(self):
        """Get dashboard data"""
        self.client.get(f"/dashboard/{self.email}")
    
    @task(2)  # Weight: 20% of requests
    def get_brief(self):
        """Get command brief"""
        self.client.get(f"/command-brief/{self.email}")
    
    @task(2)  # Weight: 20% of requests  
    def get_metrics(self):
        """Get founder score"""
        self.client.get(f"/score/{self.email}")
    
    @task(1)  # Weight: 10% of requests
    def get_advice(self):
        """Get AI advice history"""
        self.client.get(f"/advice/{self.email}")
    
    @task(1)  # Weight: 10% of requests
    def get_shadow(self):
        """Get Shadow Mode roast"""
        self.client.get(f"/shadow/latest/{self.email}")
    
    @task(1)  # Weight: 10% of requests
    def health_check(self):
        """Health check"""
        self.client.get("/health")


class CompetitorIntelUser(HttpUser):
    """Simulates usage of Competitor Intelligence features"""
    
    wait_time = between(2, 5)
    
    def on_start(self):
        self.email = f"loadtest_intel_{random.randint(1000, 9999)}@test.com"
    
    @task(1)
    def get_competitors(self):
        """Get tracked competitors"""
        self.client.get(f"/competitors/list/{self.email}")
    
    @task(1)
    def get_intelligence(self):
        """Get intelligence reports"""
        self.client.get(f"/competitors/intel/{self.email}")
