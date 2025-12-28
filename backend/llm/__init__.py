"""
LLM Provider Factory

Central factory for getting the appropriate LLM provider based on:
- Environment configuration (platform default)
- User preferences (BYOK, provider choice)
- Tier (free = BYOK, paid = platform key)
"""

import os
from typing import Optional
from enum import Enum

from .base import BaseLLMProvider, LLMResponse
from .groq_provider import GroqProvider
from .openai_provider import OpenAIProvider
from .ollama_provider import OllamaProvider


class LLMProviderType(str, Enum):
    GROQ = "groq"
    OPENAI = "openai"
    OLLAMA = "ollama"


# Platform API keys (for paid tier)
PLATFORM_OPENAI_KEY = os.getenv("PLATFORM_OPENAI_API_KEY")
PLATFORM_GROQ_KEY = os.getenv("PLATFORM_GROQ_API_KEY")

# Default provider for platform (used when user doesn't have BYOK)
DEFAULT_PLATFORM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "openai")


def get_llm_provider(
    provider_type: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    use_platform_key: bool = False
) -> BaseLLMProvider:
    """
    Factory function to get an LLM provider.

    Args:
        provider_type: "groq", "openai", or "ollama"
        api_key: User's API key (BYOK)
        base_url: Custom base URL (for Ollama or custom endpoints)
        use_platform_key: If True, use platform's API key (for paid tier)

    Returns:
        Configured LLM provider instance
    """
    # Determine provider type
    provider = provider_type or DEFAULT_PLATFORM_PROVIDER

    # Handle platform key usage (paid tier)
    if use_platform_key:
        if provider == LLMProviderType.OPENAI:
            api_key = PLATFORM_OPENAI_KEY
        elif provider == LLMProviderType.GROQ:
            api_key = PLATFORM_GROQ_KEY

    # Create appropriate provider
    if provider == LLMProviderType.GROQ:
        return GroqProvider(api_key=api_key)
    elif provider == LLMProviderType.OPENAI:
        return OpenAIProvider(api_key=api_key, base_url=base_url)
    elif provider == LLMProviderType.OLLAMA:
        return OllamaProvider(base_url=base_url)
    else:
        # Default to Groq for BYOK compatibility
        return GroqProvider(api_key=api_key)


def get_available_providers() -> dict:
    """
    Check which providers are available/configured.

    Returns:
        Dict with provider availability status
    """
    return {
        "groq": {
            "available": bool(PLATFORM_GROQ_KEY),
            "byok_supported": True,
            "description": "Fast inference with Groq LPU"
        },
        "openai": {
            "available": bool(PLATFORM_OPENAI_KEY),
            "byok_supported": True,
            "description": "OpenAI GPT models"
        },
        "ollama": {
            "available": OllamaProvider().is_available(),
            "byok_supported": False,
            "description": "Local inference with Ollama"
        }
    }


# Export main classes
__all__ = [
    "BaseLLMProvider",
    "LLMResponse",
    "LLMProviderType",
    "GroqProvider",
    "OpenAIProvider",
    "OllamaProvider",
    "get_llm_provider",
    "get_available_providers"
]
