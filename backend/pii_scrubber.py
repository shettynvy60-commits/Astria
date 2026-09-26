"""
Astria Local PII Scrubber
Uses Microsoft Presidio & spaCy to strip and pseudonymize names, emails,
phone numbers, and other sensitive personal identifiers locally with zero cloud leakage.
"""

from __future__ import annotations
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

logger = logging.getLogger("astria.pii_scrubber")

# Optional / Graceful Presidio Imports
_PRESIDIO_AVAILABLE = False
try:
    from presidio_analyzer import AnalyzerEngine, RecognizerResult, PatternRecognizer, Pattern
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
    _PRESIDIO_AVAILABLE = True
except ImportError:
    logger.warning("Microsoft Presidio not found. Falling back to high-fidelity regex scrubber.")


class DetectedEntity(BaseModel):
    """Represents a single detected and scrubbed PII span."""
    entity_type: str = Field(..., description="Type of entity: PERSON, EMAIL_ADDRESS, PHONE_NUMBER, etc.")
    original_value: str = Field(..., description="Original raw text detected")
    placeholder: str = Field(..., description="Replacement placeholder tag (e.g., <PERSON_1>)")
    start: int = Field(..., description="Starting character index in original text")
    end: int = Field(..., description="Ending character index in original text")
    confidence: float = Field(default=0.85, description="Confidence score between 0.0 and 1.0")


class PIIScrubResult(BaseModel):
    """Result payload returned by the PII scrubber."""
    original_text: str
    sanitized_text: str
    detected_entities: List[DetectedEntity]
    entity_counts: Dict[str, int]
    mapping: Dict[str, str] = Field(
        default_factory=dict,
        description="Lookup map of placeholder to original value for local UI restoration"
    )
    is_presidio_powered: bool = True


class PIIScrubber:
    """
    Local PII Scrubber using Microsoft Presidio and spaCy with regex fallback.
    Guarantees that sensitive data (names, emails, phones, social links) is never transmitted.
    """

    SUPPORTED_ENTITIES = [
        "PERSON",
        "EMAIL_ADDRESS",
        "PHONE_NUMBER",
        "LOCATION",
        "URL",
        "IP_ADDRESS",
        "US_SSN",
    ]

    def __init__(self, use_spacy: bool = True):
        self.use_spacy = use_spacy
        self.analyzer: Optional[Any] = None
        self.anonymizer: Optional[Any] = None
        self._init_presidio()

    def _init_presidio(self) -> None:
        """Initializes Presidio Analyzer & Anonymizer with custom recognizers."""
        if not _PRESIDIO_AVAILABLE:
            return

        try:
            self.analyzer = AnalyzerEngine()
            self.anonymizer = AnonymizerEngine()
            self._add_custom_recognizers()
            logger.info("Presidio Analyzer & Anonymizer successfully initialized.")
        except Exception as exc:
            logger.warning(
                f"Failed to initialize Presidio with default NLP engine: {exc}. "
                "Ensure spaCy model 'en_core_web_sm' is downloaded (`python -m spacy download en_core_web_sm`). "
                "Activating regex-based local scrubber fallback."
            )
            self.analyzer = None
            self.anonymizer = None

    def _add_custom_recognizers(self) -> None:
        """Adds custom recognizers for developer profiles like GitHub, LinkedIn, portfolios."""
        if not self.analyzer:
            return

        # LinkedIn Profile Recognizer
        linkedin_pattern = Pattern(
            name="linkedin_pattern",
            regex=r"(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+",
            score=0.95
        )
        linkedin_recognizer = PatternRecognizer(
            supported_entity="LINKEDIN_PROFILE",
            patterns=[linkedin_pattern]
        )
        self.analyzer.registry.add_recognizer(linkedin_recognizer)

        # GitHub Profile Recognizer
        github_pattern = Pattern(
            name="github_pattern",
            regex=r"(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?",
            score=0.9
        )
        github_recognizer = PatternRecognizer(
            supported_entity="GITHUB_PROFILE",
            patterns=[github_pattern]
        )
        self.analyzer.registry.add_recognizer(github_recognizer)

    def scrub(self, text: str, mode: str = "pseudonymize") -> PIIScrubResult:
        """
        Scrubs PII from the provided text.
        
        Args:
            text: Raw document text (from resume or job description).
            mode: 'pseudonymize' (e.g. <PERSON_1>) or 'redact' (e.g. [REDACTED]).
            
        Returns:
            PIIScrubResult with sanitized text and metadata.
        """
        if not text or not text.strip():
            return PIIScrubResult(
                original_text=text or "",
                sanitized_text="",
                detected_entities=[],
                entity_counts={},
                mapping={},
                is_presidio_powered=bool(self.analyzer)
            )

        if self.analyzer and self.anonymizer:
            try:
                return self._scrub_with_presidio(text, mode=mode)
            except Exception as e:
                logger.error(f"Presidio scrubbing error: {e}. Falling back to regex.")

        return self._scrub_with_regex(text, mode=mode)

    def _scrub_with_presidio(self, text: str, mode: str = "pseudonymize") -> PIIScrubResult:
        """Execute Presidio-powered NER analysis and sequential pseudonymization."""
        entities_to_scan = self.SUPPORTED_ENTITIES + ["LINKEDIN_PROFILE", "GITHUB_PROFILE"]
        results: List[RecognizerResult] = self.analyzer.analyze(
            text=text,
            entities=entities_to_scan,
            language="en"
        )

        # Sort results from end of text to start to allow clean character offset replacements
        sorted_results = sorted(results, key=lambda res: res.start, reverse=True)

        detected_entities: List[DetectedEntity] = []
        entity_counters: Dict[str, int] = {}
        mapping: Dict[str, str] = {}
        sanitized_chars = list(text)

        # Sequential replacement pass
        for res in sorted_results:
            original_val = text[res.start:res.end]
            entity_type = res.entity_type

            # Check if we already have a pseudonym for this exact string
            existing_placeholder = None
            for ph, orig in mapping.items():
                if orig.lower() == original_val.lower() and ph.startswith(f"<{entity_type}"):
                    existing_placeholder = ph
                    break

            if existing_placeholder:
                placeholder = existing_placeholder
            else:
                curr_count = entity_counters.get(entity_type, 0) + 1
                entity_counters[entity_type] = curr_count
                placeholder = f"<{entity_type}_{curr_count}>" if mode == "pseudonymize" else f"[{entity_type}]"
                mapping[placeholder] = original_val

            detected_entities.append(
                DetectedEntity(
                    entity_type=entity_type,
                    original_value=original_val,
                    placeholder=placeholder,
                    start=res.start,
                    end=res.end,
                    confidence=round(res.score, 3)
                )
            )

            # In-place string substitution via character slices
            sanitized_chars[res.start:res.end] = list(placeholder)

        sanitized_text = "".join(sanitized_chars)
        # Re-sort detected entities in ascending order of document appearance
        detected_entities.reverse()

        return PIIScrubResult(
            original_text=text,
            sanitized_text=sanitized_text,
            detected_entities=detected_entities,
            entity_counts=entity_counters,
            mapping=mapping,
            is_presidio_powered=True
        )

    def _scrub_with_regex(self, text: str, mode: str = "pseudonymize") -> PIIScrubResult:
        """
        Deterministic, zero-dependency regex engine that strips emails, phone numbers,
        social links, and common resume header names.
        """
        sanitized = text
        detected: List[DetectedEntity] = []
        mapping: Dict[str, str] = {}
        counters: Dict[str, int] = {}

        patterns = [
            ("EMAIL_ADDRESS", r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
            ("PHONE_NUMBER", r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"),
            ("LINKEDIN_PROFILE", r"(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+"),
            ("GITHUB_PROFILE", r"(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?"),
            ("US_SSN", r"\b\d{3}-\d{2}-\d{4}\b"),
            ("URL", r"https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?")
        ]

        # Scan each pattern
        for entity_type, pattern_str in patterns:
            for match in re.finditer(pattern_str, sanitized, re.IGNORECASE):
                val = match.group(0)
                if val in mapping.values():
                    continue
                count = counters.get(entity_type, 0) + 1
                counters[entity_type] = count
                ph = f"<{entity_type}_{count}>" if mode == "pseudonymize" else f"[{entity_type}]"
                mapping[ph] = val
                detected.append(
                    DetectedEntity(
                        entity_type=entity_type,
                        original_value=val,
                        placeholder=ph,
                        start=match.start(),
                        end=match.end(),
                        confidence=0.92
                    )
                )

        # Substitute found entities
        for ph, orig in mapping.items():
            sanitized = sanitized.replace(orig, ph)

        # Resume Header Name Heuristic: Often the first line of a resume is the person's name
        lines = [line.strip() for line in sanitized.splitlines() if line.strip()]
        if lines:
            first_line = lines[0]
            # If the first line is short (2-4 words) and contains letters without punctuation/tech buzzwords
            words = first_line.split()
            tech_keywords = {"resume", "curriculum", "vitae", "summary", "profile", "developer", "engineer"}
            if 1 <= len(words) <= 4 and not any(w.lower() in tech_keywords for w in words):
                if not re.search(r"[:@/\\0-9]", first_line):
                    name_ph = "<PERSON_1>" if mode == "pseudonymize" else "[PERSON]"
                    if name_ph not in mapping:
                        mapping[name_ph] = first_line
                        counters["PERSON"] = 1
                        detected.insert(0, DetectedEntity(
                            entity_type="PERSON",
                            original_value=first_line,
                            placeholder=name_ph,
                            start=0,
                            end=len(first_line),
                            confidence=0.88
                        ))
                        sanitized = sanitized.replace(first_line, name_ph, 1)

        return PIIScrubResult(
            original_text=text,
            sanitized_text=sanitized,
            detected_entities=detected,
            entity_counts=counters,
            mapping=mapping,
            is_presidio_powered=False
        )

    def restore(self, sanitized_text: str, mapping: Dict[str, str]) -> str:
        """Restores pseudonyms back to original text for safe local display."""
        restored = sanitized_text
        for placeholder, original in mapping.items():
            restored = restored.replace(placeholder, original)
        return restored


# Global singleton instance for easy import across endpoints
scrubber = PIIScrubber()
