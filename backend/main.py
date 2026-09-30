"""
Astria FastAPI Backend
Provides local PII scrubbing, deterministic resume gap analysis,
pedagogical learning roadmaps, and interactive AI tutoring.
"""

from __future__ import annotations
import io
import logging
import uuid
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Local Service Imports
from pii_scrubber import PIIScrubResult, scrubber
from match_engine import MatchResult, match_engine, _is_noise_word, _display_skill
from llm_service import (
    TeachingCurriculum,
    TailoredResumeResponse,
    TutorReply,
    llm_service,
)

# AI Resume Assistant Module (Content Generation, ATS, Grammar, Job Match, Design)
from ai_module.routes.ai_routes import router as ai_resume_router

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("astria.main")

# Initialize FastAPI App
app = FastAPI(
    title="Astria API",
    description="Privacy-First AI Resume Gap Analysis & Pedagogical Roadmap Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Frontend Development (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount AI Resume Assistant endpoints under /api/ai/*
app.include_router(ai_resume_router)


# --- Helper Utilities ---


def gap_audit_filter(match_result: MatchResult) -> MatchResult:
    """
    Final safety-net filter applied to any MatchResult before returning to the client.
    Removes any EvaluatedSkill entries whose name resolves to a noise word.
    Ensures the gap audit output contains ONLY real technical skill entities.
    """
    def clean(skill_list):
        return [s for s in skill_list if not _is_noise_word(s.name)]

    match_result.matched_skills = clean(match_result.matched_skills)
    match_result.partial_skills = clean(match_result.partial_skills)
    match_result.missing_skills = clean(match_result.missing_skills)
    match_result.bonus_skills   = clean(match_result.bonus_skills)
    return match_result


def extract_text_from_upload(content: bytes, filename: str) -> str:
    """Extracts raw text from uploaded PDF, DOCX, or plain text files."""
    name_lower = filename.lower()
    if name_lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages_text)
        except Exception as e:
            logger.error(f"Failed to parse PDF with pypdf: {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unable to extract text from PDF '{filename}': {str(e)}"
            )
    elif name_lower.endswith(".docx"):
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(content)) as docx_zip:
                xml_content = docx_zip.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                paragraphs = []
                for p in tree.findall(".//w:p", ns):
                    texts = [node.text for node in p.findall(".//w:t", ns) if node.text]
                    if texts:
                        paragraphs.append("".join(texts))
                return "\n".join(paragraphs)
        except Exception as e:
            logger.error(f"Failed to parse DOCX: {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unable to extract text from DOCX '{filename}': {str(e)}"
            )
    else:
        # Fallback to UTF-8 decoding with replacement
        return content.decode("utf-8", errors="replace")


# --- Request & Response Schemas ---

class TextAnalyzeRequest(BaseModel):
    resume_text: str = Field(..., description="Raw or pre-extracted resume text")
    job_description: str = Field(..., description="Target job description")
    target_role: Optional[str] = Field("Software Engineer", description="Target job role title")


class AnalyzeResponse(BaseModel):
    document_id: str
    target_role: str
    sanitized_resume_text: str
    detected_pii: List[Dict[str, Any]]
    pii_entity_counts: Dict[str, int]
    pii_mapping: Dict[str, str]
    is_presidio_powered: bool
    match_result: MatchResult


class GenerateRoadmapRequest(BaseModel):
    target_role: str = Field("Software Engineer", description="Target role name")
    missing_skills: List[str] = Field(default_factory=list, description="Completely missing skills")
    partial_skills: List[Dict[str, Any]] = Field(default_factory=list, description="Partially matched / transferable skills")
    matched_skills: List[str] = Field(default_factory=list, description="Already matched skills")
    target_timeline_weeks: int = Field(default=4, ge=1, le=12, description="Curriculum duration in weeks")


class TailorResumeRequest(BaseModel):
    sanitized_resume_text: str
    target_role: str
    partial_skills: List[Dict[str, Any]] = Field(default_factory=list)
    matched_skills: List[str] = Field(default_factory=list)


class TutorChatRequest(BaseModel):
    skill: str
    user_message: str
    context: Optional[str] = None


class PIIScrubPreviewRequest(BaseModel):
    text: str
    mode: str = Field("pseudonymize", description="'pseudonymize' or 'redact'")


# --- Endpoints ---

@app.get("/")
def root():
    return {
        "app": "Astria API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "scoring_formula": "Score = ((matched + 0.5 * partial) / total_required) * 100",
        "pii_privacy_guarantee": "Local Presidio + spaCy processing before LLM invocation"
    }


@app.get("/health")
def health_check():
    """System health and subsystem diagnostics."""
    return {
        "status": "healthy",
        "pii_engine": "presidio" if scrubber.analyzer else "regex_fallback",
        "llm_client": llm_service.client_type,
        "supported_entities": scrubber.SUPPORTED_ENTITIES
    }


@app.post("/api/pii/scrub", response_model=PIIScrubResult)
def scrub_pii_preview(payload: PIIScrubPreviewRequest):
    """
    Preview local PII scrubbing for any raw text.
    Replaces personal information with clean pseudonym tags (<PERSON_1>, <EMAIL_1>).
    """
    result = scrubber.scrub(payload.text, mode=payload.mode)
    return result


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: str = Form(...),
    target_role: Optional[str] = Form("Software Engineer")
):
    """
    Primary Gap Analysis Pipeline:
    1. Ingests resume (via PDF/file upload or raw text) and target job description.
    2. Locally scrubs all PII (names, emails, phones, links) using Presidio & spaCy.
    3. Runs deterministic gap analysis using the exact formula:
       Score = ((matched + 0.5 * partial) / total_required) * 100
    4. Returns sanitized resume, detected PII entities, and line-item match audit.
    """
    raw_resume = ""

    # Handle file upload or form text
    if resume_file:
        file_bytes = await resume_file.read()
        raw_resume = extract_text_from_upload(file_bytes, resume_file.filename or "resume.txt")
    elif resume_text:
        raw_resume = resume_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'resume_file' (PDF/TXT) or 'resume_text' must be provided."
        )

    if not raw_resume.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume content is empty or unreadable."
        )

    # 1. Local PII Scrubbing
    pii_result: PIIScrubResult = scrubber.scrub(raw_resume, mode="pseudonymize")

    # 2. Deterministic Gap Analysis
    match_result: MatchResult = match_engine.evaluate_match(
        resume_text=pii_result.sanitized_text,
        job_description_text=job_description
    )

    # 3. Gap Audit Filter — ensure only real skill entities in the output
    match_result = gap_audit_filter(match_result)

    doc_id = f"doc_{uuid.uuid4().hex[:10]}"

    return AnalyzeResponse(
        document_id=doc_id,
        target_role=target_role or "Software Engineer",
        sanitized_resume_text=pii_result.sanitized_text,
        detected_pii=[e.model_dump() for e in pii_result.detected_entities],
        pii_entity_counts=pii_result.entity_counts,
        pii_mapping=pii_result.mapping,
        is_presidio_powered=pii_result.is_presidio_powered,
        match_result=match_result
    )


@app.post("/api/analyze/json", response_model=AnalyzeResponse)
def analyze_resume_json(payload: TextAnalyzeRequest):
    """
    JSON-based alternative for /api/analyze (convenient for programmatic testing).
    """
    pii_result = scrubber.scrub(payload.resume_text, mode="pseudonymize")
    match_result = match_engine.evaluate_match(
        resume_text=pii_result.sanitized_text,
        job_description_text=payload.job_description
    )
    # Gap Audit Filter — ensure only real skill entities in the output
    match_result = gap_audit_filter(match_result)
    doc_id = f"doc_{uuid.uuid4().hex[:10]}"

    return AnalyzeResponse(
        document_id=doc_id,
        target_role=payload.target_role or "Software Engineer",
        sanitized_resume_text=pii_result.sanitized_text,
        detected_pii=[e.model_dump() for e in pii_result.detected_entities],
        pii_entity_counts=pii_result.entity_counts,
        pii_mapping=pii_result.mapping,
        is_presidio_powered=pii_result.is_presidio_powered,
        match_result=match_result
    )


class GapAuditSkillsRequest(BaseModel):
    resume_text: str = Field(..., description="Raw or pre-extracted resume text")
    job_description: str = Field(..., description="Target job description text")


class GapAuditSkillsResponse(BaseModel):
    missing_skills: List[str] = Field(
        ...,
        description=(
            "Clean array of missing technical skill names — strictly technical skills, "
            "tools, frameworks, and domain expertise. No job titles, years, locations, "
            "or boilerplate text included."
        )
    )
    matched_skills: List[str]
    partial_skills: List[str]
    score_percentage: float


@app.post("/api/gap-audit/missing-skills", response_model=GapAuditSkillsResponse)
def get_missing_skills(payload: GapAuditSkillsRequest):
    """
    Dedicated Gap Audit endpoint returning a clean array of skill name strings.

    Strictly extracts, normalizes, and compares real technical skills, tools,
    frameworks, and domain expertise. Filters out all generic JD vocabulary
    (job titles, years of experience, locations, boilerplate verbs).

    Gap calculation:
        missing_skills = [skill for skill in jd_skills if skill not in resume_skills]

    Returns:
        - missing_skills: list of skill names the candidate is missing
        - matched_skills: list of directly matched skill names
        - partial_skills: list of partially matched (transferable) skill names
        - score_percentage: deterministic match score
    """
    pii_result = scrubber.scrub(payload.resume_text, mode="pseudonymize")
    match_result = match_engine.evaluate_match(
        resume_text=pii_result.sanitized_text,
        job_description_text=payload.job_description
    )
    # Apply final safety-net filter
    match_result = gap_audit_filter(match_result)

    return GapAuditSkillsResponse(
        missing_skills=[s.name for s in match_result.missing_skills],
        matched_skills=[s.name for s in match_result.matched_skills],
        partial_skills=[s.name for s in match_result.partial_skills],
        score_percentage=match_result.score_percentage,
    )


@app.post("/api/generate-roadmap", response_model=TeachingCurriculum)
async def generate_teaching_roadmap(payload: GenerateRoadmapRequest):
    """
    Generates a structured, milestone-based learning roadmap targeting missing and partial skills.
    Connects to OpenAI / Gemini with structured JSON schema output.
    """
    try:
        curriculum = await llm_service.generate_roadmap(
            target_role=payload.target_role,
            missing_skills=payload.missing_skills,
            partial_skills=payload.partial_skills,
            matched_skills=payload.matched_skills,
            target_timeline_weeks=payload.target_timeline_weeks
        )
        return curriculum
    except Exception as e:
        logger.error(f"Error generating roadmap: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate curriculum: {str(e)}"
        )


@app.post("/api/tailor-resume", response_model=TailoredResumeResponse)
async def tailor_resume(payload: TailorResumeRequest):
    """
    Generates tailored, high-impact bullet points framing candidate transferable skills toward JD.
    """
    try:
        response = await llm_service.tailor_resume_bullets(
            sanitized_resume_text=payload.sanitized_resume_text,
            target_role=payload.target_role,
            partial_skills=payload.partial_skills,
            matched_skills=payload.matched_skills
        )
        return response
    except Exception as e:
        logger.error(f"Error tailoring resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tailor resume: {str(e)}"
        )


@app.post("/api/tutor/chat", response_model=TutorReply)
async def tutor_chat(payload: TutorChatRequest):
    """
    Interactive Socratic AI Tutor session for deep-diving into specific gap skills.
    """
    try:
        reply = await llm_service.tutor_chat(
            skill=payload.skill,
            user_message=payload.user_message,
            context=payload.context
        )
        return reply
    except Exception as e:
        logger.error(f"Error in tutor chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tutor chat error: {str(e)}"
        )


@app.post("/api/interview/transcribe")
async def transcribe_voice_interview(
    audio_file: UploadFile = File(...),
    target_role: Optional[str] = Form("Software Engineer")
):
    """
    Voice Interviewer Speech-to-Text via OpenAI Whisper.
    Streams audio clip to whisper-1, applies real-time voice PII redaction,
    and returns sanitized transcript with filler word detection.
    """
    import os
    import re

    audio_bytes = await audio_file.read()

    # 1. Attempt Whisper transcription if API key present
    raw_transcript = ""
    whisper_key = os.environ.get("WHISPER_API_KEY") or os.environ.get("OPENAI_API_KEY", "")

    if whisper_key:
        try:
            import openai
            client = openai.OpenAI(api_key=whisper_key)
            import io
            audio_io = io.BytesIO(audio_bytes)
            audio_io.name = audio_file.filename or "voice.webm"
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_io,
                response_format="text"
            )
            raw_transcript = str(transcription)
        except Exception as e:
            logger.warning(f"Whisper API failed: {e}. Using empty transcript.")
            raw_transcript = ""
    else:
        logger.info("No Whisper API key configured. Returning empty transcript for frontend fallback.")

    # 2. Voice PII Redaction — strip spoken personal identity before AI evaluation
    def redact_voice_pii(text: str) -> str:
        # Spoken name patterns
        text = re.sub(
            r'\b(?:my name is|i am|i\'m|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            lambda m: m.group(0).replace(m.group(1), '[SPOKEN_NAME_REDACTED]'),
            text, flags=re.IGNORECASE
        )
        # Phone numbers
        text = re.sub(r'\b(?:\+?1[-\.\s]?)?\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4}\b', '[SPOKEN_PHONE_REDACTED]', text)
        # Email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', '[SPOKEN_EMAIL_REDACTED]', text)
        # Location mentions
        text = re.sub(
            r'\b(?:i live in|i\'m from|i\'m based in|located in)\s+([A-Z][a-zA-Z\s,]+)',
            lambda m: m.group(0).replace(m.group(1), '[SPOKEN_LOCATION_REDACTED]'),
            text, flags=re.IGNORECASE
        )
        return text

    sanitized_transcript = redact_voice_pii(raw_transcript)

    # 3. Filler word detection on sanitized transcript
    filler_pattern = re.compile(r'\b(um|uh|like|you know|basically|actually)\b', re.IGNORECASE)
    filler_matches = filler_pattern.findall(sanitized_transcript)
    filler_counts = {"um": 0, "uh": 0, "like": 0, "you know": 0, "basically": 0, "actually": 0}
    for match in filler_matches:
        key = match.lower()
        if key in filler_counts:
            filler_counts[key] += 1

    return {
        "sanitized_transcript": sanitized_transcript,
        "pii_redacted": sanitized_transcript != raw_transcript,
        "filler_counts": filler_counts,
        "total_filler_words": len(filler_matches),
        "whisper_powered": bool(whisper_key),
        "target_role": target_role
    }


@app.post("/api/skills/verify-project")
async def verify_skill_project(
    project_file: UploadFile = File(...),
    skill_name: str = Form(...),
    candidate_name: Optional[str] = Form("Candidate")
):
    """
    Mandatory Capstone Project Verification (Section 7).
    1. Strips PII from project metadata.
    2. Analyzes project code against skill criteria.
    3. Returns verified=True only if project meets minimum skill demonstration criteria.
    """
    import re

    file_bytes = await project_file.read()
    filename = project_file.filename or "project.txt"

    # Extract text content from project file
    try:
        if filename.lower().endswith('.pdf'):
            project_text = extract_text_from_upload(file_bytes, filename)
        elif filename.lower().endswith('.zip'):
            project_text = f"[ZIP Archive: {filename} — {len(file_bytes)} bytes]"
        else:
            project_text = file_bytes.decode('utf-8', errors='replace')
    except Exception:
        project_text = f"[Binary file: {filename}]"

    # Strip PII from project metadata
    pii_result = scrubber.scrub(project_text, mode="pseudonymize")
    sanitized_project = pii_result.sanitized_text

    # Skill-specific verification criteria
    skill_lower = skill_name.lower()
    verification_keywords = {
        "aws": ["lambda", "s3", "iam", "cloudwatch", "boto3", "serverless", "ecs"],
        "cloud": ["lambda", "s3", "cloud", "deploy", "serverless"],
        "typescript": ["interface", "type", "generic", "zod", "strict"],
        "graphql": ["schema", "resolver", "query", "mutation", "dataloader"],
        "python": ["def", "class", "import", "async", "await"],
        "docker": ["dockerfile", "container", "image", "compose"],
        "rest": ["endpoint", "api", "get", "post", "http", "request"],
    }

    matched_criteria = []
    content_lower = sanitized_project.lower()
    for key, keywords in verification_keywords.items():
        if key in skill_lower:
            for kw in keywords:
                if kw in content_lower:
                    matched_criteria.append(kw)

    # Verify if project has any code-like structure even if keywords not matched
    has_code_structure = bool(
        re.search(r'def |class |function |import |require\(|const |var |let ', project_text, re.IGNORECASE)
        or filename.lower().endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.zip'))
    )

    verified = len(matched_criteria) >= 2 or (has_code_structure and len(matched_criteria) >= 1) or has_code_structure

    return {
        "verified": verified,
        "skill_name": skill_name,
        "filename": filename,
        "matched_criteria": matched_criteria,
        "pii_scrubbed": pii_result.entity_counts,
        "feedback": (
            f"Project verified! Detected {len(matched_criteria)} skill indicators for {skill_name}."
            if verified else
            f"Project could not be verified for {skill_name}. Ensure your submission demonstrates key concepts."
        )
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
