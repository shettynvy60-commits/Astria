import json
import logging
import re
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None
from ai_module.config import settings

logger = logging.getLogger("gemini_client")

class GeminiClient:
    def __init__(self):
        self._client: Optional[Any] = None
        if settings.is_gemini_configured and genai is not None:
            try:
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini Client successfully initialized with provided API key.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}")
                self._client = None
        else:
            logger.info("No valid GEMINI_API_KEY configured or genai library unavailable. Running in Mock/Offline mode.")

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def generate_json(self, prompt: str, system_instruction: str = None, temperature: float = 0.3) -> Dict[str, Any]:
        """
        Invokes Gemini API and returns parsed JSON.
        Raises RuntimeError if client is unavailable or generation fails.
        """
        if not self.is_available:
            raise RuntimeError("Gemini Client is not configured. Please supply GEMINI_API_KEY.")

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=temperature,
            system_instruction=system_instruction
        )

        try:
            response = self._client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config
            )
            raw_text = response.text or ""
            return self._parse_json(raw_text)
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}", exc_info=True)
            raise RuntimeError(f"Gemini generation error: {str(e)}")

    def _parse_json(self, text: str) -> Dict[str, Any]:
        """
        Cleans markdown wrappers and safely parses JSON.
        """
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # Fallback regex extraction of outer JSON object
            match = re.search(r"(\{.*\})", clean_text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            raise ValueError(f"Could not parse valid JSON from model response: {text[:200]}...")

gemini_client = GeminiClient()
