"""
Astria Deterministic Match Engine
Calculates job fit score using the mathematical formula:
Match Score = ((matched + 0.5 * partial) / total_required) * 100
Completely deterministic, transparent, and explainable with zero LLM hallucination.
"""

from __future__ import annotations
import re
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field


class MatchStatus(str, Enum):
    MATCHED = "MATCHED"       # 1.0 weight
    PARTIAL = "PARTIAL"       # 0.5 weight
    MISSING = "MISSING"       # 0.0 weight
    BONUS = "BONUS"           # Preferred / Nice-to-have boost


class SkillCategory(str, Enum):
    LANGUAGES = "Languages"
    BACKEND = "Backend & Frameworks"
    FRONTEND = "Frontend & UI"
    DATABASE = "Databases & Storage"
    DEVOPS_CLOUD = "DevOps & Cloud"
    SYSTEM_DESIGN = "Architecture & Systems"
    AI_DATA = "AI, ML & Data"
    TESTING = "Testing & QA"
    GENERAL = "General Tech"


class EvaluatedSkill(BaseModel):
    """Detailed evaluation of an individual job requirement."""
    name: str
    status: MatchStatus
    weight: float = Field(..., description="Weight contribution: 1.0 for Matched, 0.5 for Partial, 0.0 for Missing")
    category: SkillCategory = SkillCategory.GENERAL
    candidate_evidence: Optional[str] = Field(None, description="Excerpt or adjacent tech found on resume")
    reasoning: str = Field(..., description="Deterministic justification for match status")


class ScoreAudit(BaseModel):
    """Detailed mathematical breakdown of the match score calculation."""
    formula: str = "(matched + 0.5 * partial) / total_required * 100"
    matched_count: int
    partial_count: int
    missing_count: int
    bonus_count: int
    total_required: int
    numerator: float
    denominator: int
    raw_fraction: float
    final_score: float
    audit_expression: str


class MatchResult(BaseModel):
    """Full gap analysis and match result payload."""
    score_percentage: float
    matched_skills: List[EvaluatedSkill]
    partial_skills: List[EvaluatedSkill]
    missing_skills: List[EvaluatedSkill]
    bonus_skills: List[EvaluatedSkill]
    audit: ScoreAudit
    recommendations_summary: str


# Canonical Skill Taxonomy with Aliases & Adjacency Graph
SKILL_TAXONOMY: Dict[str, Dict] = {
    # Backend & Languages
    "python": {
        "aliases": ["py", "python3"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["go", "ruby", "node.js"]
    },
    "fastapi": {
        "aliases": ["fast-api"],
        "category": SkillCategory.BACKEND,
        "adjacent": ["flask", "django", "express", "tornado"]
    },
    "django": {
        "aliases": ["django-rest-framework", "drf"],
        "category": SkillCategory.BACKEND,
        "adjacent": ["fastapi", "flask", "ruby on rails"]
    },
    "flask": {
        "aliases": [],
        "category": SkillCategory.BACKEND,
        "adjacent": ["fastapi", "django", "bottle"]
    },
    "javascript": {
        "aliases": ["js", "ecmascript"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["typescript"]
    },
    "typescript": {
        "aliases": ["ts"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["javascript"]
    },
    "go": {
        "aliases": ["golang"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["rust", "c++", "python"]
    },
    "rust": {
        "aliases": [],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["c++", "go"]
    },
    "java": {
        "aliases": ["core java", "openjdk"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["kotlin", "c#", "scala"]
    },
    "c++": {
        "aliases": ["cpp", "cplusplus"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["c", "rust"]
    },

    # Frontend
    "react": {
        "aliases": ["react.js", "reactjs"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["vue", "angular", "svelte", "next.js"]
    },
    "next.js": {
        "aliases": ["nextjs"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["react", "remix", "nuxt.js"]
    },
    "vue": {
        "aliases": ["vue.js", "vuejs"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["react", "svelte", "angular"]
    },
    "tailwind css": {
        "aliases": ["tailwind", "tailwindcss"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["bootstrap", "sass", "css3"]
    },

    # Databases
    "postgresql": {
        "aliases": ["postgres", "pgsql"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["mysql", "sqlite", "sql", "mariadb"]
    },
    "mysql": {
        "aliases": ["mariadb"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["postgresql", "sqlite", "sql"]
    },
    "mongodb": {
        "aliases": ["mongo"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["dynamodb", "couchbase", "documentdb"]
    },
    "redis": {
        "aliases": ["valkey"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["memcached", "hazelcast"]
    },
    "sql": {
        "aliases": ["rdbms", "relational database"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["postgresql", "mysql"]
    },

    # DevOps & Cloud
    "docker": {
        "aliases": ["containers", "containerization"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["podman", "kubernetes"]
    },
    "kubernetes": {
        "aliases": ["k8s"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["docker", "docker swarm", "helm", "openshift"]
    },
    "aws": {
        "aliases": ["amazon web services", "ec2", "s3", "lambda"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["gcp", "azure", "cloud"]
    },
    "gcp": {
        "aliases": ["google cloud platform", "google cloud"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["aws", "azure"]
    },
    "azure": {
        "aliases": ["microsoft azure"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["aws", "gcp"]
    },
    "ci/cd": {
        "aliases": ["continuous integration", "github actions", "gitlab ci", "jenkins"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["devops", "automation"]
    },
    "terraform": {
        "aliases": ["iac", "infrastructure as code"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["pulumi", "cloudformation", "ansible"]
    },

    # Architecture & Messaging
    "kafka": {
        "aliases": ["apache kafka"],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["rabbitmq", "event-driven", "sqs", "pub/sub"]
    },
    "rabbitmq": {
        "aliases": [],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["kafka", "sqs", "celery", "activemq"]
    },
    "graphql": {
        "aliases": [],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["rest", "grpc", "trpc"]
    },
    "rest": {
        "aliases": ["restful api", "rest api"],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["graphql", "grpc"]
    },
    "microservices": {
        "aliases": ["microservice architecture", "distributed systems"],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["event-driven", "docker"]
    },

    # AI & ML
    "pytorch": {
        "aliases": ["torch"],
        "category": SkillCategory.AI_DATA,
        "adjacent": ["tensorflow", "keras", "jax"]
    },
    "tensorflow": {
        "aliases": ["tf"],
        "category": SkillCategory.AI_DATA,
        "adjacent": ["pytorch", "keras"]
    },
    "llm": {
        "aliases": ["large language models", "generative ai", "genai", "prompt engineering"],
        "category": SkillCategory.AI_DATA,
        "adjacent": ["langchain", "rag", "transformers"]
    },
    "rag": {
        "aliases": ["retrieval-augmented generation", "vector search"],
        "category": SkillCategory.AI_DATA,
        "adjacent": ["llm", "vector db", "chromadb", "pinecone"]
    },

    # Testing
    "pytest": {
        "aliases": ["unit testing", "unittest"],
        "category": SkillCategory.TESTING,
        "adjacent": ["jest", "mocking", "tdd"]
    },
    "jest": {
        "aliases": [],
        "category": SkillCategory.TESTING,
        "adjacent": ["vitest", "mocha", "pytest"]
    }
}


class MatchEngine:
    """
    Deterministic Match & Gap Analysis Engine.
    Executes exact mathematical calculations for candidate resume against job requirements.
    """

    def __init__(self, taxonomy: Dict[str, Dict] = SKILL_TAXONOMY):
        self.taxonomy = taxonomy
        # Build normalized reverse-lookup alias table
        self.alias_to_canonical: Dict[str, str] = {}
        for canonical, info in self.taxonomy.items():
            self.alias_to_canonical[canonical.lower()] = canonical
            for alias in info.get("aliases", []):
                self.alias_to_canonical[alias.lower()] = canonical

    def _normalize_skill(self, skill_name: str) -> str:
        """Resolves aliases to canonical skill names."""
        clean = skill_name.strip().lower()
        return self.alias_to_canonical.get(clean, clean)

    def extract_skills_from_text(self, text: str) -> Set[str]:
        """Scans text for canonical skills and their recognized aliases."""
        found_skills: Set[str] = set()
        lowered_text = f" {text.lower()} "

        # Scan for all canonical names and aliases with word boundary checks
        for alias, canonical in self.alias_to_canonical.items():
            # Escape regex chars for symbols like c++, ci/cd, next.js
            escaped_alias = re.escape(alias)
            pattern = rf"(?:\b|\s|_){escaped_alias}(?:\b|\s|_|[.,;:)])"
            if re.search(pattern, lowered_text):
                found_skills.add(canonical)

        return found_skills

    def parse_job_requirements(self, jd_text: str) -> Tuple[List[str], List[str]]:
        """
        Extracts required vs preferred/bonus skills from Job Description text.
        Returns: (required_skills, preferred_skills)
        """
        all_skills = self.extract_skills_from_text(jd_text)
        
        # Partition based on common section headers
        required_skills: Set[str] = set()
        preferred_skills: Set[str] = set()

        # Heuristic section splitting
        lines = jd_text.splitlines()
        is_preferred_section = False
        
        for line in lines:
            line_lower = line.lower()
            if any(pref in line_lower for pref in ["nice to have", "preferred", "bonus", "plus", "desirable"]):
                is_preferred_section = True
            elif any(req in line_lower for req in ["requirements", "required", "qualifications", "must have", "responsibilities"]):
                is_preferred_section = False

            line_skills = self.extract_skills_from_text(line)
            if is_preferred_section:
                preferred_skills.update(line_skills)
            else:
                required_skills.update(line_skills)

        # If everything fell into preferred or required, ensure sensible default
        if not required_skills and preferred_skills:
            required_skills = preferred_skills
            preferred_skills = set()
        elif not required_skills and not preferred_skills:
            # Fall back to all extracted skills as required
            required_skills = all_skills

        # Ensure no overlap: skills in required take precedence
        preferred_skills = preferred_skills - required_skills

        return sorted(list(required_skills)), sorted(list(preferred_skills))

    def evaluate_match(
        self,
        resume_text: str,
        job_description_text: str,
        custom_required: Optional[List[str]] = None,
        custom_preferred: Optional[List[str]] = None
    ) -> MatchResult:
        """
        Executes full deterministic gap analysis and calculates exact score:
        Score = ((matched + 0.5 * partial) / total_required) * 100
        """
        # Extract candidate skills
        candidate_skills = self.extract_skills_from_text(resume_text)

        # Determine JD requirements
        if custom_required is not None:
            required_skills = [self._normalize_skill(s) for s in custom_required]
            preferred_skills = [self._normalize_skill(s) for s in (custom_preferred or [])]
        else:
            raw_req, raw_pref = self.parse_job_requirements(job_description_text)
            required_skills = [self._normalize_skill(s) for s in raw_req]
            preferred_skills = [self._normalize_skill(s) for s in raw_pref]

        matched_list: List[EvaluatedSkill] = []
        partial_list: List[EvaluatedSkill] = []
        missing_list: List[EvaluatedSkill] = []
        bonus_list: List[EvaluatedSkill] = []

        # Evaluate each required skill
        for req in required_skills:
            tax_entry = self.taxonomy.get(req, {})
            category = tax_entry.get("category", SkillCategory.GENERAL)
            adjacent_list = tax_entry.get("adjacent", [])

            # Check for direct match
            if req in candidate_skills:
                matched_list.append(
                    EvaluatedSkill(
                        name=req,
                        status=MatchStatus.MATCHED,
                        weight=1.0,
                        category=category,
                        candidate_evidence=f"Direct match found on resume: '{req}'",
                        reasoning="Exact skill keyword or synonym identified in candidate profile."
                    )
                )
            else:
                # Check for adjacent/transferable match (partial)
                found_adjacent = [adj for adj in adjacent_list if adj in candidate_skills]
                if found_adjacent:
                    partial_list.append(
                        EvaluatedSkill(
                            name=req,
                            status=MatchStatus.PARTIAL,
                            weight=0.5,
                            category=category,
                            candidate_evidence=f"Transferable experience: {', '.join(found_adjacent)}",
                            reasoning=f"Candidate has adjacent proficiency in {found_adjacent[0]}, offering ~50% paradigm transferability."
                        )
                    )
                else:
                    missing_list.append(
                        EvaluatedSkill(
                            name=req,
                            status=MatchStatus.MISSING,
                            weight=0.0,
                            category=category,
                            candidate_evidence=None,
                            reasoning=f"No direct or adjacent mentions of '{req}' found in candidate profile."
                        )
                    )

        # Evaluate bonus/preferred skills
        for pref in preferred_skills:
            tax_entry = self.taxonomy.get(pref, {})
            category = tax_entry.get("category", SkillCategory.GENERAL)
            if pref in candidate_skills:
                bonus_list.append(
                    EvaluatedSkill(
                        name=pref,
                        status=MatchStatus.BONUS,
                        weight=0.0,  # Bonus doesn't inflate base required denominator
                        category=category,
                        candidate_evidence=f"Bonus skill verified: '{pref}'",
                        reasoning="Preferred qualification found; represents positive competitive differentiator."
                    )
                )

        # Deterministic Score Calculation
        total_required = len(required_skills)
        matched_count = len(matched_list)
        partial_count = len(partial_list)
        missing_count = len(missing_list)
        bonus_count = len(bonus_list)

        if total_required == 0:
            score = 100.0
            numerator = 0.0
            denominator = 0
            raw_fraction = 1.0
            audit_str = "No explicit technical requirements detected -> 100.0% default baseline."
        else:
            numerator = matched_count + (0.5 * partial_count)
            denominator = total_required
            raw_fraction = numerator / denominator
            score = round(raw_fraction * 100.0, 1)
            # Cap at 100.0%
            score = min(100.0, max(0.0, score))
            audit_str = f"({matched_count} Matched + 0.5 * {partial_count} Partial) / {denominator} Required = {numerator:.1f} / {denominator} = {score:.1f}%"

        audit = ScoreAudit(
            matched_count=matched_count,
            partial_count=partial_count,
            missing_count=missing_count,
            bonus_count=bonus_count,
            total_required=total_required,
            numerator=numerator,
            denominator=denominator,
            raw_fraction=round(raw_fraction, 4),
            final_score=score,
            audit_expression=audit_str
        )

        summary_msg = (
            f"Candidate meets {score:.1f}% of mandatory requirements. "
            f"{matched_count} fully matched, {partial_count} partial transferable, "
            f"and {missing_count} actionable skill gap(s)."
        )

        return MatchResult(
            score_percentage=score,
            matched_skills=matched_list,
            partial_skills=partial_list,
            missing_skills=missing_list,
            bonus_skills=bonus_list,
            audit=audit,
            recommendations_summary=summary_msg
        )


# Global singleton instance
match_engine = MatchEngine()
