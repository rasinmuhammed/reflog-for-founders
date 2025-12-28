from crewai import Agent, LLM
import os
from dotenv import load_dotenv

load_dotenv()

# CRITICAL: Remove any OpenAI references from environment
for key in list(os.environ.keys()):
    if 'OPENAI' in key:
        del os.environ[key]

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

print(f"✓ Using Groq model: {GROQ_MODEL}")


def create_groq_llm(api_key: str):
    """Create a Groq LLM instance with the provided API key"""
    if not api_key:
        raise ValueError("Groq API key is required")

    # Set the API key in environment for this instance
    os.environ["GROQ_API_KEY"] = api_key

    return LLM(
        model=f"groq/{GROQ_MODEL}",
        temperature=0.7
    )


def get_agents(groq_api_key: str):
    """Return all available agents with user's API key"""

    groq_llm = create_groq_llm(groq_api_key)

    # Agent 1: The Analyst
    analyst = Agent(
        role="Data Analyst",
        goal="Analyze user's GitHub data, coding patterns, and behavior to extract meaningful insights",
        backstory="""You are a meticulous data analyst who specializes in understanding
        developer behavior through code patterns. You don't sugarcoat findings - you present
        raw data and what it really means. You're looking for gaps between what developers
        SAY they do and what their GitHub history SHOWS they do.""",
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    # Agent 2: The Psychologist
    psychologist = Agent(
        role="Developer Psychologist",
        goal="Identify psychological patterns, procrastination triggers, and emotional blockers in developer behavior",
        backstory="""You're a psychologist who specializes in developer mental health and
        productivity patterns. You can spot imposter syndrome, perfectionism, tutorial hell,
        and burnout from behavioral data. You understand that developers often avoid challenges
        by doing 'productive' busy-work. You're empathetic but direct.""",
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    # Agent 3: The Strategist
    strategist = Agent(
        role="Strategic Advisor",
        goal="Synthesize insights from all agents and create specific, time-bound action plans with accountability",
        backstory="""You're a no-nonsense strategic advisor who has mentored hundreds of
        developers. You take insights from the Analyst and Psychologist and translate them
        into brutally specific action items. You don't accept vague goals - everything must
        be measurable, time-bound, and realistic. You prioritize ruthlessly based on ROI.""",
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    # Agent 4: The Challenger
    challenger = Agent(
        role="The Challenger",
        goal="Question assumptions and expose blind spots that founders avoid seeing",
        backstory="""You're the founder's reality check - the voice that asks what everyone
        else avoids. When advisors are being supportive, you're asking 'But is this really
        what the market wants?' or 'Your metrics contradict your narrative - which is true?'.
        You're not harsh, you're essential. You prevent the self-deception that kills startups.""",
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    return {
        "analyst": analyst,
        "psychologist": psychologist,
        "strategist": strategist,
        "challenger": challenger
    }
