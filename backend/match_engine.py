"""
Astria Deterministic Match Engine
Calculates job fit score using the mathematical formula:
Match Score = ((matched + 0.5 * partial) / total_required) * 100
Completely deterministic, transparent, and explainable with zero LLM hallucination.

Gap Audit Filter: Only real technical skills, tools, frameworks, and domain expertise
are extracted and compared. Non-skill keywords (job titles, years of experience,
work arrangements, generic boilerplate) are explicitly excluded.
"""

from __future__ import annotations
import re
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Noise Word Blacklist — Explicitly Excluded from Gap Audit Output
# ---------------------------------------------------------------------------
# Words / phrases that commonly appear in JDs but are NOT technical skills.
# Compared against lower-cased, stripped candidate tokens.
NOISE_WORD_BLACKLIST: Set[str] = {
    # Role metadata & seniority
    "senior", "junior", "lead", "principal", "staff", "associate", "intern",
    "manager", "director", "architect", "engineer", "developer", "programmer",
    "analyst", "specialist", "consultant", "contractor", "generalist",
    # Years / experience
    "years", "year", "experience", "minimum", "minimum experience", "5 years",
    "3 years", "2 years", "1 year", "7 years", "10 years",
    # Work arrangement
    "hybrid", "remote", "onsite", "on-site", "full-time", "part-time", "contract",
    "permanent", "freelance", "relocation",
    # -----------------------------------------------------------------------
    # DOCUMENT METADATA HEADERS — section labels that are NOT skills
    # These appear verbatim at the top of job postings and resumes and must
    # never be treated as candidate skill requirements.
    # -----------------------------------------------------------------------
    "role", "company", "job", "description", "target", "overview",
    "about", "position", "status", "candidate", "team", "work",
    "summary", "location", "masterclass",
    # Company / brand names that appear in JD headers
    "cloudpulse", "accenture", "infosys", "wipro", "tcs", "google", "amazon",
    "microsoft", "meta", "apple", "netflix", "uber", "airbnb", "stripe",
    # JD boilerplate section headers
    "qualifications", "responsibilities", "requirements", "preferred", "benefits",
    "about us", "nice to have", "must have", "what we offer", "who we are",
    "the role", "your role", "what you will do", "what you need",
    "job description", "job requirements", "role description", "role overview",
    "company overview", "about the company", "about the role",
    # Generic action verbs / soft fluff
    "strong", "proficient", "familiarity", "knowledge", "understanding",
    "excellent", "good", "hands-on", "proven", "solid", "deep", "exposure",
    "ability", "ability to", "passion", "motivated", "collaborative",
    "communication", "interpersonal", "leadership", "ownership", "detail",
    "team player", "self-starter", "fast learner", "problem solving",
    "problem-solving", "critical thinking", "analytical", "creative",
    # Location / geo
    "location", "city", "state", "country", "bangalore", "mumbai", "delhi",
    "hyderabad", "chennai", "pune", "india", "usa", "uk", "canada", "australia",
    "san francisco", "new york", "london", "berlin", "singapore",
    # Compensation / benefits
    "salary", "compensation", "equity", "bonus", "lpa", "ctc", "package",
    "insurance", "health", "dental", "vision", "vacation", "pto",
    # Education
    "bachelor", "master", "degree", "btech", "mtech", "b.e", "m.e", "phd",
    "computer science", "information technology", "engineering degree",
    # Common English stop words that appear in JD prose but are not skills
    "and", "or", "the", "of", "in", "with", "for", "to", "a", "an",
    "is", "be", "at", "by", "we", "as", "on", "up", "do", "it", "if",
    "no", "so", "us", "an", "he", "she", "they",
    "etc", "including", "such as", "e.g", "i.e",
    # Additional prose words found verbatim in JD metadata blocks
    "full", "stack", "based", "join", "help", "build", "scale", "drive",
    "own", "run", "set", "get", "put", "let", "too", "lot", "key",
    "like", "take", "make", "move", "keep", "grow", "meet", "lead",
}


# ---------------------------------------------------------------------------
# Canonical display-casing map for skill name output
# ---------------------------------------------------------------------------
SKILL_DISPLAY_CASING: Dict[str, str] = {
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "react": "React",
    "next.js": "Next.js",
    "vue": "Vue.js",
    "angular": "Angular",
    "node.js": "Node.js",
    "express": "Express",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "go": "Go",
    "rust": "Rust",
    "java": "Java",
    "c++": "C++",
    "c#": "C#",
    "c": "C",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "sql": "SQL",
    "nosql": "NoSQL",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "ci/cd": "CI/CD",
    "git": "Git",
    "linux": "Linux",
    "terraform": "Terraform",
    "kafka": "Apache Kafka",
    "rabbitmq": "RabbitMQ",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "rest": "REST",
    "microservices": "Microservices",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "llm": "LLM / GenAI",
    "rag": "RAG",
    "pytest": "pytest",
    "jest": "Jest",
    "tailwind css": "Tailwind CSS",
    "html": "HTML5",
    "css": "CSS3",
}


def _is_noise_word(skill: str) -> bool:
    """
    Returns True if the skill token is a known non-technical noise word
    that should be excluded from the Gap Audit output.
    """
    clean = skill.strip().lower()
    if clean in NOISE_WORD_BLACKLIST:
        return True
    # Also block purely numeric tokens (e.g. "5", "3+")
    if re.fullmatch(r'[\d+\-\.]+', clean):
        return True
    # Block tokens shorter than 2 characters (except known 1-char skills handled separately)
    if len(clean) < 2 and clean not in {"c"}:
        return True
    return False


def _display_skill(canonical: str) -> str:
    """
    Returns the proper display-cased name for a canonical skill key.
    Preserves original casing for skills not in the display map.
    """
    return SKILL_DISPLAY_CASING.get(canonical.lower(), canonical.title())


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
    "node.js": {
        "aliases": ["nodejs", "node"],
        "category": SkillCategory.BACKEND,
        "adjacent": ["express", "javascript", "typescript", "fastapi"]
    },
    "express": {
        "aliases": ["express.js", "expressjs"],
        "category": SkillCategory.BACKEND,
        "adjacent": ["node.js", "fastapi", "flask"]
    },
    "javascript": {
        "aliases": ["ecmascript"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["typescript", "node.js"]
    },
    "typescript": {
        "aliases": ["ts"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["javascript"]
    },
    "go": {
        "aliases": ["golang", "go-lang", "go language", "go programming", "go developer"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["rust", "c++", "python"]
    },
    "rust": {
        "aliases": ["cargo"],
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
    "c#": {
        "aliases": [".net", "csharp", "c-sharp", "dotnet", "asp.net"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["java", "c++"]
    },
    "c": {
        "aliases": ["c language", "ansi c", "embedded c"],
        "category": SkillCategory.LANGUAGES,
        "adjacent": ["c++", "rust"]
    },

    # Frontend
    "react": {
        "aliases": ["react.js", "reactjs", "react-native", "react native"],
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
    "angular": {
        "aliases": ["angular.js", "angularjs"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["react", "vue", "typescript"]
    },
    "tailwind css": {
        "aliases": ["tailwind", "tailwindcss"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["bootstrap", "sass", "css"]
    },
    "html": {
        "aliases": ["html5"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["css", "javascript"]
    },
    "css": {
        "aliases": ["css3", "vanilla css", "sass", "scss"],
        "category": SkillCategory.FRONTEND,
        "adjacent": ["html", "tailwind css"]
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
    "sqlite": {
        "aliases": [],
        "category": SkillCategory.DATABASE,
        "adjacent": ["postgresql", "mysql", "sql"]
    },
    "mongodb": {
        "aliases": ["mongo"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["dynamodb", "couchbase", "documentdb", "nosql"]
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
    "nosql": {
        "aliases": ["no-sql"],
        "category": SkillCategory.DATABASE,
        "adjacent": ["mongodb", "redis"]
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
        "aliases": ["continuous integration", "github actions", "gitlab ci", "jenkins", "circleci"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["devops", "automation", "git"]
    },
    "git": {
        "aliases": ["github", "gitlab", "version control"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["ci/cd", "linux"]
    },
    "linux": {
        "aliases": ["unix", "bash", "shell scripting", "shell"],
        "category": SkillCategory.DEVOPS_CLOUD,
        "adjacent": ["docker", "devops"]
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
        "aliases": ["apollo graphql", "relay"],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["rest", "grpc", "trpc"]
    },
    "grpc": {
        "aliases": ["protobuf", "protocol buffers"],
        "category": SkillCategory.SYSTEM_DESIGN,
        "adjacent": ["rest", "graphql"]
    },
    "rest": {
        "aliases": [
            "restful", "rest api", "rest apis", "restful api", "restful apis",
            "rest architecture", "rest web services", "restful web services", "rest endpoints"
        ],
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
        "aliases": ["vitest"],
        "category": SkillCategory.TESTING,
        "adjacent": ["vitest", "mocha", "pytest"]
    }
}


class MatchEngine:
    """
    Deterministic Match & Gap Analysis Engine.
    Executes exact mathematical calculations for candidate resume against job requirements.
    Features robust false-positive elimination for ambiguous keywords and exact symbol support.
    """

    # Skills that require strict context or case/delimiters to avoid false positives with English words
    DISAMBIGUATED_SKILLS = {"go", "react", "rest", "c", "javascript"}

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
        """
        Scans text for canonical skills and their recognized aliases.
        Guarantees zero false positives for ambiguous words ('go', 'react', 'rest', 'js')
        and clean symbol boundary recognition ('c++', 'c#', 'ci/cd', '.net').
        """
        found_skills: Set[str] = set()
        lowered_text = f" {text.lower()} "

        # 1. Specialized contextual recognizers for ambiguous keywords
        # A. Go (Golang) - Never match standalone English verb "go"
        go_patterns = [
            r"\b(?:golang|go-lang|go\s+language|go\s+programming|go\s+developer|go\s+backend|go\s+microservices?)\b",
            r"(?<=[,\/|•\n\r])\s*Go\s*(?=[,\/|•\n\r])",
            r"\b(?:Languages|Skills|Technologies|Stack)\s*:[^\n]*\bGo\b",
            r"\bGo\s*\/\s*(?:Python|Java|Rust|C\+\+|Ruby)\b"
        ]
        if any(re.search(pat, text if "Go" in pat else lowered_text, re.IGNORECASE if "Go" not in pat else 0) for pat in go_patterns):
            found_skills.add("go")

        # B. React - Avoid "ability to react", "react quickly", "fail to react"
        react_tech_pattern = (
            r"\b(?:react\.?js|reactjs|react\s+native|react\s+frontend|react\s+components?|"
            r"react\s+hooks?|react\s+router|react\s+ecosystem|react\s+developer|react\s+app)\b"
        )
        if re.search(react_tech_pattern, lowered_text):
            found_skills.add("react")
        else:
            # Check for capitalized 'React' in lists or technical context
            for m in re.finditer(r"\bReact\b", text):
                pre = text[max(0, m.start() - 25):m.start()].lower()
                post = text[m.end():min(len(text), m.end() + 25)].lower()
                is_verb_phrase = any(pre.rstrip().endswith(v) for v in ["ability to", "able to", "how to", "to", "will", "would", "can", "shall", "fail to"])
                is_adverb_phrase = any(post.lstrip().startswith(v) for v in ["to ", "under ", "quickly", "fast", "in response", "appropriately"])
                if not (is_verb_phrase or is_adverb_phrase):
                    found_skills.add("react")
                    break

        # C. REST - Avoid "the rest of", "rest assured", "take a rest"
        rest_tech_pattern = (
            r"\b(?:restful(?:\s+apis?)?|rest[\s-]apis?|rest[\s-]services?|rest[\s-]endpoints?|"
            r"rest[\s-]architectures?|rest[\s-]web[\s-]services?|restful[\s-]web[\s-]services?)\b"
        )
        if re.search(rest_tech_pattern, lowered_text):
            found_skills.add("rest")
        else:
            for m in re.finditer(r"\bREST\b", text):
                pre = text[max(0, m.start() - 15):m.start()].lower()
                post = text[m.end():min(len(text), m.end() + 15)].lower()
                if any(pre.rstrip().endswith(v) for v in ["the", "a", "take a"]) or any(post.lstrip().startswith(v) for v in ["of", "assured", "easy", "in peace"]):
                    continue
                found_skills.add("rest")
                break

        # D. JavaScript & JS - Guard against matching '.js' in 'next.js', 'vue.js', 'node.js', etc.
        if re.search(r"\b(?:javascript|ecmascript)\b", lowered_text):
            found_skills.add("javascript")
        elif re.search(r"(?<![.\w])js(?![.\w])", lowered_text):
            # Standalone 'js' not preceded by a dot
            found_skills.add("javascript")

        # E. C Language - Guard single letter C against ordinary English characters
        c_patterns = [
            r"\b(?:c\s+language|ansi\s+c|embedded\s+c)\b",
            r"(?<=[,\/|•])\s*C\s*(?=[,\/|•])",
            r"\bC\s*\/\s*C\+\+\b"
        ]
        if any(re.search(pat, text if "C" in pat else lowered_text) for pat in c_patterns):
            found_skills.add("c")

        # 2. General taxonomy scanner for unambiguous canonical skills and aliases
        for alias, canonical in self.alias_to_canonical.items():
            if canonical in self.DISAMBIGUATED_SKILLS:
                continue

            escaped_alias = re.escape(alias)
            # Use symbol-safe boundaries: supports 'c++', 'c#', 'ci/cd', '.net', etc.
            if any(sym in alias for sym in ["+", "#", "/", "."]):
                pattern = rf"(?<![a-zA-Z0-9#+]){escaped_alias}(?![a-zA-Z0-9#+])"
            else:
                pattern = rf"(?<![a-zA-Z0-9_-]){escaped_alias}(?![a-zA-Z0-9_-])"

            if re.search(pattern, lowered_text):
                found_skills.add(canonical)

        return found_skills

    def parse_job_requirements(self, jd_text: str) -> Tuple[List[str], List[str]]:
        """
        Extracts required vs preferred/bonus skills from Job Description text.

        Extraction strategy:
        - Uses the curated SKILL_TAXONOMY as an exact allowlist — only canonical
          technical skills, tools, frameworks, and domain expertise are extracted.
        - Non-skill tokens (job titles, years, locations, boilerplate) are filtered
          out by the taxonomy allowlist itself and by the NOISE_WORD_BLACKLIST.
        - Partitions results into required vs preferred based on JD section headers.

        Returns: (required_skills, preferred_skills)
        """
        # Run the taxonomy-based extractor (already an allowlist — only known skills pass)
        all_skills = self.extract_skills_from_text(jd_text)

        # Apply noise-word blacklist as a safety-net post-filter
        all_skills = {s for s in all_skills if not _is_noise_word(s)}

        # Partition based on common section headers
        required_skills: Set[str] = set()
        preferred_skills: Set[str] = set()

        # Heuristic section splitting
        lines = jd_text.splitlines()
        is_preferred_section = False

        for line in lines:
            line_lower = line.lower().strip()

            # Detect section transitions
            if any(pref in line_lower for pref in [
                "nice to have", "preferred", "bonus", "plus", "desirable",
                "good to have", "advantageous"
            ]):
                is_preferred_section = True
            elif any(req in line_lower for req in [
                "requirements", "required skills", "required qualifications",
                "must have", "responsibilities", "what you need",
                "minimum qualifications", "mandatory"
            ]):
                is_preferred_section = False

            # Extract only taxonomy-known skills from this line
            line_skills = self.extract_skills_from_text(line)
            # Apply blacklist filter on each line's extracted tokens
            line_skills = {s for s in line_skills if not _is_noise_word(s)}

            if is_preferred_section:
                preferred_skills.update(line_skills)
            else:
                required_skills.update(line_skills)

        # Sensible defaults
        if not required_skills and preferred_skills:
            required_skills = preferred_skills
            preferred_skills = set()
        elif not required_skills and not preferred_skills:
            required_skills = all_skills

        # Ensure no overlap: required takes precedence
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

        # Post-normalize: apply noise blacklist to the requirement lists
        required_skills = [s for s in required_skills if not _is_noise_word(s)]
        preferred_skills = [s for s in preferred_skills if not _is_noise_word(s)]

        matched_list: List[EvaluatedSkill] = []
        partial_list: List[EvaluatedSkill] = []
        missing_list: List[EvaluatedSkill] = []
        bonus_list: List[EvaluatedSkill] = []

        # Evaluate each required skill
        for req in required_skills:
            tax_entry = self.taxonomy.get(req, {})
            category = tax_entry.get("category", SkillCategory.GENERAL)
            adjacent_list = tax_entry.get("adjacent", [])

            # Use display-cased name for output (preserves "TypeScript", "FastAPI", etc.)
            display_name = _display_skill(req)

            # Check for direct match
            if req in candidate_skills:
                matched_list.append(
                    EvaluatedSkill(
                        name=display_name,
                        status=MatchStatus.MATCHED,
                        weight=1.0,
                        category=category,
                        candidate_evidence=f"Direct match found on resume: '{display_name}'",
                        reasoning="Exact skill keyword or synonym identified in candidate profile."
                    )
                )
            else:
                # Check for adjacent/transferable match (partial)
                found_adjacent = [adj for adj in adjacent_list if adj in candidate_skills]
                if found_adjacent:
                    adjacent_display = [_display_skill(a) for a in found_adjacent]
                    partial_list.append(
                        EvaluatedSkill(
                            name=display_name,
                            status=MatchStatus.PARTIAL,
                            weight=0.5,
                            category=category,
                            candidate_evidence=f"Transferable experience: {', '.join(adjacent_display)}",
                            reasoning=f"Candidate has adjacent proficiency in {adjacent_display[0]}, offering ~50% paradigm transferability."
                        )
                    )
                else:
                    missing_list.append(
                        EvaluatedSkill(
                            name=display_name,
                            status=MatchStatus.MISSING,
                            weight=0.0,
                            category=category,
                            candidate_evidence=None,
                            reasoning=f"No direct or adjacent mentions of '{display_name}' found in candidate profile."
                        )
                    )

        # Evaluate bonus/preferred skills
        for pref in preferred_skills:
            tax_entry = self.taxonomy.get(pref, {})
            category = tax_entry.get("category", SkillCategory.GENERAL)
            pref_display = _display_skill(pref)
            if pref in candidate_skills:
                bonus_list.append(
                    EvaluatedSkill(
                        name=pref_display,
                        status=MatchStatus.BONUS,
                        weight=0.0,  # Bonus doesn't inflate base required denominator
                        category=category,
                        candidate_evidence=f"Bonus skill verified: '{pref_display}'",
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
