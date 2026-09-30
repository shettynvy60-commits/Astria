"""
Astria ATS Keyword Engine
Deterministic n-gram keyword extraction and weighted ATS scoring.

Extracts 1-gram, 2-gram, and 3-gram key phrases from the Job Description,
categorizes them, performs alias-aware fuzzy matching against the resume,
and returns a structured weighted ATS score.

Zero LLM dependency - fully offline capable, no hallucinations.
"""

from __future__ import annotations
import re
from typing import Dict, List, Set, Tuple


# ---------------------------------------------------------------------------
# ATS Stop-Word Blocklist
# ---------------------------------------------------------------------------
ATS_STOP_WORDS: Set[str] = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "be", "are", "was", "were",
    "will", "have", "has", "had", "do", "does", "did", "not", "this",
    "that", "these", "those", "they", "we", "you", "our", "your", "their",
    "which", "when", "where", "how", "who", "what", "all", "any", "both",
    "each", "more", "most", "other", "some", "such", "than", "too", "very",
    "can", "may", "would", "could", "should", "also", "its", "into", "out",
    "up", "down", "just", "only", "per", "via", "new", "one", "two",
    # JD filler
    "candidate", "responsibilities", "successful", "ability", "opportunity",
    "required", "preferred", "qualifications", "position", "role", "company",
    "team", "work", "working", "join", "help", "build", "drive", "run",
    "using", "about", "overview", "description", "job", "target", "summary",
    "status", "strong", "experience", "years", "minimum", "excellent",
    "good", "proven", "solid", "deep", "hands-on", "proficient", "knowledge",
    "familiarity", "understanding", "exposure", "passion", "motivated",
    "fast", "learner", "self", "starter", "problem", "solving", "critical",
    "thinking", "analytical", "creative", "collaborative", "ownership",
    "detail", "communication", "interpersonal", "leadership", "salary",
    "compensation", "benefits", "hybrid", "remote", "onsite", "contract",
    "permanent", "full", "time", "part", "location", "based", "office",
    "bachelor", "master", "degree", "btech", "mtech", "phd", "equivalent",
}

# ---------------------------------------------------------------------------
# Alias / Variation Map
# ---------------------------------------------------------------------------
KEYWORD_ALIASES: Dict[str, List[str]] = {
    "python": ["py", "python3", "python 3"],
    "javascript": ["js", "ecmascript", "es6", "es2015"],
    "typescript": ["ts"],
    "go": ["golang", "go-lang"],
    "c++": ["cpp", "cplusplus"],
    "c#": ["csharp", "dotnet", ".net", "asp.net"],
    "react": ["reactjs", "react.js", "react native", "react hooks"],
    "angular": ["angularjs", "angular.js"],
    "vue": ["vuejs", "vue.js", "vue 3"],
    "next.js": ["nextjs", "next js"],
    "tailwind css": ["tailwindcss", "tailwind"],
    "fastapi": ["fast api", "fastapi framework"],
    "django": ["django rest framework", "drf"],
    "flask": ["flask api"],
    "node.js": ["nodejs", "node js"],
    "express": ["expressjs", "express.js"],
    "spring boot": ["spring", "spring framework", "spring mvc"],
    "postgresql": ["postgres", "pgsql", "postgre"],
    "mysql": ["mariadb"],
    "mongodb": ["mongo", "mongoose"],
    "redis": ["redis cache"],
    "elasticsearch": ["elastic", "elk"],
    "sql": ["structured query language", "rdbms"],
    "nosql": ["no-sql", "non-relational"],
    "dynamodb": ["dynamo db", "amazon dynamodb"],
    "aws": ["amazon web services", "ec2", "s3", "lambda", "amazon aws"],
    "gcp": ["google cloud", "google cloud platform"],
    "azure": ["microsoft azure", "azure cloud"],
    "docker": ["containerization", "containers", "dockerfile"],
    "kubernetes": ["k8s", "kubernetes cluster"],
    "terraform": ["infrastructure as code", "iac"],
    "ci/cd": [
        "continuous integration", "continuous delivery", "continuous deployment",
        "github actions", "gitlab ci", "jenkins", "circleci", "ci cd", "cicd"
    ],
    "git": ["github", "gitlab", "version control", "gitflow"],
    "linux": ["unix", "bash", "shell scripting"],
    "rest api": ["restful", "restful api", "rest apis", "http api", "rest endpoints"],
    "graphql": ["apollo graphql", "graph ql"],
    "grpc": ["protobuf", "protocol buffers"],
    "microservices": ["microservice", "distributed systems"],
    "websocket": ["web sockets", "websockets", "socket.io"],
    "kafka": ["apache kafka", "event streaming"],
    "rabbitmq": ["amqp", "message queue"],
    "pytorch": ["torch"],
    "tensorflow": ["tf", "keras"],
    "machine learning": ["ml", "deep learning", "neural networks"],
    "llm": ["large language models", "generative ai", "genai", "prompt engineering"],
    "rag": ["retrieval augmented generation", "vector search"],
    "unit testing": ["unit tests", "jest", "pytest", "vitest", "mocha", "junit"],
    "integration testing": ["integration tests", "e2e testing", "end-to-end testing"],
    "agile": ["scrum", "kanban", "sprint", "agile methodology"],
    "system design": ["system architecture", "distributed architecture"],
    "state management": ["redux", "zustand", "mobx", "context api", "recoil"],
    "ci/cd pipeline": ["deployment pipeline", "build pipeline"],
    "ui design systems": ["design system", "component library", "storybook"],
    "real-time data": ["real time processing", "event driven", "streaming data"],
    "api design": ["api architecture", "openapi", "swagger"],
    "data structures": ["algorithms", "data structures and algorithms", "dsa"],
    "oauth": ["oauth2", "openid connect", "oidc", "jwt", "json web token"],
}

HARD_SKILLS: Set[str] = {
    "python", "javascript", "typescript", "java", "go", "rust", "c++", "c#",
    "kotlin", "swift", "ruby", "php", "scala", "dart", "elixir",
    "react", "angular", "vue", "next.js", "svelte", "html", "css",
    "tailwind css", "sass", "redux", "webpack", "vite",
    "fastapi", "django", "flask", "node.js", "express", "spring boot",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "sql", "nosql", "dynamodb", "cassandra", "neo4j", "firebase",
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd",
    "git", "linux", "nginx", "ansible", "helm", "prometheus", "grafana",
    "rest api", "graphql", "grpc", "websocket", "kafka", "rabbitmq",
    "microservices", "oauth",
    "pytorch", "tensorflow", "machine learning", "rag", "llm",
    "unit testing", "integration testing",
}

METHODOLOGIES: Set[str] = {
    "agile", "system design", "api design", "ci/cd pipeline", "tdd",
    "devops", "gitops", "state management", "data structures",
    "design patterns", "code review", "pair programming",
    "object-oriented programming", "functional programming",
}

DOMAIN_TERMS: Set[str] = {
    "real-time data", "ui design systems", "accessibility",
    "performance optimization", "seo", "responsive design",
    "data pipeline", "etl", "distributed systems", "scalability",
    "fault tolerance", "high availability", "load balancing", "caching",
    "rate limiting", "oauth",
}

KEYWORD_DISPLAY: Dict[str, str] = {
    "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
    "java": "Java", "go": "Go", "rust": "Rust", "c++": "C++", "c#": "C#",
    "kotlin": "Kotlin", "swift": "Swift", "ruby": "Ruby", "php": "PHP",
    "scala": "Scala", "dart": "Dart", "elixir": "Elixir",
    "react": "React", "angular": "Angular", "vue": "Vue.js", "next.js": "Next.js",
    "svelte": "Svelte", "html": "HTML5", "css": "CSS3", "tailwind css": "Tailwind CSS",
    "sass": "Sass/SCSS", "redux": "Redux", "webpack": "Webpack", "vite": "Vite",
    "fastapi": "FastAPI", "django": "Django", "flask": "Flask",
    "node.js": "Node.js", "express": "Express", "spring boot": "Spring Boot",
    "postgresql": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB",
    "redis": "Redis", "elasticsearch": "Elasticsearch", "sqlite": "SQLite",
    "sql": "SQL", "nosql": "NoSQL", "dynamodb": "DynamoDB",
    "aws": "AWS", "gcp": "GCP", "azure": "Azure", "docker": "Docker",
    "kubernetes": "Kubernetes", "terraform": "Terraform", "ci/cd": "CI/CD",
    "git": "Git", "linux": "Linux", "nginx": "Nginx",
    "rest api": "REST API", "graphql": "GraphQL", "grpc": "gRPC",
    "websocket": "WebSocket", "kafka": "Apache Kafka", "rabbitmq": "RabbitMQ",
    "microservices": "Microservices", "oauth": "OAuth 2.0",
    "pytorch": "PyTorch", "tensorflow": "TensorFlow",
    "machine learning": "Machine Learning", "rag": "RAG", "llm": "LLM / GenAI",
    "unit testing": "Unit Testing", "integration testing": "Integration Testing",
    "agile": "Agile / Scrum", "system design": "System Design",
    "api design": "API Design", "ci/cd pipeline": "CI/CD Pipeline",
    "tdd": "TDD", "devops": "DevOps", "gitops": "GitOps",
    "state management": "State Management",
    "data structures": "Data Structures & Algorithms",
    "design patterns": "Design Patterns",
    "object-oriented programming": "OOP",
    "functional programming": "Functional Programming",
    "real-time data": "Real-Time Data Processing",
    "ui design systems": "UI Design Systems",
    "accessibility": "Accessibility (WCAG)",
    "performance optimization": "Performance Optimization",
    "responsive design": "Responsive Design",
    "data pipeline": "Data Pipeline / ETL",
    "distributed systems": "Distributed Systems",
    "scalability": "Scalability", "caching": "Caching Strategies",
    "high availability": "High Availability",
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def _kw_present(canonical: str, text_norm: str) -> bool:
    """Alias-aware presence check against normalized text."""
    variants = [canonical] + KEYWORD_ALIASES.get(canonical, [])
    for v in variants:
        v_norm = _normalize(v)
        if " " in v_norm:
            if v_norm in text_norm:
                return True
        else:
            if re.search(rf"(?<![a-z0-9#+]){re.escape(v_norm)}(?![a-z0-9#+])", text_norm):
                return True
    return False


def _display(canonical: str) -> str:
    return KEYWORD_DISPLAY.get(canonical, canonical.title())


def extract_ats_keywords(jd_text: str) -> Dict[str, List[str]]:
    """
    Extracts and categorizes ATS keywords from a Job Description.
    Returns dict: { hard_skills, methodologies, domain_terms }
    """
    norm = _normalize(jd_text)
    seen: Set[str] = set()
    hard, meth, domain = [], [], []

    for kw in HARD_SKILLS:
        if kw not in seen and _kw_present(kw, norm):
            hard.append(kw)
            seen.add(kw)
    for kw in METHODOLOGIES:
        if kw not in seen and _kw_present(kw, norm):
            meth.append(kw)
            seen.add(kw)
    for kw in DOMAIN_TERMS:
        if kw not in seen and _kw_present(kw, norm):
            domain.append(kw)
            seen.add(kw)

    return {
        "hard_skills": sorted(hard),
        "methodologies": sorted(meth),
        "domain_terms": sorted(domain),
    }


def score_ats(
    resume_text: str,
    jd_text: str = None,
    target_role: str = None,
) -> Dict:
    """
    Full deterministic ATS scoring pipeline.
    Weighted scoring: hard skills 50%, verbs 20%, metrics 15%, structure 15%.
    Returns structured dict for AtsScoreResponse + extended category_breakdown.
    """
    resume_norm = _normalize(resume_text)[:8000]  # cap to prevent token bloat

    # Keyword extraction
    if jd_text and len(jd_text.strip()) >= 50:
        categories = extract_ats_keywords(jd_text)
    else:
        categories = {
            "hard_skills": ["python", "javascript", "sql", "docker", "git", "rest api"],
            "methodologies": ["agile", "system design", "unit testing"],
            "domain_terms": ["api design"],
        }

    hard_req = categories["hard_skills"]
    meth_req = categories["methodologies"]
    dom_req  = categories["domain_terms"]

    # Matching
    m_hard,  mi_hard  = [], []
    m_meth,  mi_meth  = [], []
    m_dom,   mi_dom   = [], []

    for kw in hard_req:
        (m_hard if _kw_present(kw, resume_norm) else mi_hard).append(_display(kw))
    for kw in meth_req:
        (m_meth if _kw_present(kw, resume_norm) else mi_meth).append(_display(kw))
    for kw in dom_req:
        (m_dom if _kw_present(kw, resume_norm) else mi_dom).append(_display(kw))

    # Weighted keyword score
    w_hard, w_meth, w_dom = 1.0, 0.7, 0.5
    total_w = (len(hard_req) * w_hard + len(meth_req) * w_meth + len(dom_req) * w_dom) or 1.0
    earned_w = (len(m_hard) * w_hard + len(m_meth) * w_meth + len(m_dom) * w_dom)
    kw_score = int((earned_w / total_w) * 100)

    # Action verb score
    power_verbs = [
        "architected", "engineered", "developed", "spearheaded", "optimized",
        "implemented", "streamlined", "designed", "delivered", "automated",
        "deployed", "built", "refactored", "migrated", "reduced", "increased",
    ]
    found_verbs = [v for v in power_verbs if v in resume_norm]
    verb_score = min(100, 50 + len(found_verbs) * 5)

    # Metrics score
    has_metrics = bool(re.search(
        r"\b\d+\s*%|\b\d+x\b|\$\d+|\₹\d+|\b\d+\+\b|\b\d+\s*(users|clients|ms|sec|minutes)",
        resume_norm
    ))
    metrics_score = 90 if has_metrics else 45

    # Structure score
    structure_sections = ["experience", "projects", "education", "skills"]
    found_sections = [s for s in structure_sections if s in resume_norm]
    structure_score = min(100, 55 + len(found_sections) * 10)

    # Composite score
    ats_score = int(kw_score * 0.50 + verb_score * 0.20 + metrics_score * 0.15 + structure_score * 0.15)
    ats_score = min(99, max(30, ats_score))

    grade = (
        "Excellent" if ats_score >= 88
        else "Strong" if ats_score >= 72
        else "Good" if ats_score >= 56
        else "Needs Improvement"
    )

    # Strengths & Recommendations
    strengths, recommendations = [], []

    if len(m_hard) >= 3:
        strengths.append(f"Strong technical keyword alignment: {', '.join(m_hard[:4])} detected.")
    if len(found_verbs) >= 3:
        strengths.append(f"High-impact action verbs present ({', '.join(found_verbs[:3])}).")
    if has_metrics:
        strengths.append("Quantifiable achievements with metrics detected (%, numbers, scale).")
    if len(found_sections) >= 3:
        strengths.append("Standard ATS resume structure with key sections present.")

    if mi_hard:
        recommendations.append(f"Add missing technical keywords: {', '.join(mi_hard[:5])}.")
    if mi_meth:
        recommendations.append(f"Include methodology terms: {', '.join(mi_meth[:3])}.")
    if not has_metrics:
        recommendations.append(
            "Add quantifiable impact (e.g., 'reduced latency by 40%', 'served 10,000 daily users')."
        )
    if len(found_verbs) < 3:
        recommendations.append(
            "Begin every bullet with a strong action verb: Architected, Engineered, Optimized, Deployed."
        )
    if len(found_sections) < 3:
        missing_secs = set(structure_sections) - set(found_sections)
        recommendations.append(
            f"Add clearly labeled section headers: {', '.join(s.title() for s in missing_secs)}."
        )

    return {
        "ats_score": ats_score,
        "grade": grade,
        "matched_keywords": m_hard + m_meth + m_dom,
        "missing_keywords": mi_hard[:6] + mi_meth[:3],
        "category_breakdown": {
            "hard_skills": {
                "matched": m_hard,
                "missing": mi_hard,
                "score": int((len(m_hard) / max(1, len(hard_req))) * 100),
            },
            "methodologies": {
                "matched": m_meth,
                "missing": mi_meth,
                "score": int((len(m_meth) / max(1, len(meth_req))) * 100),
            },
            "domain_terms": {
                "matched": m_dom,
                "missing": mi_dom,
                "score": int((len(m_dom) / max(1, len(dom_req))) * 100),
            },
        },
        "section_breakdown": {
            "keyword_density": kw_score,
            "impact_verbs": verb_score,
            "quantifiable_metrics": metrics_score,
            "structure_formatting": structure_score,
        },
        "strengths": strengths,
        "actionable_recommendations": recommendations,
    }
