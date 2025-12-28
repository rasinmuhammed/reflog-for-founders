"""
LLM Provider Base Class

Abstract interface for all LLM providers.
Supports: Groq, OpenAI, Ollama
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class LLMResponse(BaseModel):
    """Standard response from any LLM provider"""
    content: str
    model: str
    provider: str
    usage: Optional[Dict[str, int]] = None


class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    All providers must implement these methods.
    """

    provider_name: str = "base"

    @abstractmethod
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """Initialize the provider with optional API key and base URL."""
        pass

    @abstractmethod
    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Send a chat completion request.

        Args:
            system_prompt: The system/instruction prompt
            user_prompt: The user's message
            model: Optional model override
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature

        Returns:
            LLMResponse with the completion
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is properly configured and available."""
        pass

    def get_default_model(self) -> str:
        """Get the default model for this provider."""
        return "default"
