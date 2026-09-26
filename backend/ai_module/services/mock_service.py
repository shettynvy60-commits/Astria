import re
from typing import List, Dict, Any
from ai_module.models import (
    BulletExpansionResponse,
    SummaryGenerationResponse,
    SectionSuggestionResponse,
    SuggestedProject,
    GrammarFixResponse,
    AtsScoreResponse,
    VerbEnhanceResponse,
    VerbReplacement,
    JobMatchResponse,
    TailoredBullet,
    SkillGapResponse,
    TemplateRecommendationResponse,
    LengthOptimizeResponse,
)

class MockAIService:
    """
    Offline/Mock AI engine providing realistic, high-quality responses.
    Guarantees team members can run and test every single endpoint
    even without internet or a GEMINI_API_KEY.
    """

    @staticmethod
    def expand_bullets(raw_input: str, role: str = None, technologies: List[str] = None, num_bullets: int = 3) -> BulletExpansionResponse:
        tech_str = ", ".join(technologies) if technologies else "modern technologies and industry best practices"
        role_str = role if role else "technical project"

        templates = [
            f"Architected and deployed core features for {raw_input} utilizing {tech_str}, improving execution efficiency by 34%.",
            f"Collaborated within an Agile cross-functional team to design and optimize scalable solutions, cutting system latency by 25%.",
            f"Implemented automated testing pipelines and modular architecture for {raw_input}, achieving 95%+ test coverage and ensuring zero downtime.",
            f"Streamlined data processing workflows and API integration, reducing redundant query processing time by 40%."
        ]
        selected_bullets = templates[:max(2, min(num_bullets, len(templates)))]
        return BulletExpansionResponse(
            raw_input=raw_input,
            bullets=selected_bullets,
            power_keywords_used=["Architected", "Deployed", "Optimized", "Collaborated", "Streamlined"],
            source="mock"
        )

    @staticmethod
    def generate_summary(target_role: str, experience_level: str, skills: List[str], highlights: str = None) -> SummaryGenerationResponse:
        skills_str = ", ".join(skills[:5]) if skills else "software engineering, problem solving, and data structures"
        extra = f" Notable strength: {highlights}." if highlights else ""

        if experience_level.lower() in ["student", "fresher", "entry-level"]:
            summary = (
                f"Ambitious and detail-oriented {target_role} with a strong academic foundation in {skills_str}. "
                f"Proven track record in developing end-to-end full-stack applications and collaborative problem-solving.{extra} "
                f"Eager to contribute technical rigor and innovation to high-impact development teams."
            )
            objective = (
                f"Seeking an entry-level {target_role} position to leverage expertise in {skills_str} "
                f"while driving scalable software solutions in a fast-paced environment."
            )
        else:
            summary = (
                f"Results-driven {target_role} with practical experience engineering high-performance systems with {skills_str}. "
                f"Skilled at bridging technical requirements with business goals.{extra}"
            )
            objective = (
                f"To secure a challenging {target_role} role focused on architecting resilient, production-ready software solutions."
            )

        pitch = f"Technically agile {target_role} specializing in {skills_str}."

        return SummaryGenerationResponse(
            target_role=target_role,
            professional_summary=summary,
            career_objective=objective,
            short_pitch=pitch,
            source="mock"
        )

    @staticmethod
    def suggest_sections(field_or_branch: str, target_role: str) -> SectionSuggestionResponse:
        is_tech = any(k in field_or_branch.upper() for k in ["ISE", "CS", "CSE", "IT", "TECH", "SOFTWARE"])
        
        if is_tech:
            projects = [
                SuggestedProject(
                    title="Real-Time Collaborative Code Editor & Execution Platform",
                    tech_stack=["React", "Node.js", "WebSockets", "Docker", "Redis"],
                    description="Engineered a low-latency collaborative IDE supporting multi-user synchronization.",
                    sample_bullets=[
                        "Architected full-duplex WebSocket communication layer supporting 50+ concurrent users with <15ms sync latency.",
                        "Containerized code execution environment using Docker sandboxes to safely isolate user scripts."
                    ]
                ),
                SuggestedProject(
                    title="Distributed Task Queue & Background Job Processor",
                    tech_stack=["Python", "FastAPI", "Celery", "RabbitMQ", "PostgreSQL"],
                    description="Designed asynchronous worker cluster handling heavy background analytics workloads.",
                    sample_bullets=[
                        "Engineered fault-tolerant task dispatch system processing 10,000+ jobs/min with automatic exponential backoff retry.",
                        "Decreased endpoint turnaround time by 65% through offloading synchronous tasks to message broker."
                    ]
                )
            ]
            skills = {
                "Programming Languages": ["Python", "Java", "C++", "JavaScript", "TypeScript", "SQL"],
                "Frameworks & Libraries": ["FastAPI", "React", "Node.js", "Express", "TailwindCSS"],
                "Databases & Tools": ["PostgreSQL", "MongoDB", "Redis", "Docker", "Git", "GitHub Actions"],
                "Core Concepts": ["Data Structures & Algorithms", "REST APIs", "System Design", "Microservices"]
            }
            education = [
                "Relevant Coursework: Data Structures & Algorithms, Database Management Systems (DBMS), Operating Systems, Computer Networks.",
                "Academic Achievements: Capstone Project rated Top 5% in department; Active competitive programming participant."
            ]
            certs = [
                "AWS Certified Cloud Practitioner / Solutions Architect Associate",
                "Meta Front-End or Back-End Professional Certificate",
                "Google Cloud Digital Leader / Associate Cloud Engineer"
            ]
        else:
            projects = [
                SuggestedProject(
                    title="Market Penetration & Financial Feasibility Analysis",
                    tech_stack=["Excel", "PowerBI", "Python (Pandas)", "Financial Modeling"],
                    description="Evaluated expansion viability across 3 target verticals using predictive modeling.",
                    sample_bullets=[
                        "Formulated discounted cash flow (DCF) models forecasting 3-year ROI with 92% scenario confidence.",
                        "Synthesized stakeholder research into a comprehensive 20-page executive presentation."
                    ]
                )
            ]
            skills = {
                "Domain Expertise": ["Financial Modeling", "Market Research", "Agile Project Management", "KPI Tracking"],
                "Tools & Analytics": ["Excel (VLOOKUP, Pivot Tables)", "PowerBI", "Tableau", "Jira", "SQL"],
                "Soft Skills": ["Cross-functional Leadership", "Executive Presentation", "Negotiation", "Strategic Planning"]
            }
            education = [
                "Relevant Coursework: Strategic Management, Corporate Finance, Quantitative Analysis, Operations Research.",
                "Leadership: President / Active Member of College Management Association."
            ]
            certs = [
                "Project Management Professional (PMP) or CAPM",
                "Microsoft Office Specialist: Excel Expert",
                "Google Data Analytics Professional Certificate"
            ]

        return SectionSuggestionResponse(
            field_or_branch=field_or_branch,
            target_role=target_role,
            suggested_projects=projects,
            suggested_skills=skills,
            education_highlights=education,
            recommended_certifications=certs,
            source="mock"
        )

    @staticmethod
    def fix_grammar(text: str) -> GrammarFixResponse:
        weak_replacements = {
            r"\bdid coding\b": "developed software solutions",
            r"\bworked on\b": "engineered and maintained",
            r"\bhelped with\b": "spearheaded key aspects of",
            r"\bmade\b": "architected and launched",
            r"\bchecked\b": "validated and audited",
            r"\bgood at\b": "proficient in"
        }
        improved = text
        changes = []
        for pattern, repl in weak_replacements.items():
            if re.search(pattern, improved, flags=re.IGNORECASE):
                improved = re.sub(pattern, repl, improved, flags=re.IGNORECASE)
                changes.append(f"Replaced casual phrase '{pattern.replace('\\b', '')}' with professional action verb '{repl}'")

        if not changes:
            improved = f"Successfully {text[0].lower() + text[1:] if len(text) > 1 else text}"
            changes.append("Enhanced sentence momentum and active grammatical voice")

        return GrammarFixResponse(
            original_text=text,
            improved_text=improved,
            tone="Professional & Impact-Driven",
            improvements_made=changes,
            source="mock"
        )

    @staticmethod
    def enhance_verbs(text: str) -> VerbEnhanceResponse:
        verb_map = [
            ("did coding", "Engineered and optimized"),
            ("worked on", "Spearheaded development of"),
            ("responsible for", "Owned end-to-end execution of"),
            ("helped in", "Collaborated to deliver"),
            ("made website", "Architected responsive web application"),
            ("fixed bugs", "Diagnosed and resolved critical issues"),
            ("used", "Leveraged")
        ]
        replaced = []
        enhanced = text
        for old, new in verb_map:
            if old in enhanced.lower():
                enhanced = re.sub(re.escape(old), new, enhanced, flags=re.IGNORECASE)
                replaced.append(VerbReplacement(original=old, replacement=new))

        if not replaced:
            enhanced = "Spearheaded: " + text
            replaced.append(VerbReplacement(original="passive phrasing", replacement="Spearheaded (Action Verb)"))

        return VerbEnhanceResponse(
            original_text=text,
            enhanced_text=enhanced,
            verbs_replaced=replaced,
            source="mock"
        )

    @staticmethod
    def score_ats(resume_text: str, job_description: str = None, target_role: str = None) -> AtsScoreResponse:
        text_lower = resume_text.lower()
        word_count = len(resume_text.split())

        score = 70
        strengths = []
        recommendations = []
        matched = []
        missing = []

        # Check essential resume sections
        sections = ["experience", "projects", "education", "skills"]
        present_sections = [s for s in sections if s in text_lower]
        if len(present_sections) == len(sections):
            score += 10
            strengths.append("Contains all essential ATS sections (Experience, Projects, Education, Skills).")
        else:
            missing_secs = set(sections) - set(present_sections)
            recommendations.append(f"Explicitly add standard header titles for: {', '.join(missing_secs).title()}.")

        # Check action verbs
        power_verbs = ["architected", "engineered", "developed", "spearheaded", "optimized", "implemented", "streamlined", "designed"]
        found_verbs = [v for v in power_verbs if v in text_lower]
        if len(found_verbs) >= 3:
            score += 10
            strengths.append(f"Strong action verbs detected ({', '.join(found_verbs[:3])}).")
        else:
            recommendations.append("Begin every bullet point with a high-impact action verb (e.g., 'Architected', 'Spearheaded').")

        # Check metrics / quantification
        has_metrics = bool(re.search(r"\b\d+%(?:\s|$)|(?:\$|\₹)\d+|\b\d+\+\b|\b\d+\s*(?:users|clients|ms|seconds|times)", resume_text))
        if has_metrics:
            score += 10
            strengths.append("Includes quantifiable metrics and data-driven impact (%, numbers, timelines).")
        else:
            recommendations.append("Quantify achievements with measurable metrics (e.g., 'reduced latency by 30%', 'serving 500+ daily users').")

        # JD matching if present
        if job_description:
            jd_keywords = ["python", "react", "sql", "api", "docker", "cloud", "aws", "git", "ci/cd", "fastapi", "agile", "testing"]
            for kw in jd_keywords:
                if kw in job_description.lower():
                    if kw in text_lower:
                        matched.append(kw.upper())
                    else:
                        missing.append(kw.upper())
            if missing:
                recommendations.append(f"Incorporate missing target job keywords: {', '.join(missing[:5])}.")
        else:
            common_tech = ["GIT", "REST API", "SQL", "DOCKER", "UNIT TESTING"]
            for kw in common_tech:
                if kw.lower() in text_lower:
                    matched.append(kw)
                else:
                    missing.append(kw)

        score = min(98, max(45, score))
        grade = "Excellent" if score >= 88 else "Strong" if score >= 75 else "Good" if score >= 60 else "Needs Improvement"

        breakdown = {
            "impact_verbs": 85 if len(found_verbs) >= 2 else 60,
            "keyword_density": 80 if len(matched) >= 3 else 65,
            "structure_formatting": 92 if len(present_sections) >= 3 else 60,
            "quantifiable_metrics": 90 if has_metrics else 50
        }

        return AtsScoreResponse(
            overall_score=score,
            grade=grade,
            section_breakdown=breakdown,
            missing_critical_keywords=missing[:6],
            matched_keywords=matched[:8],
            strengths=strengths,
            actionable_recommendations=recommendations,
            source="mock"
        )

    @staticmethod
    def match_job(resume_text: str, job_description: str) -> JobMatchResponse:
        resume_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", resume_text.lower()))
        jd_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", job_description.lower()))

        tech_vocab = {
            "python", "javascript", "typescript", "react", "fastapi", "docker", "kubernetes",
            "sql", "postgresql", "mongodb", "aws", "gcp", "azure", "git", "rest", "graphql",
            "microservices", "redis", "ci/cd", "linux", "agile", "scrum", "algorithms"
        }

        jd_tech = jd_words.intersection(tech_vocab)
        matched = list(jd_tech.intersection(resume_words))
        missing = list(jd_tech - resume_words)

        overlap = len(matched)
        total = max(1, len(jd_tech))
        pct = min(95, max(35, int((overlap / total) * 100)))

        level = "High Match" if pct >= 75 else "Moderate Match" if pct >= 50 else "Low Match"

        suggestions = []
        if missing:
            suggestions.append(TailoredBullet(
                original_area="Technical Projects",
                suggested_tailored_bullet=f"Integrated {missing[0].upper()} into project architecture, streamlining workflows and aligning with {', '.join(missing[:3]).upper()} requirements.",
                reason=f"Target job explicitly asks for {missing[0].upper()}."
            ))
        suggestions.append(TailoredBullet(
            original_area="Professional Summary",
            suggested_tailored_bullet=f"Proficient developer adept at delivering high-performance solutions using {', '.join(matched[:3]).title() if matched else 'modern tools'}.",
            reason="Reinforces high-priority skills found in job posting."
        ))

        summary_tailored = (
            f"Dedicated engineer equipped with demonstrated competencies in {', '.join((matched + missing)[:4]).title()}. "
            f"Directly aligned with core responsibilities outlined in target job posting."
        )

        return JobMatchResponse(
            match_percentage=pct,
            compatibility_level=level,
            matched_skills_and_keywords=[m.upper() for m in matched],
            missing_skills_and_keywords=[m.upper() for m in missing],
            tailored_bullet_suggestions=suggestions,
            tailored_summary_suggestion=summary_tailored,
            source="mock"
        )

    @staticmethod
    def analyze_skill_gaps(current_skills: List[str], target_role: str, jd: str = None) -> SkillGapResponse:
        current_lower = {s.lower() for s in current_skills}
        role_skills_map = {
            "backend": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "Kafka", "CI/CD"],
            "frontend": ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux", "Jest", "WebSockets"],
            "full stack": ["React", "Node.js", "Python", "SQL", "Docker", "AWS", "Git"],
            "data": ["Python", "SQL", "Pandas", "PySpark", "Tableau", "Machine Learning", "Airflow"],
            "devops": ["Docker", "Kubernetes", "Terraform", "CI/CD", "AWS", "Linux", "Prometheus"]
        }
        
        target_key = "full stack"
        for k in role_skills_map:
            if k in target_role.lower():
                target_key = k
                break

        ideal_skills = role_skills_map[target_key]
        strong_matches = [s for s in ideal_skills if s.lower() in current_lower]
        missing = [s for s in ideal_skills if s.lower() not in current_lower]

        return SkillGapResponse(
            target_role=target_role,
            strong_matches=strong_matches,
            critical_missing_skills=missing[:4],
            recommended_courses_or_topics=[f"Mastering {m} in Production" for m in missing[:3]],
            source="mock"
        )

    @staticmethod
    def recommend_template(branch: str, target_role: str, years_exp: int = 0) -> TemplateRecommendationResponse:
        branch_upper = branch.upper()
        if any(b in branch_upper for b in ["ISE", "CS", "CSE", "IT", "TECH", "SOFTWARE"]):
            return TemplateRecommendationResponse(
                recommended_template_id="ats_clean_tech",
                template_name="Tech Minimalist (ATS Optimized)",
                layout_type="Single-Column ATS Standard",
                recommended_fonts=["Inter", "Roboto", "Calibri", "Fira Code (for Tech Stack)"],
                color_palette_advice="Monochrome with deep navy accent (#0F172A). Avoid complex tables or multi-column grids that confuse ATS parsers.",
                why_recommended="Engineering recruiters and ATS screeners scan top-to-bottom for GitHub links, tech stack badges, and quantifiable bullets.",
                branch_specific_tips=[
                    "Place 'Technical Skills' immediately below Contact Information or Summary.",
                    "Include live GitHub and deployed project URLs for top 2 projects.",
                    "Strictly adhere to the 1-page rule for undergraduates/ISE/CSE students."
                ],
                source="mock"
            )
        elif any(b in branch_upper for b in ["MBA", "MANAGEMENT", "BUSINESS", "FINANCE"]):
            return TemplateRecommendationResponse(
                recommended_template_id="executive_classic",
                template_name="Executive Elegance",
                layout_type="Structured Header with Classic Flow",
                recommended_fonts=["Garamond", "Georgia", "Merriweather"],
                color_palette_advice="Charcoal (#1F2937) with subtle slate accents. Clean horizontal divider rules.",
                why_recommended="Business and consulting roles favor traditional serif typography highlighting leadership, budget oversight, and metrics.",
                branch_specific_tips=[
                    "Highlight leadership roles, societies, and case competitions prominently.",
                    "Ensure every bullet contains business metrics (ROI, percentage revenue uplift, cost savings).",
                    "Keep certifications and credentials right under Education."
                ],
                source="mock"
            )
        else:
            return TemplateRecommendationResponse(
                recommended_template_id="modern_universal",
                template_name="Modern Professional",
                layout_type="Single Column with Defined Section Badges",
                recommended_fonts=["Arial", "Helvetica", "Open Sans"],
                color_palette_advice="Clean dark charcoal with emerald or royal blue headers.",
                why_recommended="Universal ATS compliance with modern visual balance, compatible with all automated parsing systems.",
                branch_specific_tips=[
                    "Keep section headings standard: Summary, Education, Experience, Projects, Skills.",
                    "Do not use text inside graphics or images, as ATS cannot parse them."
                ],
                source="mock"
            )

    @staticmethod
    def optimize_length(resume_text: str, target_pages: int = 1) -> LengthOptimizeResponse:
        words = len(resume_text.split())
        est_pages = round(words / 450.0, 2)
        is_compliant = words <= 520

        suggestions = []
        if words > 520:
            verdict = f"Over 1 page (~{est_pages} pages). Needs trimming to satisfy recruiter guidelines."
            suggestions = [
                "Trim bullet points down to 1-2 lines each (under 25 words per bullet).",
                "Remove high school details if you are already in 2nd year or above.",
                "Consolidate similar skills (e.g. merge 'HTML, CSS' into 'Frontend Web Technologies').",
                "Limit project section to your 2-3 most substantial and relevant projects."
            ]
        elif words < 250:
            verdict = "Resume is sparse (~0.5 page). Add technical depth to fill 1 full page."
            suggestions = [
                "Expand project bullets to describe architecture, challenges overcome, and results.",
                "Add a 'Key Coursework' or 'Certifications' section.",
                "Detail your technical stack and libraries used for each project."
            ]
        else:
            verdict = "Optimal 1-page density! Standard for students and early-career applicants."
            suggestions = [
                "Spacing is well-balanced. Ensure 0.5 - 0.75 inch margins throughout.",
                "Maintain consistent bullet point indentation."
            ]

        tips = [
            "Use standard 10pt - 11.5pt body font size and 14pt - 16pt for section headings.",
            "Keep line spacing between 1.1x and 1.25x for maximum readability.",
            "Never use 2 pages unless you have 5+ years of verified professional industry experience."
        ]

        return LengthOptimizeResponse(
            estimated_word_count=words,
            estimated_pages=est_pages,
            is_one_page_compliant=is_compliant,
            verdict=verdict,
            trimming_suggestions=suggestions,
            spacing_and_layout_tips=tips,
            source="mock"
        )
