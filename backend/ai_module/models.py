from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ============================================================
# 1. CONTENT GENERATION MODELS
# ============================================================

class BulletExpansionRequest(BaseModel):
    raw_input: str = Field(..., description="Short note or phrase, e.g., 'internship at Infosys' or 'built weather app'")
    role_or_title: Optional[str] = Field(None, description="Job title, e.g., 'Software Engineering Intern'")
    technologies: Optional[List[str]] = Field(default_factory=list, description="Technologies or tools used, e.g., ['React', 'Node.js', 'PostgreSQL']")
    num_bullets: Optional[int] = Field(3, description="Number of bullet points to generate (2 to 5)")

class BulletExpansionResponse(BaseModel):
    raw_input: str
    bullets: List[str] = Field(..., description="Action-oriented, STAR-format bullet points with quantifiable impact")
    power_keywords_used: List[str] = Field(default_factory=list, description="Strong keywords and verbs incorporated")
    source: str = Field(..., description="'gemini' or 'mock'")


class SummaryGenerationRequest(BaseModel):
    target_role: str = Field(..., description="Target job title, e.g., 'Full Stack Web Developer'")
    experience_level: str = Field(default="student", description="'student', 'entry-level', 'mid-level', 'experienced'")
    skills: List[str] = Field(..., description="List of top skills, e.g., ['Python', 'SQL', 'FastAPI', 'Git']")
    key_highlights: Optional[str] = Field(None, description="Optional extra details or proudest achievement")

class SummaryGenerationResponse(BaseModel):
    target_role: str
    professional_summary: str = Field(..., description="Polished 2-3 sentence summary highlighting technical strengths")
    career_objective: str = Field(..., description="Targeted objective statement ideal for students/graduates")
    short_pitch: str = Field(..., description="1-sentence elevator pitch")
    source: str


class SectionSuggestionRequest(BaseModel):
    field_or_branch: str = Field(..., description="Engineering branch or discipline, e.g., 'ISE / CSE', 'ECE', 'MBA', 'Data Science'")
    target_role: str = Field(..., description="Role user is targeting, e.g., 'Backend Engineer', 'Product Manager'")

class SuggestedProject(BaseModel):
    title: str
    tech_stack: List[str]
    description: str
    sample_bullets: List[str]

class SectionSuggestionResponse(BaseModel):
    field_or_branch: str
    target_role: str
    suggested_projects: List[SuggestedProject]
    suggested_skills: Dict[str, List[str]]
    education_highlights: List[str]
    recommended_certifications: List[str]
    source: str


# ============================================================
# 2. ATS & GRAMMAR FIX MODELS
# ============================================================

class GrammarFixRequest(BaseModel):
    text: str = Field(..., description="Resume bullet point, summary, or paragraph to fix and professionalize")

class GrammarFixResponse(BaseModel):
    original_text: str
    improved_text: str = Field(..., description="Grammatically clean, active-voice, professional version")
    tone: str = Field(default="Professional & Action-Oriented")
    improvements_made: List[str] = Field(default_factory=list, description="Specific enhancements applied")
    source: str


class AtsScoreRequest(BaseModel):
    resume_text: str = Field(..., description="Full text or sections of the candidate's resume")
    job_description: Optional[str] = Field(None, description="Optional target job description to measure alignment against")
    target_role: Optional[str] = Field(None, description="Optional target role if JD is not provided")

class AtsScoreResponse(BaseModel):
    overall_score: int = Field(..., description="ATS compatibility score from 0 to 100")
    grade: str = Field(..., description="'Needs Improvement', 'Good', 'Strong', 'Excellent'")
    section_breakdown: Dict[str, int] = Field(..., description="Scores for Impact Verbs, Keywords, Readability, Structure")
    missing_critical_keywords: List[str] = Field(default_factory=list, description="Keywords missing that ATS looks for")
    matched_keywords: List[str] = Field(default_factory=list, description="Keywords already present")
    strengths: List[str] = Field(default_factory=list)
    actionable_recommendations: List[str] = Field(default_factory=list)
    source: str


class VerbEnhanceRequest(BaseModel):
    text: str = Field(..., description="Draft bullet point with weak/passive verbs, e.g., 'did coding for the website'")

class VerbReplacement(BaseModel):
    original: str
    replacement: str

class VerbEnhanceResponse(BaseModel):
    original_text: str
    enhanced_text: str
    verbs_replaced: List[VerbReplacement] = Field(default_factory=list)
    source: str


# ============================================================
# 3. SMART CUSTOMIZATION & JOB MATCH MODELS
# ============================================================

class JobMatchRequest(BaseModel):
    resume_text: str = Field(..., description="Candidate's current resume text")
    job_description: str = Field(..., description="Target job description posted by employer")

class TailoredBullet(BaseModel):
    original_area: str
    suggested_tailored_bullet: str
    reason: str

class JobMatchResponse(BaseModel):
    match_percentage: int = Field(..., description="Match percentage 0-100")
    compatibility_level: str = Field(..., description="'High Match', 'Moderate Match', 'Low Match'")
    matched_skills_and_keywords: List[str]
    missing_skills_and_keywords: List[str]
    tailored_bullet_suggestions: List[TailoredBullet]
    tailored_summary_suggestion: str
    source: str


class SkillGapRequest(BaseModel):
    current_skills: List[str] = Field(..., description="Skills currently possessed by the candidate")
    target_role: str = Field(..., description="Role they are aspiring for")
    job_description: Optional[str] = Field(None, description="Optional specific job description")

class SkillGapResponse(BaseModel):
    target_role: str
    strong_matches: List[str]
    critical_missing_skills: List[str]
    recommended_courses_or_topics: List[str]
    source: str


# ============================================================
# 4. DESIGN & FORMATTING GUIDANCE MODELS
# ============================================================

class TemplateRecommendationRequest(BaseModel):
    branch_or_domain: str = Field(..., description="e.g. 'ISE', 'CSE', 'ECE', 'MBA', 'Design', 'Mechanical'")
    target_role: str = Field(..., description="e.g. 'Software Engineer', 'Product Manager', 'Data Analyst'")
    years_of_experience: Optional[int] = Field(0, description="0 for student/fresher")

class TemplateRecommendationResponse(BaseModel):
    recommended_template_id: str = Field(..., description="ID for frontend template selector, e.g., 'ats_clean_tech'")
    template_name: str
    layout_type: str = Field(..., description="'Single-Column ATS Standard', 'Hybrid Compact', etc.")
    recommended_fonts: List[str]
    color_palette_advice: str
    why_recommended: str
    branch_specific_tips: List[str]
    source: str


class LengthOptimizeRequest(BaseModel):
    resume_text: str = Field(..., description="Full text of the resume")
    target_pages: Optional[int] = Field(1, description="Target page count (default 1 for students/entry-level)")

class LengthOptimizeResponse(BaseModel):
    estimated_word_count: int
    estimated_pages: float
    is_one_page_compliant: bool
    verdict: str
    trimming_suggestions: List[str]
    spacing_and_layout_tips: List[str]
    source: str
