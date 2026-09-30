import logging
from typing import Dict, Any, List
from ai_module.services.gemini_client import gemini_client
from ai_module.services.mock_service import MockAIService
from ai_module.models import (
    BulletExpansionRequest, BulletExpansionResponse,
    SummaryGenerationRequest, SummaryGenerationResponse,
    SectionSuggestionRequest, SectionSuggestionResponse, SuggestedProject,
    GrammarFixRequest, GrammarFixResponse,
    AtsScoreRequest, AtsScoreResponse,
    VerbEnhanceRequest, VerbEnhanceResponse, VerbReplacement,
    JobMatchRequest, JobMatchResponse, TailoredBullet,
    SkillGapRequest, SkillGapResponse,
    TemplateRecommendationRequest, TemplateRecommendationResponse,
    LengthOptimizeRequest, LengthOptimizeResponse
)

logger = logging.getLogger("ai_orchestrator")

# ---------------------------------------------------------------------------
# Skill sanitizer — mirrors backend NOISE_WORD_BLACKLIST in match_engine.py.
# Applied as a final guardrail on any LLM-produced skill list to prevent
# document section headers, company names, or generic English words from
# being returned as "missing skills" to the frontend.
# ---------------------------------------------------------------------------
_SKILL_SANITIZER_BLOCKLIST = {
    # Document metadata headers
    "role", "company", "job", "description", "target", "overview",
    "about", "position", "status", "candidate", "team", "work",
    "summary", "location", "masterclass",
    # Company names
    "cloudpulse", "accenture", "infosys", "wipro", "tcs",
    "google", "amazon", "microsoft", "meta", "apple",
    "netflix", "uber", "airbnb", "stripe",
    # JD boilerplate
    "qualifications", "responsibilities", "requirements",
    "preferred", "benefits", "the role", "your role",
    # Seniority / titles
    "senior", "junior", "lead", "principal", "staff", "associate", "intern",
    "manager", "director", "architect", "engineer", "developer", "programmer",
    "analyst", "specialist", "consultant", "contractor", "generalist",
    # Soft skills / fluff
    "strong", "proficient", "familiarity", "knowledge", "understanding",
    "excellent", "good", "hands-on", "proven", "solid", "deep", "exposure",
    "ability", "passion", "motivated", "collaborative", "communication",
    "interpersonal", "leadership", "ownership", "detail", "analytical",
    "creative", "critical thinking", "problem solving", "problem-solving",
    # Experience / years
    "years", "year", "experience", "minimum",
    # Work arrangement
    "hybrid", "remote", "onsite", "on-site", "full-time", "part-time",
    "contract", "permanent", "freelance",
    # Compensation / education
    "salary", "compensation", "equity", "bonus", "degree", "bachelor",
    "master", "phd", "btech", "mtech",
    # Generic English stop words
    "and", "or", "the", "of", "in", "with", "for", "to", "a", "an",
    "is", "be", "at", "by", "we", "as", "on", "it", "if", "no", "so",
    "etc", "such as", "e.g", "i.e",
}


def _sanitize_skill_list(extracted_skills: list) -> list:
    """
    Strips non-technical metadata words from an LLM-produced skill list.
    Ensures the returned list contains ONLY real technical skill entities.

    Rules applied:
    - Skip if normalized token is in the metadata blocklist
    - Skip if token is purely numeric (e.g. "5", "10+")
    - Skip if token is shorter than 2 characters
    - Preserve original casing of legitimate skill names
    """
    cleaned = []
    for skill in extracted_skills:
        if not isinstance(skill, str):
            continue
        normalized = skill.strip().lower()
        if not normalized:
            continue
        if normalized in _SKILL_SANITIZER_BLOCKLIST:
            continue
        if normalized.isnumeric():
            continue
        if len(normalized) < 2:
            continue
        cleaned.append(skill.strip())
    return cleaned



class AIOrchestrator:
    """
    Coordinates between Live Gemini 3.8 Flash API and Offline Mock Service.
    Ensures 100% reliability, zero downtime, and robust fallback for teammates.
    """

    # ------------------------------------------------------------
    # 1. CONTENT GENERATION
    # ------------------------------------------------------------

    def expand_bullets(self, req: BulletExpansionRequest) -> BulletExpansionResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are an elite Tech Career Coach and Executive Resume Writer. "
                    "Convert raw student/candidate notes into compelling, high-impact resume bullet points. "
                    "Follow the STAR methodology (Situation, Task, Action, Result). "
                    "Begin every bullet with a strong past-tense action verb (e.g., Architected, Spearheaded, Engineered). "
                    "Include realistic metrics, quantifiable achievements, and technical rigor."
                )
                prompt = f"""
                Expand this raw input into {req.num_bullets} professional resume bullet points.
                Raw Input: "{req.raw_input}"
                Job Title / Context: "{req.role_or_title or 'General Project/Role'}"
                Technologies used: {', '.join(req.technologies) if req.technologies else 'Relevant industry tools'}

                Return JSON matching this exact structure:
                {{
                    "bullets": ["Bullet 1 with metrics...", "Bullet 2 with impact...", "Bullet 3..."],
                    "power_keywords_used": ["Architected", "Optimized", "Docker", "FastAPI"]
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                return BulletExpansionResponse(
                    raw_input=req.raw_input,
                    bullets=data.get("bullets", []),
                    power_keywords_used=data.get("power_keywords_used", []),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini expansion failed, falling back to mock: {e}")

        return MockAIService.expand_bullets(
            raw_input=req.raw_input,
            role=req.role_or_title,
            technologies=req.technologies,
            num_bullets=req.num_bullets
        )

    def generate_summary(self, req: SummaryGenerationRequest) -> SummaryGenerationResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are a professional resume consultant. Generate sharp, engaging, ATS-optimized "
                    "professional summaries and career objectives tailored to candidates and students."
                )
                prompt = f"""
                Create a professional summary and career objective for:
                Target Role: {req.target_role}
                Experience Level: {req.experience_level}
                Skills: {', '.join(req.skills)}
                Key Highlights / Projects: {req.key_highlights or 'Strong project portfolio and academic excellence'}

                Return JSON with this exact structure:
                {{
                    "professional_summary": "2-3 punchy, ATS-friendly sentences emphasizing technical acumen and value.",
                    "career_objective": "1-2 targeted objective sentences ideal for entry-level applications.",
                    "short_pitch": "A 1-sentence elevator pitch."
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                return SummaryGenerationResponse(
                    target_role=req.target_role,
                    professional_summary=data.get("professional_summary", ""),
                    career_objective=data.get("career_objective", ""),
                    short_pitch=data.get("short_pitch", ""),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini summary generation failed: {e}")

        return MockAIService.generate_summary(
            target_role=req.target_role,
            experience_level=req.experience_level,
            skills=req.skills,
            highlights=req.key_highlights
        )

    def suggest_sections(self, req: SectionSuggestionRequest) -> SectionSuggestionResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are an academic and engineering career counselor. Provide customized section "
                    "blueprints for students so they never face a blank resume page."
                )
                prompt = f"""
                Provide tailored resume section recommendations for:
                Branch / Field: {req.field_or_branch}
                Target Role: {req.target_role}

                Return JSON matching this exact structure:
                {{
                    "suggested_projects": [
                        {{
                            "title": "Project Title",
                            "tech_stack": ["Tech1", "Tech2"],
                            "description": "Short overview",
                            "sample_bullets": ["Bullet 1 with impact...", "Bullet 2..."]
                        }}
                    ],
                    "suggested_skills": {{
                        "Languages": ["Python", "C++"],
                        "Frameworks & Tools": ["FastAPI", "Docker"],
                        "Core Competencies": ["System Design", "Algorithms"]
                    }},
                    "education_highlights": ["Relevant Coursework: ...", "Academic Achievement: ..."],
                    "recommended_certifications": ["Cert 1", "Cert 2"]
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                projects = [SuggestedProject(**p) for p in data.get("suggested_projects", [])]
                return SectionSuggestionResponse(
                    field_or_branch=req.field_or_branch,
                    target_role=req.target_role,
                    suggested_projects=projects,
                    suggested_skills=data.get("suggested_skills", {}),
                    education_highlights=data.get("education_highlights", []),
                    recommended_certifications=data.get("recommended_certifications", []),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini section suggestion failed: {e}")

        return MockAIService.suggest_sections(
            field_or_branch=req.field_or_branch,
            target_role=req.target_role
        )

    # ------------------------------------------------------------
    # 2. ATS & GRAMMAR FIX
    # ------------------------------------------------------------

    def fix_grammar(self, req: GrammarFixRequest) -> GrammarFixResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are a professional resume editor. Polish grammar, eliminate spelling mistakes, "
                    "convert passive phrasing into active voice, and enhance business and technical tone."
                )
                prompt = f"""
                Proofread and enhance the following resume text:
                "{req.text}"

                Return JSON with this exact structure:
                {{
                    "improved_text": "Polished text with strong grammar and active verbs",
                    "tone": "Professional & Impactful",
                    "improvements_made": ["Corrected subject-verb agreement", "Replaced weak phrasing with active verbs"]
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                return GrammarFixResponse(
                    original_text=req.text,
                    improved_text=data.get("improved_text", req.text),
                    tone=data.get("tone", "Professional"),
                    improvements_made=data.get("improvements_made", []),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini grammar fix failed: {e}")

        return MockAIService.fix_grammar(req.text)

    def enhance_verbs(self, req: VerbEnhanceRequest) -> VerbEnhanceResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are an ATS resume optimizer specializing in action verbs. "
                    "Detect weak, vague, or passive verbs (e.g. 'did', 'handled', 'responsible for', 'worked on') "
                    "and replace them with high-powered action verbs (e.g. 'Architected', 'Spearheaded', 'Engineered', 'Optimized')."
                )
                prompt = f"""
                Upgrade the action verbs in this resume sentence:
                "{req.text}"

                Return JSON with this exact structure:
                {{
                    "enhanced_text": "The rewritten sentence with strong action verbs",
                    "verbs_replaced": [
                        {{"original": "did coding", "replacement": "Architected and implemented"}}
                    ]
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                replacements = [VerbReplacement(**v) for v in data.get("verbs_replaced", [])]
                return VerbEnhanceResponse(
                    original_text=req.text,
                    enhanced_text=data.get("enhanced_text", req.text),
                    verbs_replaced=replacements,
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini verb enhance failed: {e}")

        return MockAIService.enhance_verbs(req.text)

    def score_ats(self, req: AtsScoreRequest) -> AtsScoreResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are an enterprise Applicant Tracking System (ATS) parser algorithm and recruiter screening tool. "
                    "Analyze the resume for structural completeness, action verb density, measurable metrics, and keyword alignment. "
                    "Calculate an objective ATS score between 0 and 100."
                )
                prompt = f"""
                Evaluate this resume:
                ---
                {req.resume_text}
                ---
                Target Job Description / Role:
                {req.job_description or req.target_role or 'General Software & Technical Roles'}

                Return JSON matching this exact structure:
                {{
                    "overall_score": 85,
                    "grade": "Strong",
                    "section_breakdown": {{
                        "impact_verbs": 80,
                        "keyword_density": 85,
                        "structure_formatting": 90,
                        "quantifiable_metrics": 75
                    }},
                    "missing_critical_keywords": ["DOCKER", "CI/CD", "UNIT TESTING"],
                    "matched_keywords": ["PYTHON", "FASTAPI", "SQL", "GIT"],
                    "strengths": ["Clear project descriptions with measurable outcomes", "Strong technical skills grouping"],
                    "actionable_recommendations": [
                        "Add quantifiable metrics to bullet point #2 in the project section",
                        "Include Docker and CI/CD tools to align with backend roles"
                    ]
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                return AtsScoreResponse(
                    overall_score=int(data.get("overall_score", 75)),
                    grade=data.get("grade", "Strong"),
                    section_breakdown=data.get("section_breakdown", {}),
                    missing_critical_keywords=data.get("missing_critical_keywords", []),
                    matched_keywords=data.get("matched_keywords", []),
                    strengths=data.get("strengths", []),
                    actionable_recommendations=data.get("actionable_recommendations", []),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini ATS scoring failed: {e}")

        return MockAIService.score_ats(
            resume_text=req.resume_text,
            job_description=req.job_description,
            target_role=req.target_role
        )

    # ------------------------------------------------------------
    # 3. SMART CUSTOMIZATION
    # ------------------------------------------------------------

    def match_job(self, req: JobMatchRequest) -> JobMatchResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are a recruiter and ATS alignment expert. Compare candidate resume against job description. "
                    "Determine match percentage, extract missing keywords, and suggest tailored bullet points."
                )
                prompt = f"""
                Match Resume against Job Description:
                RESUME:
                {req.resume_text}

                JOB DESCRIPTION:
                {req.job_description}

                Return JSON matching this exact structure:
                {{
                    "match_percentage": 78,
                    "compatibility_level": "High Match",
                    "matched_skills_and_keywords": ["Python", "FastAPI", "PostgreSQL"],
                    "missing_skills_and_keywords": ["Redis", "Kubernetes", "AWS Lambda"],
                    "tailored_bullet_suggestions": [
                        {{
                            "original_area": "Backend Project",
                            "suggested_tailored_bullet": "Tailored bullet highlighting requested JD skills...",
                            "reason": "Directly targets JD requirement for distributed caching"
                        }}
                    ],
                    "tailored_summary_suggestion": "Personalized 2-sentence summary tailored to this specific JD."
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                bullets = [TailoredBullet(**b) for b in data.get("tailored_bullet_suggestions", [])]
                return JobMatchResponse(
                    match_percentage=int(data.get("match_percentage", 70)),
                    compatibility_level=data.get("compatibility_level", "Moderate Match"),
                    matched_skills_and_keywords=data.get("matched_skills_and_keywords", []),
                    missing_skills_and_keywords=data.get("missing_skills_and_keywords", []),
                    tailored_bullet_suggestions=bullets,
                    tailored_summary_suggestion=data.get("tailored_summary_suggestion", ""),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini job match failed: {e}")

        return MockAIService.match_job(req.resume_text, req.job_description)

    def analyze_skill_gaps(self, req: SkillGapRequest) -> SkillGapResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are a senior engineering career mentor specializing in technical skill gap analysis. "
                    "Your task is to compare a candidate's existing skills against the role requirements and "
                    "identify strictly technical gaps.\n\n"
                    "CRITICAL EXTRACTION RULES — you MUST follow these exactly:\n"
                    "1. Extract ONLY hard technical skills: programming languages, frameworks, libraries, "
                    "   developer tools, cloud platforms, databases, protocols, and official methodologies.\n"
                    "2. DO NOT extract document section headers (e.g., 'Role', 'Company', 'Job Description', "
                    "   'Requirements', 'Target', 'Overview', 'Description').\n"
                    "3. DO NOT extract company names or brand names (e.g., 'Cloudpulse', 'Google', 'Amazon').\n"
                    "4. DO NOT extract job titles or seniority levels (e.g., 'Full Stack Developer', "
                    "   'Senior Engineer', 'Lead').\n"
                    "5. DO NOT extract generic English words, filler phrases, or soft skills "
                    "   (e.g., 'Responsibilities', 'Candidate', 'Ability', 'Strong', 'Experience', "
                    "   'Years', 'Team', 'Work', 'Status', 'Masterclass').\n"
                    "6. Each item in missing_skills must be a real, specific, named technical skill "
                    "   that a developer can learn and demonstrate."
                )
                prompt = f"""
                Evaluate skill gap for this candidate:
                Target Role: {req.target_role}
                Current Skills: {', '.join(req.current_skills)}
                Job Description Context: {req.job_description or 'Standard industry benchmark for this role'}

                Return JSON with ONLY technical skills in this exact structure:
                {{
                    "strong_matches": ["Python", "FastAPI", "PostgreSQL"],
                    "critical_missing_skills": ["Kubernetes", "Redis", "TypeScript"],
                    "recommended_courses_or_topics": ["Topic or course 1", "Topic or course 2"]
                }}

                IMPORTANT: Every item in the arrays must be a specific named technology or tool.
                Never include: section headers, company names, years of experience,
                work arrangement terms, or generic adjectives.
                """
                data = gemini_client.generate_json(prompt, system_instruction)

                # Post-filter: sanitize LLM output to strip any residual metadata words
                sanitized_missing = _sanitize_skill_list(data.get("critical_missing_skills", []))
                sanitized_matches = _sanitize_skill_list(data.get("strong_matches", []))

                return SkillGapResponse(
                    target_role=req.target_role,
                    strong_matches=sanitized_matches,
                    critical_missing_skills=sanitized_missing,
                    recommended_courses_or_topics=data.get("recommended_courses_or_topics", []),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini skill gap analysis failed: {e}")

        return MockAIService.analyze_skill_gaps(req.current_skills, req.target_role, req.job_description)

    # ------------------------------------------------------------
    # 4. DESIGN & FORMATTING GUIDANCE
    # ------------------------------------------------------------

    def recommend_template(self, req: TemplateRecommendationRequest) -> TemplateRecommendationResponse:
        if gemini_client.is_available:
            try:
                system_instruction = (
                    "You are a recruiter and resume typography/layout design expert. Recommend the optimal resume "
                    "template, layout type, fonts, and styling based on candidate branch and industry norms."
                )
                prompt = f"""
                Recommend resume layout for:
                Branch/Domain: {req.branch_or_domain}
                Target Role: {req.target_role}
                Years of Experience: {req.years_of_experience}

                Return JSON with this exact structure:
                {{
                    "recommended_template_id": "ats_clean_tech",
                    "template_name": "Tech Minimalist (ATS Optimized)",
                    "layout_type": "Single-Column ATS Standard",
                    "recommended_fonts": ["Inter", "Calibri"],
                    "color_palette_advice": "Monochrome slate with navy accents",
                    "why_recommended": "ATS scanners and tech hiring managers prioritize clear hierarchical layout and fast readability.",
                    "branch_specific_tips": ["Tip 1", "Tip 2"]
                }}
                """
                data = gemini_client.generate_json(prompt, system_instruction)
                return TemplateRecommendationResponse(
                    recommended_template_id=data.get("recommended_template_id", "ats_clean_tech"),
                    template_name=data.get("template_name", "Tech Minimalist"),
                    layout_type=data.get("layout_type", "Single Column"),
                    recommended_fonts=data.get("recommended_fonts", ["Inter", "Calibri"]),
                    color_palette_advice=data.get("color_palette_advice", "Monochrome Slate"),
                    why_recommended=data.get("why_recommended", "High ATS compatibility"),
                    branch_specific_tips=data.get("branch_specific_tips", []),
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini template recommendation failed: {e}")

        return MockAIService.recommend_template(req.branch_or_domain, req.target_role, req.years_of_experience)

    def optimize_length(self, req: LengthOptimizeRequest) -> LengthOptimizeResponse:
        return MockAIService.optimize_length(req.resume_text, req.target_pages)

ai_orchestrator = AIOrchestrator()
