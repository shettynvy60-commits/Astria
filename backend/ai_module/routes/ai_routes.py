from fastapi import APIRouter, HTTPException, status
from ai_module.config import settings
from ai_module.services.ai_orchestrator import ai_orchestrator
from ai_module.models import (
    BulletExpansionRequest, BulletExpansionResponse,
    SummaryGenerationRequest, SummaryGenerationResponse,
    SectionSuggestionRequest, SectionSuggestionResponse,
    GrammarFixRequest, GrammarFixResponse,
    AtsScoreRequest, AtsScoreResponse,
    VerbEnhanceRequest, VerbEnhanceResponse,
    JobMatchRequest, JobMatchResponse,
    SkillGapRequest, SkillGapResponse,
    TemplateRecommendationRequest, TemplateRecommendationResponse,
    LengthOptimizeRequest, LengthOptimizeResponse
)

router = APIRouter(prefix="/api/ai", tags=["AI Resume Engine"])

@router.get("/health", summary="Check AI Engine Health & Provider Status")
def health_check():
    return {
        "status": "online",
        "gemini_configured": settings.is_gemini_configured,
        "model": settings.GEMINI_MODEL,
        "active_engine": "Gemini API (Cloud)" if settings.is_gemini_configured else "Mock AI Engine (Offline Fallback)",
        "features": [
            "Content Generation (Bullets, Summary, Section Blueprints)",
            "ATS Scoring & Grammar / Action Verb Enhancement",
            "Job Description Matching & Skill Gap Analysis",
            "Design & 1-Page Layout Guidance"
        ]
    }

# ------------------------------------------------------------
# 1. CONTENT GENERATION ENDPOINTS
# ------------------------------------------------------------

@router.post(
    "/bullets/generate",
    response_model=BulletExpansionResponse,
    summary="Expand 1-line note into 3-4 professional STAR bullets"
)
def generate_bullet_points(req: BulletExpansionRequest):
    """
    Expands casual notes (e.g. 'internship at Infosys') into quantifiable,
    action-oriented STAR resume bullet points.
    """
    try:
        return ai_orchestrator.expand_bullets(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/summary/generate",
    response_model=SummaryGenerationResponse,
    summary="Generate strong Professional Summary & Career Objective"
)
def generate_summary(req: SummaryGenerationRequest):
    """
    Generates tailored summary, objective statement, and elevator pitch
    based on student/candidate skills and target role.
    """
    try:
        return ai_orchestrator.generate_summary(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/sections/suggest",
    response_model=SectionSuggestionResponse,
    summary="Suggest Education, Projects, Skills (No Blank Page)"
)
def suggest_sections(req: SectionSuggestionRequest):
    """
    Solves the 'Blank Page' anxiety by auto-recommending benchmark projects,
    curated technical skill taxonomy, coursework, and certifications.
    """
    try:
        return ai_orchestrator.suggest_sections(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------------------------------------------------
# 2. ATS & GRAMMAR FIX ENDPOINTS
# ------------------------------------------------------------

@router.post(
    "/grammar/fix",
    response_model=GrammarFixResponse,
    summary="Fix grammar, tone, spelling, and passive voice"
)
def fix_grammar(req: GrammarFixRequest):
    """
    Checks spelling, syntax, sentence clarity, and makes resume text
    concise and professional.
    """
    try:
        return ai_orchestrator.fix_grammar(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/verbs/enhance",
    response_model=VerbEnhanceResponse,
    summary="Upgrade weak verbs (e.g. 'did coding' -> 'Architected and optimized')"
)
def enhance_action_verbs(req: VerbEnhanceRequest):
    """
    Replaces passive, weak, or repetitive verbs with high-power recruiter verbs.
    """
    try:
        return ai_orchestrator.enhance_verbs(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/ats/score",
    response_model=AtsScoreResponse,
    summary="Calculate ATS Score (0-100) & actionable keyword recommendations"
)
def score_ats(req: AtsScoreRequest):
    """
    Scores resume against ATS parsing criteria, extracts missing keywords,
    and returns prioritized action steps to increase interview chances.
    """
    try:
        return ai_orchestrator.score_ats(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------------------------------------------------
# 3. SMART CUSTOMIZATION ENDPOINTS
# ------------------------------------------------------------

@router.post(
    "/job-match",
    response_model=JobMatchResponse,
    summary="Compare resume against Job Description & recommend tailored bullets"
)
def match_job_description(req: JobMatchRequest):
    """
    Analyzes resume against an employer's Job Description, determines
    compatibility %, identifies missing tech keywords, and provides tailored bullets.
    """
    try:
        return ai_orchestrator.match_job(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/skills/gap-analysis",
    response_model=SkillGapResponse,
    summary="Identify missing skills & recommended learning paths"
)
def analyze_skill_gaps(req: SkillGapRequest):
    """
    Pinpoints high-value missing skills between candidate profile and market demand.
    """
    try:
        return ai_orchestrator.analyze_skill_gaps(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------------------------------------------------
# 4. DESIGN & FORMATTING GUIDANCE ENDPOINTS
# ------------------------------------------------------------

@router.post(
    "/design/recommend-template",
    response_model=TemplateRecommendationResponse,
    summary="Recommend optimal template and layout for branch (ISE/CS vs MBA)"
)
def recommend_template(req: TemplateRecommendationRequest):
    """
    Recommends template layout, typography, and styling tailored to the applicant's
    discipline (e.g. ISE/CS technical vs MBA executive).
    """
    try:
        return ai_orchestrator.recommend_template(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/length/optimize",
    response_model=LengthOptimizeResponse,
    summary="Check 1-page compliance & get trimming/spacing guidance"
)
def optimize_length(req: LengthOptimizeRequest):
    """
    Calculates estimated page density and gives line-by-line trimming advice
    to enforce the 1-page rule.
    """
    try:
        return ai_orchestrator.optimize_length(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
