from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import Optional
import httpx
import re
from ai_module.config import settings
from ai_module.services.ai_orchestrator import ai_orchestrator
from ai_module.services import ats_engine as _ats_engine
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

# Sites known to block scraping — guide user to paste text instead
_BLOCKED_DOMAINS = {
    "linkedin.com", "indeed.com", "glassdoor.com", "naukri.com",
    "monster.com", "ziprecruiter.com", "simplyhired.com",
}

_FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
}


def _html_to_text(html: str) -> str:
    """Strip HTML tags, collapse whitespace, return clean plain text."""
    # Remove script and style blocks entirely
    text = re.sub(r"<(script|style)[^>]*>.*?</(script|style)>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    # Remove all remaining HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Decode common HTML entities
    text = (
        text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        .replace("&nbsp;", " ").replace("&quot;", '"').replace("&#39;", "'")
    )
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()[:6000]  # Cap to 6000 chars to avoid token overload


class FetchJDRequest(BaseModel):
    url: str = ""
    raw_text: Optional[str] = None


class FetchJDResponse(BaseModel):
    success: bool
    text: str
    source: str  # "url" | "raw_text" | "error"
    error_message: Optional[str] = None


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
            "Design & 1-Page Layout Guidance",
            "N-Gram ATS Keyword Engine (Deterministic)",
            "JD URL Fetcher with Anti-Block Handling",
        ]
    }


# ------------------------------------------------------------
# NEW: JD URL Fetcher with robust error handling
# ------------------------------------------------------------

@router.post(
    "/fetch-jd",
    response_model=FetchJDResponse,
    summary="Fetch and extract text from a Job Description URL"
)
async def fetch_job_description(req: FetchJDRequest):
    """
    Fetches a Job Description from a URL and returns clean extracted text.

    - Adds proper User-Agent and Accept headers to bypass basic bot detection.
    - Returns a user-friendly error for blocked sites (LinkedIn, Indeed, etc.)
      prompting the user to paste the raw text instead.
    - If raw_text is provided, it takes priority and skips URL fetching.
    - Implements a 10s timeout and graceful fallback for network errors.
    """
    # If raw text was provided directly, just clean and return it
    if req.raw_text and req.raw_text.strip():
        clean = re.sub(r"\s+", " ", req.raw_text.strip())[:6000]
        return FetchJDResponse(success=True, text=clean, source="raw_text")

    if not req.url or not req.url.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either 'url' or 'raw_text' must be provided."
        )

    url = req.url.strip()

    # Detect blocked domains before making any network call
    domain_lower = re.sub(r"https?://(?:www\.)?", "", url).split("/")[0].lower()
    if any(blocked in domain_lower for blocked in _BLOCKED_DOMAINS):
        return FetchJDResponse(
            success=False,
            text="",
            source="error",
            error_message=(
                f"Unable to read job postings from {domain_lower} directly — "
                "this site blocks automated access. "
                "Please copy and paste the job description text into the text box below."
            )
        )

    # Fetch with timeout, proper headers, and retry
    last_error = ""
    for attempt in range(2):  # 2 attempts
        try:
            async with httpx.AsyncClient(
                headers=_FETCH_HEADERS,
                follow_redirects=True,
                timeout=10.0,
                verify=False,
            ) as client:
                response = await client.get(url)

            if response.status_code == 403 or response.status_code == 401:
                return FetchJDResponse(
                    success=False,
                    text="",
                    source="error",
                    error_message=(
                        "This website blocks automated access (403 Forbidden). "
                        "Please copy and paste the job description text directly."
                    )
                )
            if response.status_code == 404:
                return FetchJDResponse(
                    success=False,
                    text="",
                    source="error",
                    error_message="The URL returned a 404 Not Found response. Please check the link."
                )
            if not response.is_success:
                last_error = f"HTTP {response.status_code}"
                continue

            content_type = response.headers.get("content-type", "")
            if "html" in content_type:
                text = _html_to_text(response.text)
            else:
                text = response.text[:6000]

            if len(text.strip()) < 50:
                return FetchJDResponse(
                    success=False,
                    text="",
                    source="error",
                    error_message=(
                        "The URL returned insufficient text content. "
                        "Please paste the job description text directly."
                    )
                )

            return FetchJDResponse(success=True, text=text, source="url")

        except httpx.TimeoutException:
            last_error = "Request timed out after 10 seconds"
        except httpx.ConnectError:
            last_error = "Could not connect to the URL"
        except Exception as exc:
            last_error = str(exc)[:200]

    return FetchJDResponse(
        success=False,
        text="",
        source="error",
        error_message=(
            f"Could not fetch the URL: {last_error}. "
            "Please paste the job description text directly below."
        )
    )


# ------------------------------------------------------------
# NEW: ATS Score Extended — full deterministic n-gram result
# ------------------------------------------------------------

class AtsExtendedRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    target_role: Optional[str] = None


@router.post(
    "/ats/score-extended",
    summary="Full deterministic n-gram ATS score with category breakdown"
)
def score_ats_extended(req: AtsExtendedRequest):
    """
    Runs the deterministic ATS keyword engine directly (no LLM).
    Returns full category_breakdown (hard_skills, methodologies, domain_terms)
    with matched/missing per category and weighted composite score.
    """
    try:
        result = _ats_engine.score_ats(
            resume_text=req.resume_text,
            jd_text=req.job_description,
            target_role=req.target_role,
        )
        return {"source": "deterministic", **result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS engine error: {str(e)}"
        )


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
    try:
        return ai_orchestrator.enhance_verbs(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/ats/score",
    response_model=AtsScoreResponse,
    summary="Calculate ATS Score (0-100) with n-gram keyword matching & category breakdown"
)
def score_ats(req: AtsScoreRequest):
    """
    Scores resume against ATS parsing criteria using n-gram keyword extraction.
    Extracts Hard Skills, Methodologies, and Domain Terms from the JD.
    Returns matched/missing per category plus a weighted composite score.
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
    try:
        return ai_orchestrator.optimize_length(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
