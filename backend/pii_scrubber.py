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
        """Execute Presidio-powered NER analysis and sequential pseudonymization with span de-overlap."""
        entities_to_scan = self.SUPPORTED_ENTITIES + ["LINKEDIN_PROFILE", "GITHUB_PROFILE"]
        results: List[RecognizerResult] = self.analyzer.analyze(
            text=text,
            entities=entities_to_scan,
            language="en"
        )

        # De-duplicate and resolve overlapping spans (prefer longer span or higher score)
        # Sort by start asc, then span length desc, then score desc
        sorted_candidates = sorted(
            results,
            key=lambda r: (r.start, -(r.end - r.start), -r.score)
        )

        non_overlapping: List[RecognizerResult] = []
        last_end = -1
        for res in sorted_candidates:
            if res.start >= last_end:
                non_overlapping.append(res)
                last_end = res.end
            else:
                # Overlap: skip or ignore since prior candidate has higher priority/length
                continue

        # Sort reverse by start for clean character slice replacement
        reverse_results = sorted(non_overlapping, key=lambda res: res.start, reverse=True)

        detected_entities: List[DetectedEntity] = []
        entity_counters: Dict[str, int] = {}
        mapping: Dict[str, str] = {}
        sanitized_chars = list(text)

        # Sequential replacement pass from end of string to start
        for res in reverse_results:
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
        social links, and common resume header names with exact span slice replacement.
        """
        raw_spans: List[Tuple[int, int, str, str, float]] = []

        # 1. First check for explicit labeled candidate names (e.g. "Name: Jane Doe")
        name_label_pattern = re.compile(
            r"(?:^|\n)\s*(?:Name|Candidate|Full\s*Name)\s*:\s*([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){1,3})",
            re.IGNORECASE
        )
        for match in name_label_pattern.finditer(text):
            val = match.group(1).strip()
            start, end = match.start(1), match.end(1)
            raw_spans.append((start, end, "PERSON", val, 0.95))

        # 2. Check header name heuristic: first line if capitalized 2-4 word person name
        lines = text.splitlines()
        first_line_info = None
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if stripped:
                # Find start character position in text
                line_start = text.find(stripped)
                line_end = line_start + len(stripped)
                first_line_info = (line_start, line_end, stripped)
                break

        if first_line_info:
            l_start, l_end, l_text = first_line_info
            non_name_words = {
                "resume", "curriculum", "vitae", "summary", "profile", "developer", "engineer",
                "software", "architect", "lead", "senior", "junior", "objective", "experience",
                "education", "skills", "projects", "contact", "phone", "email", "address",
                "portfolio", "certified", "professional", "backend", "frontend", "fullstack",
                "data", "cloud", "consultant", "analyst", "manager", "intern"
            }
            # Check if line consists of 2-4 capitalized name words without punctuation or digits
            words = l_text.split()
            if 2 <= len(words) <= 4:
                is_valid_name = all(
                    re.match(r"^[A-Z][a-zA-Z.'-]+$", w) and w.lower() not in non_name_words
                    for w in words
                )
                if is_valid_name and not re.search(r"[:@/\\0-9]", l_text):
                    raw_spans.append((l_start, l_end, "PERSON", l_text, 0.90))

        # 3. High-precision regexes for emails, phones, URLs, and profiles
        patterns = [
            ("EMAIL_ADDRESS", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", 0.98),
            ("PHONE_NUMBER", r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", 0.95),
            ("LINKEDIN_PROFILE", r"(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+", 0.96),
            ("GITHUB_PROFILE", r"(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?", 0.94),
            ("US_SSN", r"\b\d{3}-\d{2}-\d{4}\b", 0.99),
            ("URL", r"https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s.,;)]*)?", 0.88),
        ]

        for entity_type, pattern_str, conf in patterns:
            for match in re.finditer(pattern_str, text, re.IGNORECASE):
                raw_spans.append((match.start(), match.end(), entity_type, match.group(0), conf))

        # Resolve overlapping spans: sort by start asc, length desc, confidence desc
        sorted_spans = sorted(
            raw_spans,
            key=lambda x: (x[0], -(x[1] - x[0]), -x[4])
        )

        non_overlapping = []
        last_end = -1
        for start, end, etype, val, conf in sorted_spans:
            if start >= last_end:
                non_overlapping.append((start, end, etype, val, conf))
                last_end = end

        # Sort reverse by start for exact character slice replacement
        reverse_spans = sorted(non_overlapping, key=lambda x: x[0], reverse=True)

        detected: List[DetectedEntity] = []
        mapping: Dict[str, str] = {}
        counters: Dict[str, int] = {}
        sanitized_chars = list(text)

        for start, end, entity_type, val, conf in reverse_spans:
            # Re-use placeholder for identical entities of same type
            existing_ph = None
            for ph, orig in mapping.items():
                if orig.lower() == val.lower() and ph.startswith(f"<{entity_type}"):
                    existing_ph = ph
                    break

            if existing_ph:
                ph = existing_ph
            else:
                count = counters.get(entity_type, 0) + 1
                counters[entity_type] = count
                ph = f"<{entity_type}_{count}>" if mode == "pseudonymize" else f"[{entity_type}]"
                mapping[ph] = val

            detected.append(
                DetectedEntity(
                    entity_type=entity_type,
                    original_value=val,
                    placeholder=ph,
                    start=start,
                    end=end,
                    confidence=conf
                )
            )

            # In-place character slice replacement
            sanitized_chars[start:end] = list(ph)

        sanitized_text = "".join(sanitized_chars)
        detected.reverse()

        return PIIScrubResult(
            original_text=text,
            sanitized_text=sanitized_text,
            detected_entities=detected,
            entity_counts=counters,
            mapping=mapping,
            is_presidio_powered=False
        )

    def restore(self, sanitized_text: str, mapping: Dict[str, str]) -> str:
        """Restores pseudonyms back to original text safely without substring collisions."""
        restored = sanitized_text
        # Sort placeholders descending by length to prevent <PERSON_1> from clobbering <PERSON_10>
        for placeholder, original in sorted(mapping.items(), key=lambda item: len(item[0]), reverse=True):
            restored = restored.replace(placeholder, original)
        return restored


# Global singleton instance for easy import across endpoints
scrubber = PIIScrubber()
