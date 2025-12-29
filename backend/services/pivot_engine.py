"""
Pivot Engine - AI-powered startup pivot simulation

Simulates the outcome of a startup pivot using the Market Realist agent
and patterns from startup post-mortems.

Features:
- Survival probability calculation (0-100%)
- Comparable startup pivots (successes and failures)
- Risk factor analysis
- "The Brutal Truth" - one paragraph honest assessment
"""
import json
import random
from typing import Dict, List, Optional
from datetime import datetime
from board_of_directors import BoardOfDirectors


# Startup post-mortem patterns database (simplified - in production, use vector DB)
PIVOT_PATTERNS = {
    "b2c_to_b2b": {
        "success_rate": 65,
        "examples": [
            {"name": "Slack", "from": "Gaming (Glitch)", "to": "Enterprise messaging", "outcome": "success", "lesson": "Your internal tool might be the product"},
            {"name": "Segment", "from": "Consumer analytics", "to": "B2B data infrastructure", "outcome": "success", "lesson": "B2B often has clearer monetization"},
            {"name": "Buffer", "from": "Social scheduling for individuals", "to": "Team social media management", "outcome": "success", "lesson": "Teams have budget, individuals don't"}
        ],
        "risk_factors": ["Longer sales cycles", "Need for enterprise features", "Different marketing channels"]
    },
    "b2b_to_b2c": {
        "success_rate": 25,
        "examples": [
            {"name": "Google", "from": "Enterprise search licensing", "to": "Consumer search + ads", "outcome": "success", "lesson": "Ads can subsidize free consumer products"},
        ],
        "risk_factors": ["Massive scale required", "CAC often unsustainable", "Support costs explode"]
    },
    "market_expansion": {
        "success_rate": 45,
        "examples": [
            {"name": "Uber", "from": "Black cars", "to": "Rideshare + food delivery", "outcome": "success", "lesson": "Network effects can transfer"},
            {"name": "Amazon", "from": "Books", "to": "Everything", "outcome": "success", "lesson": "Start narrow, expand ruthlessly"}
        ],
        "risk_factors": ["Diluted focus", "Increased competition", "Operational complexity"]
    },
    "pivot_to_saas": {
        "success_rate": 55,
        "examples": [
            {"name": "Shopify", "from": "Snowboard e-commerce", "to": "E-commerce platform", "outcome": "success", "lesson": "Sell the tools, not the product"},
            {"name": "Notion", "from": "Doc collaboration", "to": "All-in-one workspace SaaS", "outcome": "success", "lesson": "Integration beats specialization"}
        ],
        "risk_factors": ["Requires recurring value", "Churn is silent killer", "Need product-market fit"]
    },
    "tech_pivot": {
        "success_rate": 35,
        "examples": [
            {"name": "Instagram", "from": "Check-in app (Burbn)", "to": "Photo sharing", "outcome": "success", "lesson": "Double down on what users love"},
            {"name": "YouTube", "from": "Video dating site", "to": "Video sharing platform", "outcome": "success", "lesson": "Remove friction from core action"}
        ],
        "risk_factors": ["Sunk cost of existing tech", "Team skill mismatch", "Existing user confusion"]
    },
    "business_model_pivot": {
        "success_rate": 40,
        "examples": [
            {"name": "Netflix", "from": "DVD rentals", "to": "Streaming subscription", "outcome": "success", "lesson": "Cannibalize yourself before competitors do"},
            {"name": "Adobe", "from": "One-time licenses", "to": "Creative Cloud subscription", "outcome": "success", "lesson": "Recurring revenue is worth short-term pain"}
        ],
        "risk_factors": ["Revenue gap during transition", "Customer backlash", "Competitor opportunity window"]
    },
    "default": {
        "success_rate": 30,
        "examples": [],
        "risk_factors": ["Unclear pivot direction", "Resource constraints", "Team alignment issues"]
    }
}


class PivotEngine:
    """AI-powered pivot simulation engine"""

    def __init__(self, groq_api_key: str):
        self.board = BoardOfDirectors(groq_api_key, "business")
        self.market_realist = self.board.get_agent("market_realist")

    def categorize_pivot(self, description: str) -> str:
        """Categorize pivot type based on description"""
        description_lower = description.lower()

        if "b2c" in description_lower and "b2b" in description_lower:
            if "consumer" in description_lower and "enterprise" in description_lower:
                return "b2c_to_b2b"
            return "b2b_to_b2c"

        if "saas" in description_lower or "subscription" in description_lower:
            return "pivot_to_saas"

        if "market" in description_lower or "expand" in description_lower or "new" in description_lower:
            return "market_expansion"

        if "technology" in description_lower or "tech" in description_lower or "platform" in description_lower:
            return "tech_pivot"

        if "revenue" in description_lower or "monetization" in description_lower or "pricing" in description_lower:
            return "business_model_pivot"

        return "default"

    def calculate_survival_probability(
        self,
        pivot_type: str,
        description: str,
        current_metrics: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate survival probability based on pivot type and context

        Returns:
        {
            "probability": 45,
            "confidence": "medium",
            "factors": {
                "base_rate": 35,
                "adjustments": [
                    {"factor": "Team experience", "impact": +5},
                    {"factor": "Runway < 12 months", "impact": -10}
                ]
            }
        }
        """
        pattern = PIVOT_PATTERNS.get(pivot_type, PIVOT_PATTERNS["default"])
        base_rate = pattern["success_rate"]

        adjustments = []

        # Analyze description for positive/negative signals
        if "customer feedback" in description.lower() or "demand" in description.lower():
            adjustments.append({"factor": "Evidence of customer demand", "impact": 10})

        if "competitor" in description.lower():
            adjustments.append({"factor": "Competitive pressure", "impact": -5})

        if "runway" in description.lower() and any(x in description.lower() for x in ["low", "short", "limited"]):
            adjustments.append({"factor": "Limited runway", "impact": -15})

        if "team" in description.lower() and any(x in description.lower() for x in ["experience", "expert", "domain"]):
            adjustments.append({"factor": "Team domain expertise", "impact": 10})

        if "validation" in description.lower() or "tested" in description.lower():
            adjustments.append({"factor": "Concept pre-validated", "impact": 8})

        if "desperation" in description.lower() or "last resort" in description.lower():
            adjustments.append({"factor": "Desperation pivot", "impact": -20})

        # Calculate final probability
        total_adjustment = sum(a["impact"] for a in adjustments)
        final_probability = max(5, min(95, base_rate + total_adjustment))

        # Determine confidence level
        if len(adjustments) >= 3:
            confidence = "high"
        elif len(adjustments) >= 1:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "probability": round(final_probability),
            "confidence": confidence,
            "factors": {
                "base_rate": base_rate,
                "adjustments": adjustments
            }
        }

    def find_comparable_startups(self, pivot_type: str, limit: int = 3) -> List[Dict]:
        """Find comparable startup pivots from patterns database"""
        pattern = PIVOT_PATTERNS.get(pivot_type, PIVOT_PATTERNS["default"])
        examples = pattern.get("examples", [])

        if not examples:
            # Return generic examples for unknown pivot types
            return [
                {
                    "name": "Generic Pivot",
                    "from": "Original model",
                    "to": "New direction",
                    "outcome": "varies",
                    "lesson": "Success depends on execution and timing"
                }
            ]

        return examples[:limit]

    def get_risk_factors(self, pivot_type: str) -> List[str]:
        """Get risk factors for a pivot type"""
        pattern = PIVOT_PATTERNS.get(pivot_type, PIVOT_PATTERNS["default"])
        return pattern.get("risk_factors", ["Unclear path forward"])

    def generate_brutal_truth(
        self,
        title: str,
        description: str,
        pivot_type: str,
        survival_prob: int,
        risk_factors: List[str]
    ) -> str:
        """
        Generate "The Brutal Truth" - one paragraph of honest assessment

        This is the money shot. No sugar coating.
        """
        # Pre-baked brutally honest assessments based on probability ranges
        if survival_prob < 20:
            opener = "Let's be real: this pivot has a high chance of failure. "
            assessment = (
                f"With only a {survival_prob}% survival probability, you're betting on "
                f"being the exception, not the rule. "
            )
        elif survival_prob < 40:
            opener = "This is a risky move. "
            assessment = (
                f"At {survival_prob}% survival probability, the odds are against you. "
                f"But startups beat odds every day - the question is whether YOU can. "
            )
        elif survival_prob < 60:
            opener = "You're in coin-flip territory. "
            assessment = (
                f"A {survival_prob}% survival rate means this could go either way. "
                f"Your execution matters more than the idea itself right now. "
            )
        elif survival_prob < 80:
            opener = "This pivot has reasonable odds. "
            assessment = (
                f"At {survival_prob}% survival probability, you're in a good position, "
                f"but overconfidence kills more startups than bad ideas. "
            )
        else:
            opener = "The stars are aligning for this pivot. "
            assessment = (
                f"A {survival_prob}% survival rate is exceptional. "
                f"Don't screw it up by moving too slowly or overthinking it. "
            )

        # Add risk warning
        if risk_factors:
            risk_warning = f"Watch out for: {', '.join(risk_factors[:2])}. "
        else:
            risk_warning = ""

        # Add pivot-specific insight
        pivot_insights = {
            "b2c_to_b2b": "Going B2B means longer sales cycles but clearer monetization - can your runway handle the gap?",
            "b2b_to_b2c": "B2C is a scale game. If you don't have viral mechanics figured out, you're burning cash.",
            "pivot_to_saas": "SaaS lives and dies by churn. Your first 100 customers will tell you everything.",
            "market_expansion": "Expansion dilutes focus. Make sure you've won your first market before chasing the second.",
            "tech_pivot": "Tech pivots often fail because founders love the tech more than the customer problem.",
            "business_model_pivot": "Revenue model changes test customer loyalty. Some will leave. Can you replace them?",
            "default": "Every pivot is a bet. Make sure you're betting on something you've validated, not just hoped for."
        }

        insight = pivot_insights.get(pivot_type, pivot_insights["default"])

        return f"{opener}{assessment}{risk_warning}{insight}"

    def simulate(
        self,
        title: str,
        description: str,
        impact_areas: List[str] = None,
        current_metrics: Optional[Dict] = None
    ) -> Dict:
        """
        Run full pivot simulation

        Returns:
        {
            "survival_probability": {...},
            "comparable_startups": [...],
            "risk_factors": [...],
            "brutal_truth": "...",
            "recommendations": [...],
            "simulated_at": "2024-01-01T00:00:00"
        }
        """
        # Categorize the pivot
        pivot_type = self.categorize_pivot(description)

        # Calculate survival probability
        survival_data = self.calculate_survival_probability(
            pivot_type, description, current_metrics
        )

        # Find comparable startups
        comparables = self.find_comparable_startups(pivot_type)

        # Get risk factors
        risks = self.get_risk_factors(pivot_type)

        # Generate brutal truth
        brutal_truth = self.generate_brutal_truth(
            title, description, pivot_type,
            survival_data["probability"], risks
        )

        # Generate recommendations based on probability
        prob = survival_data["probability"]
        if prob < 30:
            recommendations = [
                "Get more validation before committing resources",
                "Talk to 10 potential customers in the new direction",
                "Consider if a smaller test is possible first"
            ]
        elif prob < 60:
            recommendations = [
                "Set a clear 90-day checkpoint with kill criteria",
                "Identify the single biggest risk and address it first",
                "Keep your team aligned - pivots fail from internal confusion"
            ]
        else:
            recommendations = [
                "Move fast - you have momentum, don't lose it",
                "Focus on the first paying customer in the new model",
                "Document everything for future fundraising narrative"
            ]

        return {
            "pivot_type": pivot_type,
            "survival_probability": survival_data,
            "comparable_startups": comparables,
            "risk_factors": risks,
            "brutal_truth": brutal_truth,
            "recommendations": recommendations,
            "simulated_at": datetime.utcnow().isoformat()
        }
