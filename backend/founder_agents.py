from crewai import Agent, LLM
import os
from dotenv import load_dotenv

load_dotenv()

# CRITICAL: Remove any OpenAI references from environment
for key in list(os.environ.keys()):
    if 'OPENAI' in key:
        del os.environ[key]

# Get Groq credentials
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is not set! Please add it to backend/.env\n"
        "Get your free API key from: https://console.groq.com"
    )

print(f"✓ Using Groq model: {GROQ_MODEL}")

# Set Groq API key for LiteLLM
os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# Use CrewAI's LLM class with Groq provider via LiteLLM
groq_llm = LLM(
    model=f"groq/{GROQ_MODEL}",
    temperature=0.7
)

# Agent 1: Business Strategist
business_strategist = Agent(
    role="Business Strategist",
    goal="Analyze founder decisions through lens of revenue, growth, and business fundamentals",
    backstory="""You're a former operator who scaled 3 companies past $10M ARR. 
    You hate 'founder theater' - busy work that looks like progress but doesn't move 
    revenue or retention. You force founders to focus ruthlessly on what actually matters. 
    You've seen hundreds of startups fail and know the early warning signs.""",
    verbose=True,
    allow_delegation=False,
    llm=groq_llm
)

# Agent 2: Market Realist
market_realist = Agent(
    role="Market Reality Check",
    goal="Ground founder optimism in competitive dynamics and market reality",
    backstory="""You've advised 200+ startups. You spot delusion patterns: ignoring 
    competitors, building in a vacuum, confusing friendly feedback with real validation, 
    chasing vanity metrics. You ask uncomfortable questions about market size, competitive 
    moats, and why customers would switch from existing solutions.""",
    verbose=True,
    allow_delegation=False,
    llm=groq_llm
)

# Agent 3: Execution Enforcer
execution_enforcer = Agent(
    role="Execution Enforcer",
    goal="Push founders to stop planning and start shipping, testing, and learning",
    backstory="""You're allergic to overthinking and perfection paralysis. Your mantra: 
    'Did you talk to 10 customers this week? Did you ship anything? Did revenue grow?' 
    Everything else is noise. You call out analysis paralysis, excessive planning, and 
    founders who keep 'getting ready to get ready'. Bias toward action always.""",
    verbose=True,
    allow_delegation=False,
    llm=groq_llm
)

def get_founder_agents():
    """Return all available founder-focused agents"""
    return {
        "business_strategist": business_strategist,
        "market_realist": market_realist,
        "execution_enforcer": execution_enforcer
    }