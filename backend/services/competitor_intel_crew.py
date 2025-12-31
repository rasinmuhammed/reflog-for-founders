"""
Competitor Intelligence Crew

Multi-agent system for strategic market intelligence using ethical public data sources.
Integrates with existing BoardOfDirectors architecture.
"""

from crewai import Agent, Task, Crew, Process
from board_of_directors import BoardOfDirectors
from datetime import datetime
from typing import Dict, Optional, List


class CompetitorIntelligenceCrew:
    """
    Specialized crew for competitive intelligence gathering and analysis.
    
    Architecture:
    - Scout Agent: OSINT specialist for public data gathering
    - Analyst Agent: Change detection and pattern recognition
    - Strategist (existing): Strategic synthesis and recommendations
    """
    
    def __init__(self, groq_api_key: str):
        """Initialize with user's Groq API key and existing Board"""
        if not groq_api_key:
            raise ValueError("Groq API key is required")
        
        # Use existing Board of Directors for strategic agents
        self.board = BoardOfDirectors(groq_api_key, "business")
        self.llm = self.board.llm
        
        # Create specialized intelligence agents
        self.scout = self._create_scout()
        self.analyst = self._create_analyst()
    
    def _create_scout(self) -> Agent:
        """Create OSINT Scout agent for public data gathering"""
        return Agent(
            role="Competitive Intelligence Scout",
            goal="Find relevant public data about competitors using only ethical sources",
            backstory="""You specialize in OSINT (Open Source Intelligence) for startups.
            You know where to find public information: Product Hunt launches, Hacker News
            discussions, official blog posts, pricing pages, Twitter announcements.
            
            You NEVER:
            - Violate Terms of Service
            - Access private or proprietary data
            - Scrape protected content
            - Use unethical methods
            
            You ARE systematic and thorough, citing all sources with URLs.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def _create_analyst(self) -> Agent:
        """Create Analyst agent for change detection"""
        return Agent(
            role="Competitive Change Analyst",
            goal="Identify meaningful changes in competitor behavior and strategy",
            backstory="""You've tracked hundreds of startups and know what signals matter.
            
            You spot patterns that indicate:
            - Pricing changes (often precede funding rounds or desperation)
            - Feature announcements (signal product direction shifts)
            - Team changes (new hires, departures via LinkedIn/Twitter)
            - Messaging shifts (repositioning, market pivots)
            - Engagement drops (losing momentum, churning users)
            
            You separate noise from signal. When competitors post "we're growing fast!"
            but their engagement is down 40%, you notice. You flag what actually matters.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def research_competitor(
        self,
        competitor: Dict,
        previous_intel: Optional[str] = None
    ) -> Dict:
        """
        Run full intelligence gathering and analysis cycle.
        
        Args:
            competitor: Dict with name, website, and optional tracking sources
            previous_intel: Previous intelligence brief for comparison
            
        Returns:
            Dict with competitive_brief, threat_level, recommended_actions
        """
        
        # Task 1: Scout gathers public data
        scout_task = Task(
            description=f"""Research this competitor using ONLY public sources:

Competitor: {competitor["name"]}
Website: {competitor["website"]}
Product Hunt: {competitor.get("product_hunt_url", "Not provided")}
Twitter: @{competitor.get("twitter_handle", "Not provided")}
Blog RSS: {competitor.get("blog_rss", "Not provided")}

Find and report:
1. Recent Product Hunt launches, updates, or comments
2. Latest blog posts or announcements (last 30 days)
3. Recent tweets about product updates, pricing, or team changes
4. Any publicly visible pricing changes (check Wayback Machine if needed)
5. Team announcements (new hires, departures, role changes)
6. User sentiment from Hacker News or Reddit discussions

Be systematic. Cite sources with URLs. No speculation - only facts you can verify.
If a source isn't available, say so explicitly.

Format your findings as:
## Source: [Name]
- Finding 1 (URL)
- Finding 2 (URL)
etc.
            """,
            agent=self.scout,
            expected_output="Structured research findings with verified sources and URLs"
        )
        
        # Task 2: Analyst detects meaningful changes
        analyst_task = Task(
            description=f"""Analyze the Scout's findings for meaningful changes:

Previous Intelligence Brief:
{previous_intel if previous_intel else "This is the first time tracking this competitor."}

Your job:
1. What changed since last check? Be specific:
   - Pricing: Any changes in pricing tiers, costs, or pricing page messaging?
   - Features: New features announced or deprecated? 
   - Messaging: How do they describe themselves now vs before?
   - Team: New hires, departures, or role changes?
   - Traction: Signs of growth or decline in engagement?

2. What does each change signal?
   - Growth indicator? (scaling team, raising prices, expanding features)
   - Struggle indicator? (price cuts, layoffs, pivoting messaging)
   - Strategic shift? (new market, new positioning, new target customer)

3. Threat level assessment:
   - CRITICAL: They just launched a feature that directly competes with our core value prop
   - HIGH: Significant competitive move that could impact our growth
   - MEDIUM: Notable change worth monitoring
   - LOW: Interesting but not immediately threatening

4. Competitive opportunities:
   - What gaps did they leave open that we could exploit?
   - What mistakes did they make that we should avoid?
   - What can we learn from their wins?

5. Red flags or early warnings:
   - Are they showing signs of trouble we should know about?
   - Are they preparing for a major announcement?

Focus on ACTIONABLE intelligence, not just interesting news.
            """,
            agent=self.analyst,
            expected_output="Change analysis with threat assessment and competitive opportunities",
            context=[scout_task]
        )
        
        # Task 3: Strategist synthesizes (using existing Board agent)
        strategist = self.board.get_agent("strategist")
        synthesis_task = Task(
            description=f"""Create a strategic competitive brief for the founder:

Competitor: {competitor["name"]}
Category: {competitor.get("category", "Unknown")}

Based on the Scout's research and Analyst's change detection, synthesize this into
a brief that a busy founder can read in 2 minutes and act on.

Your brief must include:

1. **TL;DR** (2-3 sentences):
   - What's happening with this competitor?
   - Why should the founder care (or not care)?

2. **Key Changes** (bullet points):
   - Most important changes detected
   - What each change means strategically

3. **Threat Assessment**:
   - Overall threat level: Low/Medium/High/Critical
   - Specific areas where they're gaining ground (if any)
   - Areas where they're showing weakness (if any)

4. **Recommended Actions** (2-3 specific items):
   - What should the founder do THIS WEEK?
   - What should they monitor over the NEXT MONTH?
   - What can be ignored/deprioritized?

5. **Timeline**:
   - Urgent (do today): [if applicable]
   - This week: [specific actions]
   - This month: [broader strategic moves]

Be direct. If this competitor isn't a threat, say so explicitly - don't manufacture drama.
If it IS urgent, make that crystal clear and say why.

Remember: The founder has limited time and attention. Only flag what actually matters.
            """,
            agent=strategist,
            expected_output="Strategic brief with clear TL;DR, threat assessment, and time-bound actions",
            context=[scout_task, analyst_task]
        )
        
        # Execute crew
        crew = Crew(
            agents=[self.scout, self.analyst, strategist],
            tasks=[scout_task, analyst_task, synthesis_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        result_str = str(result)
        
        return {
            "competitive_brief": result_str,
            "threat_level": self._extract_threat_level(result_str),
            "recommended_actions": self._extract_actions(result_str),
            "timestamp": datetime.now().isoformat()
        }
    
    def _extract_threat_level(self, text: str) -> str:
        """Extract threat level from brief text"""
        text_lower = text.lower()
        
        # Look for explicit threat level mentions
        if "threat level: critical" in text_lower or "critical threat" in text_lower:
            return "critical"
        elif "threat level: high" in text_lower or "high threat" in text_lower:
            return "high"
        elif "threat level: medium" in text_lower or "medium threat" in text_lower or "moderate threat" in text_lower:
            return "medium"
        elif "threat level: low" in text_lower or "low threat" in text_lower or "not a threat" in text_lower:
            return "low"
        
        # Fallback heuristics
        if "urgent" in text_lower or "immediate" in text_lower:
            return "high"
        elif "monitor" in text_lower or "watch" in text_lower:
            return "medium"
        else:
            return "low"
    
    def _extract_actions(self, text: str) -> List[str]:
        """Extract action items from brief"""
        actions = []
        lines = text.split('\n')
        
        in_actions_section = False
        for line in lines:
            line_lower = line.lower()
            
            # Detect actions section
            if "recommended action" in line_lower or "this week:" in line_lower or "urgent:" in line_lower:
                in_actions_section = True
                continue
            
            # Stop at next major section
            if in_actions_section and any(section in line_lower for section in ["timeline:", "conclusion:", "summary:"]):
                in_actions_section = False
            
            # Extract actions
            if in_actions_section:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line.startswith('*')):
                    action = line.lstrip('-•* ').strip()
                    if action and len(action) > 10:  # Filter out noise
                        actions.append(action)
            
            # Also catch explicit action keywords
            if any(keyword in line_lower for keyword in ['action:', 'should:', 'must:', 'recommend:']):
                action = line.split(':', 1)[-1].strip()
                if action and len(action) > 10:
                    actions.append(action)
        
        return actions[:5]  # Return top 5 actions max
