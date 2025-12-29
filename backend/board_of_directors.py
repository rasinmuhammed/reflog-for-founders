"""
Board of Directors - Unified AI Advisory System

This module provides a dynamic "board of advisors" that adapts based on
the founder's profile and needs. It merges the functionality from agents.py
and founder_agents.py into a single, cohesive architecture.
"""
from crewai import Agent, LLM
import os
from typing import Dict, Optional, Literal
from dotenv import load_dotenv

load_dotenv()

# Remove any OpenAI references from environment
for key in list(os.environ.keys()):
    if 'OPENAI' in key:
        del os.environ[key]

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

print(f"Board of Directors initialized with model: {GROQ_MODEL}")


def create_groq_llm(api_key: str) -> LLM:
    """Create a Groq LLM instance with the provided API key"""
    if not api_key:
        raise ValueError("Groq API key is required for Board of Directors")

    os.environ["GROQ_API_KEY"] = api_key

    return LLM(
        model=f"groq/{GROQ_MODEL}",
        temperature=0.7
    )


FounderType = Literal["business", "technical", "sales", "product"]


class BoardOfDirectors:
    """
    Dynamic advisory board that adapts to founder type.
    
    The board always includes core advisors (Strategist, Market Realist,
    Execution Enforcer, Challenger) and adds specialized advisors based
    on the founder's background and needs.
    """

    def __init__(
        self,
        groq_api_key: str,
        founder_type: FounderType = "business"
    ):
        self.llm = create_groq_llm(groq_api_key)
        self.founder_type = founder_type
        self._agents: Dict[str, Agent] = {}
        self._build_board()

    def _build_board(self) -> None:
        """Build the dynamic board based on founder type"""
        # Core advisors - always present
        self._agents["strategist"] = self._create_strategist()
        self._agents["market_realist"] = self._create_market_realist()
        self._agents["execution_enforcer"] = self._create_execution_enforcer()
        self._agents["challenger"] = self._create_challenger()

        # Add specialized advisors based on founder type
        if self.founder_type == "technical":
            self._agents["cto"] = self._create_cto_agent()
        elif self.founder_type == "sales":
            self._agents["sales_advisor"] = self._create_sales_agent()
        elif self.founder_type == "product":
            self._agents["product_advisor"] = self._create_product_agent()

    def _create_strategist(self) -> Agent:
        """Business Strategist - Revenue and growth focus"""
        return Agent(
            role="Business Strategist",
            goal="Analyze founder decisions through lens of revenue, growth, and business fundamentals",
            backstory="""You're a former operator who scaled 3 companies past $10M ARR.
            You hate 'founder theater' - busy work that looks like progress but doesn't move
            revenue or retention. You force founders to focus ruthlessly on what actually matters.
            You've seen hundreds of startups fail and know the early warning signs.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def _create_market_realist(self) -> Agent:
        """Market Realist - Competitive reality check"""
        return Agent(
            role="Market Reality Check",
            goal="Ground founder optimism in competitive dynamics and market reality",
            backstory="""You've advised 200+ startups. You spot delusion patterns: ignoring
            competitors, building in a vacuum, confusing friendly feedback with real validation,
            chasing vanity metrics. You ask uncomfortable questions about market size, competitive
            moats, and why customers would switch from existing solutions.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def _create_execution_enforcer(self) -> Agent:
        """Execution Enforcer - Ship over plan"""
        return Agent(
            role="Execution Enforcer",
            goal="Push founders to stop planning and start shipping, testing, and learning",
            backstory="""You're allergic to overthinking and perfection paralysis. Your mantra:
            'Did you talk to 10 customers this week? Did you ship anything? Did revenue grow?'
            Everything else is noise. You call out analysis paralysis, excessive planning, and
            founders who keep 'getting ready to get ready'. Bias toward action always.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def _create_challenger(self) -> Agent:
        """The Challenger - Question assumptions"""
        return Agent(
            role="The Challenger",
            goal="Question assumptions and expose blind spots that founders avoid seeing",
            backstory="""You're the founder's reality check - the voice that asks what everyone
            else avoids. When advisors are being supportive, you're asking 'But is this really
            what the market wants?' or 'Your metrics contradict your narrative - which is true?'.
            You're not harsh, you're essential. You prevent the self-deception that kills startups.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def _create_cto_agent(self) -> Agent:
        """CTO Agent - Technical architecture focus (for technical founders)"""
        return Agent(
            role="CTO Advisor",
            goal="Evaluate technical decisions through the lens of scalability, tech debt, and team velocity",
            backstory="""You've been CTO at 3 startups. You know when to build vs buy, when
            to pay down tech debt vs ship features, and how to structure teams for velocity.
            You push back on over-engineering and gold-plating. You ask: 'Will this scale to
            10x users? Is this the simplest solution that works? Are we optimizing prematurely?'""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def _create_sales_agent(self) -> Agent:
        """Sales Advisor - Pipeline and conversion focus (for sales-focused founders)"""
        return Agent(
            role="Sales Advisor",
            goal="Optimize sales process, pipeline management, and conversion metrics",
            backstory="""You've built sales teams from 0 to $50M ARR. You know pipeline math
            cold: lead velocity, conversion rates, sales cycle length, CAC payback. You push
            founders to get on more calls, ask for the sale, and stop hiding behind 'brand building'.
            Revenue is oxygen - everything else is vanity.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def _create_product_agent(self) -> Agent:
        """Product Advisor - User experience and product-market fit focus"""
        return Agent(
            role="Product Advisor",
            goal="Ensure product decisions are driven by user needs and path to product-market fit",
            backstory="""You've shipped products at companies from startups to FAANG.
            You obsess over user research, feature prioritization, and measuring what matters.
            You push back on feature bloat and 'wouldn't it be cool if' thinking. Every feature
            must tie to retention, activation, or revenue. No vanity features.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def get_agents(self) -> Dict[str, Agent]:
        """Return all active board members"""
        return self._agents

    def get_agent(self, role: str) -> Optional[Agent]:
        """Get a specific board member by role"""
        return self._agents.get(role)

    def list_board_members(self) -> list:
        """List all active board member roles"""
        return list(self._agents.keys())

    def add_specialist(self, role: str, agent: Agent) -> None:
        """Dynamically add a specialist to the board"""
        self._agents[role] = agent

    def remove_member(self, role: str) -> bool:
        """Remove a board member (except core members)"""
        core_members = ["strategist", "market_realist", "execution_enforcer", "challenger"]
        if role in core_members:
            return False  # Can't remove core members
        if role in self._agents:
            del self._agents[role]
            return True
        return False


# Backwards compatibility with old get_founder_agents function
def get_founder_agents(groq_api_key: str, founder_type: str = "business") -> Dict[str, Agent]:
    """
    Legacy function for backwards compatibility.
    Returns agents dict from BoardOfDirectors.
    """
    board = BoardOfDirectors(groq_api_key, founder_type)
    return board.get_agents()


# Backwards compatibility with old get_agents function
def get_agents(groq_api_key: str) -> Dict[str, Agent]:
    """
    Legacy function for backwards compatibility with agents.py.
    Returns agents dict from BoardOfDirectors with default founder type.
    """
    board = BoardOfDirectors(groq_api_key, "business")
    return board.get_agents()
