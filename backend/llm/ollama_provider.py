"""
Ollama LLM Provider

Local LLM inference using Ollama.
For privacy-conscious users who want to run models locally.
"""

from typing import Optional, Dict
import httpx
from .base import BaseLLMProvider, LLMResponse


class OllamaProvider(BaseLLMProvider):
    """
    Ollama LLM Provider - local inference.

    Popular models: llama3.2, mistral, codellama, phi
    """

    provider_name = "ollama"

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        # Ollama doesn't need API key, uses base_url for server location
        self.base_url = base_url or "http://localhost:11434"
        self._available = None

    def get_default_model(self) -> str:
        return "llama3.2"

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> LLMResponse:
        model = model or self.get_default_model()

        # Ollama uses /api/chat endpoint
        url = f"{self.base_url}/api/chat"

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        try:
            response = httpx.post(url, json=payload, timeout=120.0)
            response.raise_for_status()
            data = response.json()

            return LLMResponse(
                content=data.get("message", {}).get("content", ""),
                model=model,
                provider=self.provider_name,
                usage={
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                    "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
                }
            )
        except httpx.HTTPError as e:
            raise ValueError(f"Ollama request failed: {str(e)}")

    def is_available(self) -> bool:
        if self._available is not None:
            return self._available

        try:
            response = httpx.get(f"{self.base_url}/api/tags", timeout=5.0)
            self._available = response.status_code == 200
        except BaseException:
            self._available = False

        return self._available
