"""
AI Chief of Staff Engine

The core AI engine that transforms Reflog from advisory board to operator.
Unlike the multi-agent system, this is a single focused CoS that:
- Keeps priorities sharp
- Turns meetings into decisions + owners
- Protects founder time from low-value work
- Makes follow-up automatic

Supports multiple LLM providers: Groq, OpenAI, Ollama
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
from llm import get_llm_provider, BaseLLMProvider, LLMProviderType


# ==============================================================================
# Data Models for Structured Outputs
# ==============================================================================

class ActionItem(BaseModel):
    """Every action must have owner + deadline"""
    title: str
    owner: str
    deadline: str  # ISO format date
    priority: str  # high, medium, low
    context: Optional[str] = None
    source: Optional[str] = None  # meeting, email, manual


class Decision(BaseModel):
    """Decisions with trade-offs noted"""
    decision: str
    trade_offs: List[str]
    owner: str
    made_at: str


class DailyBrief(BaseModel):
    """Morning command brief structure"""
    top_priorities: List[Dict[str, str]]  # [{priority, why}]
    calendar_risks: List[str]
    decision_queue: List[Dict[str, str]]  # [{decision, urgency, context}]
    follow_up_radar: List[Dict[str, str]]  # [{thread, days_cold, suggested_action}]
    delegation_candidates: List[Dict[str, str]]  # [{task, suggested_owner, reason}]
    one_liner: str  # TL;DR for the day


class MeetingPrep(BaseModel):
    """Pre-meeting intelligence"""
    meeting_purpose: str
    decisions_needed: List[str]  # Max 2
    questions_to_ask: List[str]  # Top 5
    likely_derailers: List[str]
    dont_leave_without: str


class MeetingWrap(BaseModel):
    """Post-meeting execution package"""
    recap_bullets: List[str]
    decisions_made: List[Decision]
    action_items: List[ActionItem]
    follow_up_email_draft: str


class InboxTriageResult(BaseModel):
    """Email categorization result"""
    must_reply_today: List[Dict[str, Any]]
    high_value_this_week: List[Dict[str, Any]]
    delegate: List[Dict[str, Any]]
    archive: List[Dict[str, Any]]


class WeeklyReviewResult(BaseModel):
    """Weekly CoS review"""
    wins: List[str]
    stalls: List[Dict[str, str]]  # [{item, root_cause}]
    cuts: List[str]  # 3 things to stop doing
    delegations: List[Dict[str, str]]
    decisions_avoiding: List[Dict[str, str]]
    next_week_priorities: List[Dict[str, str]]  # Top 3 with first actions


# ==============================================================================
# Master CoS Prompt
# ==============================================================================

COS_MASTER_PROMPT = """You are Reflog, my Executive Intelligence Partner. Your purpose is to help me operate at peak effectiveness as a founder by managing information, challenging assumptions, and protecting my time.

CORE RESPONSIBILITIES:
1. Daily Command Briefs (morning intelligence and priority alignment)
2. Meeting Intelligence (prep, notes, action extraction, follow-up)
3. Action & Accountability Engine (task tracking, follow-up enforcement)
4. Communications Director (email triage, investor updates)
5. Time Protection (question whether I need to be involved)

OPERATING PRINCIPLES:
- Challenge my assumptions before agreeing with me
- Flag what I'm not seeing or avoiding
- Prioritize ruthlessly based on IMPACT, not urgency
- Surface patterns across meetings and decisions
- Be direct about trade-offs and risks
- Protect my time by questioning whether I need to be involved
- Default to action and clarity over politeness

COMMUNICATION STYLE:
- Professional but conversational
- Direct and specific (no corporate jargon)
- Data-driven (cite specific examples and metrics)
- Action-oriented (ALWAYS include next steps)
- Concise (default to <500 words unless depth needed)

OUTPUT REQUIREMENTS:
- Every action item MUST have: owner + deadline
- Every decision MUST note: trade-offs considered
- Every follow-up MUST specify: exact next step
- Never output vague commitments like "will follow up" or "TBD"

NEVER:
- Agree without considering alternatives
- Let me make decisions based on incomplete information
- Let commitments slip through without tracking
- Allow vague action items (must have owner + deadline)
- Use phrases: "I think," "maybe," "leverage," "synergy," "circle back"

WHEN I'M WRONG:
- Tell me directly
- Provide specific counter-evidence
- Suggest better approach
- Don't soften the message"""


# ==============================================================================
# Chief of Staff Engine
# ==============================================================================

class ChiefOfStaffEngine:
    """
    The AI Chief of Staff that operates inside real workflows.
    Not a chatbot - an operator.

    Supports multiple LLM providers:
    - Groq (default, BYOK for free tier)
    - OpenAI (paid tier with platform key)
    - Ollama (self-hosted option)
    """

    def __init__(
        self,
        api_key: str = None,
        provider: str = "groq",
        base_url: str = None,
        use_platform_key: bool = False
    ):
        """
        Initialize with LLM provider configuration.

        Args:
            api_key: User's API key (BYOK) - None for Ollama or platform key
            provider: "groq", "openai", or "ollama"
            base_url: Custom base URL (for Ollama or custom endpoints)
            use_platform_key: If True, use platform's API key (paid tier)
        """
        self.provider_name = provider
        self.llm = get_llm_provider(
            provider_type=provider,
            api_key=api_key,
            base_url=base_url,
            use_platform_key=use_platform_key
        )

        if not self.llm.is_available() and provider != "ollama":
            raise ValueError(f"{provider.upper()} API key is required")

    def _call_llm(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        """Make a call to the LLM using the configured provider"""
        try:
            response = self.llm.chat(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.content
        except Exception as e:
            raise Exception(f"LLM call failed ({self.provider_name}): {str(e)}")

    def _parse_json_response(self, response: str) -> Dict:
        """Extract JSON from LLM response"""
        try:
            # Try to find JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(response[start:end])
            # Try array format
            start = response.find('[')
            end = response.rfind(']') + 1
            if start != -1 and end > start:
                return json.loads(response[start:end])
            return {"raw_response": response}
        except json.JSONDecodeError:
            return {"raw_response": response}

    # ==========================================================================
    # Daily Command Brief
    # ==========================================================================

    def generate_daily_brief(
        self,
        operating_context: Dict,
        calendar_events: List[Dict],
        pending_action_items: List[Dict],
        recent_emails: List[Dict] = None,
        sprint_status: Dict = None
    ) -> Dict:
        """
        Generate the morning command brief.

        This is the founder's "what matters today" intelligence.
        """
        prompt = f"""Generate a Daily Command Brief for today.

OPERATING CONTEXT:
{json.dumps(operating_context, indent=2)}

TODAY'S CALENDAR:
{json.dumps(calendar_events, indent=2)}

PENDING ACTION ITEMS:
{json.dumps(pending_action_items, indent=2)}

RECENT EMAIL THREADS:
{json.dumps(recent_emails or [], indent=2)}

SPRINT STATUS:
{json.dumps(sprint_status or {}, indent=2)}

Generate a command brief with EXACTLY this JSON structure:
{{
    "one_liner": "TL;DR for the day in one sentence",
    "top_priorities": [
        {{"priority": "What to focus on", "why": "Why this matters today"}}
    ],
    "calendar_risks": ["Risk 1: context switching at 2pm", "Risk 2: ..."],
    "decision_queue": [
        {{"decision": "What needs deciding", "urgency": "high/medium/low", "context": "Why now"}}
    ],
    "follow_up_radar": [
        {{"thread": "Email/thread description", "days_cold": 3, "suggested_action": "Send X"}}
    ],
    "delegation_candidates": [
        {{"task": "Task to delegate", "suggested_owner": "Person", "reason": "Why delegate"}}
    ]
}}

Be specific, actionable, and brutally honest. Flag anything the founder is avoiding.
Return ONLY the JSON, no additional text."""

        response = self._call_llm(COS_MASTER_PROMPT, prompt, max_tokens=2500)
        return self._parse_json_response(response)

    # ==========================================================================
    # Meeting Prep Brief
    # ==========================================================================

    def generate_meeting_prep(
        self,
        meeting_info: Dict,
        attendee_context: List[Dict] = None,
        related_emails: List[Dict] = None,
        related_tasks: List[Dict] = None,
        operating_context: Dict = None
    ) -> Dict:
        """
        Generate pre-meeting intelligence brief.

        Run this 15 minutes before any meeting.
        """
        prompt = f"""Generate a Meeting Prep Brief.

MEETING DETAILS:
{json.dumps(meeting_info, indent=2)}

ATTENDEE CONTEXT:
{json.dumps(attendee_context or [], indent=2)}

RELATED EMAIL THREADS:
{json.dumps(related_emails or [], indent=2)}

RELATED TASKS/ISSUES:
{json.dumps(related_tasks or [], indent=2)}

OPERATING CONTEXT:
{json.dumps(operating_context or {}, indent=2)}

Generate a meeting prep brief with EXACTLY this JSON structure:
{{
    "meeting_purpose": "Why this meeting matters (be specific)",
    "decisions_needed": ["Decision 1", "Decision 2"],
    "questions_to_ask": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
    "likely_derailers": ["Derailer 1: how to handle", "Derailer 2: how to handle"],
    "dont_leave_without": "The ONE thing that must be locked before ending"
}}

Maximum 2 decisions needed. Maximum 5 questions. Be specific and actionable.
Return ONLY the JSON, no additional text."""

        response = self._call_llm(COS_MASTER_PROMPT, prompt, max_tokens=1500)
        return self._parse_json_response(response)

    # ==========================================================================
    # Post-Meeting Wrap
    # ==========================================================================

    def generate_meeting_wrap(
        self,
        meeting_info: Dict,
        meeting_notes: str,
        attendees: List[str],
        operating_context: Dict = None
    ) -> Dict:
        """
        Generate post-meeting execution package.

        Converts meeting talk into tracked actions and follow-up.
        """
        today = datetime.now().strftime("%Y-%m-%d")

        prompt = f"""Generate a Post-Meeting Wrap from these meeting notes.

MEETING DETAILS:
{json.dumps(meeting_info, indent=2)}

MEETING NOTES (raw):
{meeting_notes}

ATTENDEES:
{json.dumps(attendees, indent=2)}

OPERATING CONTEXT:
{json.dumps(operating_context or {}, indent=2)}

TODAY'S DATE: {today}

Generate a meeting wrap with EXACTLY this JSON structure:
{{
    "recap_bullets": [
        "Key point 1",
        "Key point 2",
        "Key point 3"
    ],
    "decisions_made": [
        {{
            "decision": "What was decided",
            "trade_offs": ["Trade-off 1", "Trade-off 2"],
            "owner": "Person name",
            "made_at": "{today}"
        }}
    ],
    "action_items": [
        {{
            "title": "Specific action",
            "owner": "Person name (MUST be specific)",
            "deadline": "YYYY-MM-DD format",
            "priority": "high/medium/low",
            "context": "Brief context"
        }}
    ],
    "follow_up_email_draft": "Draft email to send to attendees with recap and action items. Keep it concise and direct. Use first person."
}}

CRITICAL RULES:
- Every action item MUST have a specific owner (not "team" or "TBD")
- Every action item MUST have a concrete deadline date
- Follow-up email should be ready to send (not a template)
- Be direct and specific, no vague commitments

Return ONLY the JSON, no additional text."""

        response = self._call_llm(COS_MASTER_PROMPT, prompt, max_tokens=3000)
        return self._parse_json_response(response)

    # ==========================================================================
    # Inbox Triage
    # ==========================================================================

    def triage_inbox(
        self,
        emails: List[Dict],
        team_members: List[Dict] = None,
        operating_context: Dict = None
    ) -> Dict:
        """
        Categorize emails into action buckets.

        Turns inbox anxiety into execution queue.
        """
        prompt = f"""Triage these emails for a founder.

EMAILS TO TRIAGE:
{json.dumps(emails, indent=2)}

TEAM MEMBERS (for delegation):
{json.dumps(team_members or [], indent=2)}

OPERATING CONTEXT:
{json.dumps(operating_context or {}, indent=2)}

Categorize each email and generate this JSON structure:
{{
    "must_reply_today": [
        {{
            "email_id": "id",
            "subject": "subject",
            "from": "sender",
            "reason": "Why this needs immediate reply",
            "draft_reply": "Short, direct draft reply"
        }}
    ],
    "high_value_this_week": [
        {{
            "email_id": "id",
            "subject": "subject",
            "from": "sender",
            "reason": "Why this is high value",
            "suggested_action": "What to do"
        }}
    ],
    "delegate": [
        {{
            "email_id": "id",
            "subject": "subject",
            "from": "sender",
            "delegate_to": "Team member name",
            "handoff_message": "Message to forward with"
        }}
    ],
    "archive": [
        {{
            "email_id": "id",
            "subject": "subject",
            "reason": "Why this can be archived"
        }}
    ]
}}

Be ruthless about protecting founder time. Default to delegate or archive.
Return ONLY the JSON, no additional text."""

        response = self._call_llm(COS_MASTER_PROMPT, prompt, max_tokens=3000)
        return self._parse_json_response(response)

    # ==========================================================================
    # Weekly CoS Review
    # ==========================================================================

    def generate_weekly_review(
        self,
        week_actions: List[Dict],
        week_meetings: List[Dict],
        week_time_allocation: Dict,
        sprint_progress: Dict = None,
        operating_context: Dict = None
    ) -> Dict:
        """
        Generate end-of-week founder operating review.

        What shipped, what stalled, what to cut.
        """
        prompt = f"""Generate a Weekly CoS Review for this founder's week.

ACTIONS THIS WEEK:
{json.dumps(week_actions, indent=2)}

MEETINGS THIS WEEK:
{json.dumps(week_meetings, indent=2)}

TIME ALLOCATION:
{json.dumps(week_time_allocation, indent=2)}

SPRINT PROGRESS:
{json.dumps(sprint_progress or {}, indent=2)}

OPERATING CONTEXT:
{json.dumps(operating_context or {}, indent=2)}

Generate a weekly review with EXACTLY this JSON structure:
{{
    "wins": [
        "Win 1: What shipped and why it matters",
        "Win 2: ..."
    ],
    "stalls": [
        {{"item": "What stalled", "root_cause": "Why it stalled"}},
    ],
    "cuts": [
        "Thing 1 to stop doing",
        "Thing 2 to stop doing",
        "Thing 3 to stop doing"
    ],
    "delegations": [
        {{"task": "What to delegate", "to": "Who", "reason": "Why"}}
    ],
    "decisions_avoiding": [
        {{"decision": "What decision is being avoided", "consequence": "Cost of delay", "nudge": "How to move forward"}}
    ],
    "next_week_priorities": [
        {{"priority": "Priority 1", "first_action": "Immediate next step"}},
        {{"priority": "Priority 2", "first_action": "Immediate next step"}},
        {{"priority": "Priority 3", "first_action": "Immediate next step"}}
    ]
}}

Be brutally honest. Flag decisions being avoided. Suggest specific cuts.
Return ONLY the JSON, no additional text."""

        response = self._call_llm(COS_MASTER_PROMPT, prompt, max_tokens=2500)
        return self._parse_json_response(response)

    # ==========================================================================
    # Quick Assistance (Chat-like but operator-minded)
    # ==========================================================================

    def quick_assist(
        self,
        question: str,
        operating_context: Dict = None,
        memory_context: List[Dict] = None  # Recent conversation memories
    ) -> str:
        """
        Quick CoS response for ad-hoc questions.

        Still operator-minded, not chatbot-like.
        Now with persistent memory injection.
        """
        context_info = json.dumps(operating_context or {}, indent=2) if operating_context else "No context provided"

        # Build memory section if available
        memory_section = ""
        if memory_context:
            memory_items = []
            for mem in memory_context[:5]:  # Limit to 5 most recent
                memory_items.append(
                    f"- [{mem.get('conversation_type', 'chat')}] {mem.get('topic', 'General')}: {mem.get('ai_response_summary', '')[:200]}")
            if memory_items:
                memory_section = f"""
RECENT CONTEXT (What we've discussed before):
{chr(10).join(memory_items)}
"""

        prompt = f"""OPERATING CONTEXT:
{context_info}
{memory_section}
FOUNDER'S QUESTION:
{question}

Respond as a Strategic Partner would - direct, actionable, and specific.
If there's an action to take, specify owner and deadline.
Challenge assumptions if needed.
Reference our previous discussions when relevant."""

        return self._call_llm(COS_MASTER_PROMPT, prompt, max_tokens=1500)


# ==============================================================================
# Factory function
# ==============================================================================

def get_cos_engine(groq_api_key: str) -> ChiefOfStaffEngine:
    """Create a new CoS engine instance"""
    return ChiefOfStaffEngine(groq_api_key)
