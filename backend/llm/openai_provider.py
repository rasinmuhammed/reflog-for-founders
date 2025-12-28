"""
OpenAI LLM Provider

Standard OpenAI API integration.
Used for paid tier with platform-provided key.
"""

from typing import Optional, Dict
from openai import OpenAI
from .base import BaseLLMProvider, LLMResponse


class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI LLM Provider.

    Models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
    """

    provider_name = "openai"

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key
        self.client = None
        if api_key:
            self.client = OpenAI(api_key=api_key, base_url=base_url)

    def get_default_model(self) -> str:
        return "gpt-4o-mini"  # Cost-effective default

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> LLMResponse:
        if not self.client:
            raise ValueError("OpenAI client not initialized. API key required.")

        model = model or self.get_default_model()

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=model,
            provider=self.provider_name,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            } if response.usage else None
        )

    def is_available(self) -> bool:
        return self.client is not None and self.api_key is not None
