"""
Astria LLM Service
Connects to OpenAI or Google Gemini using structured JSON schema output
for pedagogical learning roadmaps, resume tailoring, and interactive tutoring.
Includes intelligent offline mock generators for zero-configuration testing.
"""

from __future__ import annotations
import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("astria.llm_service")

# --- Environment & Configuration Helper ---

def load_env_file() -> None:
    """Loads environment variables from local .env files if present."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(base_dir, ".env"),
        os.path.join(base_dir, "..", ".env"),
        os.path.join(os.getcwd(), ".env")
    ]
    for p in possible_paths:
        if os.path.isfile(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
                logger.info(f"Loaded environment variables from {p}")
                break
            except Exception as e:
                logger.debug(f"Failed to read {p}: {e}")

load_env_file()


def clean_json_response(raw_text: str) -> str:
    """Strips markdown code fences (```json ... ```) from LLM text output."""
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


# --- Structured Pydantic Schemas ---

class InterviewQuestion(BaseModel):
    question: str
    expected_answer_guide: str
    common_pitfalls: str


class PracticalProject(BaseModel):
    title: str
    description: str
    deliverable: str
    key_technologies: List[str]


class CuratedResource(BaseModel):
    title: str
    url: str
    resource_type: str = Field(..., description="DOCS, VIDEO, TUTORIAL, REPO")


class CurriculumModule(BaseModel):
    id: str
    title: str
    focus_skill: str
    estimated_hours: int = 5
    difficulty: str = Field("Intermediate", description="Beginner, Intermediate, Advanced")
    core_concepts: List[str]
    practical_project: PracticalProject
    interview_prep: List[InterviewQuestion]
    curated_resources: List[CuratedResource]


class CurriculumMilestone(BaseModel):
    week_number: int
    milestone_title: str
    goal_description: str
    modules: List[CurriculumModule]


class TeachingCurriculum(BaseModel):
    target_role: str
    total_weeks: int
    weekly_hours: int
    pedagogical_summary: str
    milestones: List[CurriculumMilestone]
    readiness_checklist: List[str]


class TailoredBulletPoint(BaseModel):
    original_theme: str
    tailored_bullet: str
    targeted_skill: str
    transferable_rationale: str


class TailoredResumeResponse(BaseModel):
    target_role: str
    bullet_points: List[TailoredBulletPoint]
    optimization_advice: str


class TutorQuiz(BaseModel):
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str


class TutorReply(BaseModel):
    explanation: str
    practical_tip: str
    mini_quiz: Optional[TutorQuiz] = None
    source: str = "mock"


# --- LLM Client Class ---

class LLMService:
    """
    Unified LLM Client supporting OpenAI, Google Gemini, and realistic offline fallback.
    """

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client_type = self._detect_client()

    def _detect_client(self) -> str:
        # Refresh from environment in case variables were set dynamically
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if self.gemini_key:
            logger.info("LLM Service initialized with Google Gemini.")
            return "gemini"
        elif self.openai_key:
            logger.info("LLM Service initialized with OpenAI.")
            return "openai"
        else:
            logger.warning(
                "Neither OPENAI_API_KEY nor GEMINI_API_KEY detected. "
                "Activating intelligent offline pedagogical generator for instant preview."
            )
            return "mock"

    async def generate_roadmap(
        self,
        target_role: str,
        missing_skills: List[str],
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str],
        target_timeline_weeks: int = 4
    ) -> TeachingCurriculum:
        """
        Generates a comprehensive pedagogical learning roadmap targeting missing and partial skills.
        """
        client = self._detect_client()
        if client == "openai" and self.openai_key:
            try:
                return await self._call_openai_roadmap(
                    target_role, missing_skills, partial_skills, matched_skills, target_timeline_weeks
                )
            except Exception as e:
                logger.error(f"OpenAI roadmap generation failed: {e}. Falling back to default generator.")
        elif client == "gemini" and self.gemini_key:
            try:
                return await self._call_gemini_roadmap(
                    target_role, missing_skills, partial_skills, matched_skills, target_timeline_weeks
                )
            except Exception as e:
                logger.error(f"Gemini roadmap generation failed: {e}. Falling back to default generator.")

        return self._generate_mock_roadmap(
            target_role, missing_skills, partial_skills, matched_skills, target_timeline_weeks
        )

    async def _call_openai_roadmap(
        self,
        target_role: str,
        missing_skills: List[str],
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str],
        weeks: int
    ) -> TeachingCurriculum:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_key)

        system_prompt = (
            "You are Astria's lead technical pedagogical architect. "
            "Your mission is to construct an actionable, high-yield, milestone-based curriculum "
            "to bridge the candidate's exact technical gaps for a target role. "
            "Output must be strictly valid JSON matching the requested schema."
        )

        user_content = {
            "target_role": target_role,
            "target_timeline_weeks": weeks,
            "missing_skills": missing_skills,
            "partial_skills": partial_skills,
            "already_matched_skills": matched_skills,
            "instruction": "Design a week-by-week curriculum. Do NOT give vague advice. Provide specific projects, interview questions, and official docs."
        }

        completion = await client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content)}
            ],
            temperature=0.2
        )

        raw_json = completion.choices[0].message.content or "{}"
        cleaned_json = clean_json_response(raw_json)
        data = json.loads(cleaned_json)
        return TeachingCurriculum.model_validate(data)

    async def _call_gemini_roadmap(
        self,
        target_role: str,
        missing_skills: List[str],
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str],
        weeks: int
    ) -> TeachingCurriculum:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        
        prompt = f"""
        You are an expert technical curriculum designer. Return a JSON object matching this schema:
        {json.dumps(TeachingCurriculum.model_json_schema())}
        
        Target Role: {target_role}
        Timeline: {weeks} weeks
        Missing Skills: {missing_skills}
        Partial Skills: {partial_skills}
        Matched Skills: {matched_skills}
        
        Generate a rigorous week-by-week technical curriculum with concrete mini-projects and interview questions. Return ONLY valid JSON.
        """

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.2}
        }
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=35)
        res.raise_for_status()
        res_data = res.json()
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        cleaned_json = clean_json_response(raw_text)
        return TeachingCurriculum.model_validate_json(cleaned_json)

    def _generate_mock_roadmap(
        self,
        target_role: str,
        missing_skills: List[str],
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str],
        weeks: int
    ) -> TeachingCurriculum:
        """
        High-fidelity realistic fallback generator when external API keys are not supplied.
        Ensures frontend and testing are fully functional instantly.
        """
        all_gaps = list(missing_skills)
        for p in partial_skills:
            name = p.get("name") if isinstance(p, dict) else str(p)
            if name and name not in all_gaps:
                all_gaps.append(name)

        if not all_gaps:
            all_gaps = ["System Design Optimization", "Production Observability"]

        milestones: List[CurriculumMilestone] = []
        weeks_count = max(1, min(weeks, 6))

        # Distribute gaps across weeks
        chunks = [all_gaps[i::weeks_count] for i in range(weeks_count)]

        for w_idx, week_gaps in enumerate(chunks, 1):
            if not week_gaps:
                week_gaps = ["Advanced Best Practices & Interview Readiness"]
            
            theme_skill = week_gaps[0].capitalize()
            modules: List[CurriculumModule] = []

            for m_idx, skill in enumerate(week_gaps, 1):
                mod_id = f"mod-w{w_idx}-{m_idx}"
                modules.append(
                    CurriculumModule(
                        id=mod_id,
                        title=f"{skill.capitalize()} Core Architecture & Mastery",
                        focus_skill=skill,
                        estimated_hours=8,
                        difficulty="Intermediate" if w_idx <= 2 else "Advanced",
                        core_concepts=[
                            f"Core architectural paradigms of {skill}",
                            f"Production-grade configuration, scalability, and error handling",
                            f"Benchmarking, indexing, and debugging common failures in {skill}"
                        ],
                        practical_project=PracticalProject(
                            title=f"Build a Production-Ready {skill.capitalize()} Micro-Service",
                            description=f"Construct an end-to-end service implementing resilient patterns with {skill}. Incorporate logging, metrics, and automated tests.",
                            deliverable="Working GitHub repository with Docker Compose cluster and CI pipeline",
                            key_technologies=[skill, "Docker", "Python", "FastAPI"]
                        ),
                        interview_prep=[
                            InterviewQuestion(
                                question=f"How does {skill} handle distributed state or concurrency under high traffic?",
                                expected_answer_guide=f"Explain internal concurrency models, partition strategies, consensus mechanisms, or connection pools relevant to {skill}.",
                                common_pitfalls="Giving generic textbook definitions without discussing trade-offs, network partitions, or resource limits."
                            ),
                            InterviewQuestion(
                                question=f"Describe a catastrophic failure mode in {skill} and how you would mitigate it.",
                                expected_answer_guide="Discuss memory leaks, split-brain scenarios, unbounded queue buffers, or cache stampedes.",
                                common_pitfalls="Assuming standard defaults are safe for production enterprise scale."
                            )
                        ],
                        curated_resources=[
                            CuratedResource(
                                title=f"Official Documentation & Architecture Guide for {skill.capitalize()}",
                                url=f"https://www.google.com/search?q={skill}+official+documentation",
                                resource_type="DOCS"
                            ),
                            CuratedResource(
                                title=f"{skill.capitalize()} Production Checklist & Anti-Patterns",
                                url=f"https://github.com/search?q={skill}+best+practices",
                                resource_type="REPO"
                            )
                        ]
                    )
                )

            milestones.append(
                CurriculumMilestone(
                    week_number=w_idx,
                    milestone_title=f"Week {w_idx}: Mastering {theme_skill}",
                    goal_description=f"Deep dive into {theme_skill}, transitioning from basic syntax to architectural mastery and real-world deployment.",
                    modules=modules
                )
            )

        return TeachingCurriculum(
            target_role=target_role or "Full Stack Software Engineer",
            total_weeks=weeks_count,
            weekly_hours=10,
            pedagogical_summary=(
                f"Tailored pedagogical blueprint bridging {len(missing_skills)} missing skills and "
                f"{len(partial_skills)} transferable skills. Structured for maximum interview conversion."
            ),
            milestones=milestones,
            readiness_checklist=[
                "Deploy all weekly practical deliverables to public GitHub repositories",
                "Perform timed mock interviews on the generated interview questions",
                "Measure query/service latency improvements before adding to candidate portfolio"
            ]
        )

    async def tailor_resume_bullets(
        self,
        sanitized_resume_text: str,
        target_role: str,
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str]
    ) -> TailoredResumeResponse:
        """
        Generates truthful, impact-driven bullet points that highlight candidate transferable skills.
        Uses OpenAI or Gemini when API keys are available; falls back to offline generator.
        """
        client = self._detect_client()
        if client == "openai" and self.openai_key:
            try:
                return await self._call_openai_tailored(
                    sanitized_resume_text, target_role, partial_skills, matched_skills
                )
            except Exception as e:
                logger.error(f"OpenAI resume tailoring failed: {e}. Falling back to default generator.")
        elif client == "gemini" and self.gemini_key:
            try:
                return await self._call_gemini_tailored(
                    sanitized_resume_text, target_role, partial_skills, matched_skills
                )
            except Exception as e:
                logger.error(f"Gemini resume tailoring failed: {e}. Falling back to default generator.")

        return self._generate_mock_tailored_bullets(
            sanitized_resume_text, target_role, partial_skills, matched_skills
        )

    async def _call_openai_tailored(
        self,
        sanitized_resume: str,
        target_role: str,
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str]
    ) -> TailoredResumeResponse:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_key)
        system_prompt = (
            "You are an expert technical resume strategist. "
            "Generate truthful, quantifiable, impact-driven bullet points that spotlight candidate transferable skills. "
            "Output must be strictly valid JSON matching the TailoredResumeResponse schema."
        )
        user_content = {
            "target_role": target_role,
            "partial_skills": partial_skills,
            "matched_skills": matched_skills,
            "sanitized_resume_snippet": sanitized_resume[:2500]
        }
        completion = await client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content)}
            ],
            temperature=0.3
        )
        raw_json = completion.choices[0].message.content or "{}"
        cleaned = clean_json_response(raw_json)
        return TailoredResumeResponse.model_validate(json.loads(cleaned))

    async def _call_gemini_tailored(
        self,
        sanitized_resume: str,
        target_role: str,
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str]
    ) -> TailoredResumeResponse:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        prompt = f"""
        You are an expert technical resume strategist. Return ONLY valid JSON matching this schema:
        {json.dumps(TailoredResumeResponse.model_json_schema())}

        Target Role: {target_role}
        Transferable/Partial Skills: {partial_skills}
        Matched Skills: {matched_skills}
        Sanitized Resume: {sanitized_resume[:2500]}
        """
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.3}
        }
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=35)
        res.raise_for_status()
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        return TailoredResumeResponse.model_validate_json(clean_json_response(text))

    def _generate_mock_tailored_bullets(
        self,
        sanitized_resume_text: str,
        target_role: str,
        partial_skills: List[Dict[str, Any]],
        matched_skills: List[str]
    ) -> TailoredResumeResponse:
        bullets: List[TailoredBulletPoint] = []
        for p in partial_skills[:3]:
            skill_name = p.get("name") if isinstance(p, dict) else str(p)
            evidence = p.get("candidate_evidence", "Existing technical background") if isinstance(p, dict) else ""
            bullets.append(
                TailoredBulletPoint(
                    original_theme=f"Experience related to {evidence}",
                    tailored_bullet=(
                        f"Architected scalable systems leveraging {evidence}, establishing patterns directly transferable to "
                        f"{skill_name} while optimizing query latency by 35% across distributed clusters."
                    ),
                    targeted_skill=skill_name,
                    transferable_rationale=f"Frames existing knowledge in {evidence} toward the target requirement in {skill_name}."
                )
            )

        if not bullets:
            bullets.append(
                TailoredBulletPoint(
                    original_theme="Backend Service Development",
                    tailored_bullet="Engineered high-throughput asynchronous REST microservices in FastAPI and Python, handling 1.5M daily requests with 99.9% uptime.",
                    targeted_skill="FastAPI",
                    transferable_rationale="Highlights quantifiable production scale."
                )
            )

        return TailoredResumeResponse(
            target_role=target_role,
            bullet_points=bullets,
            optimization_advice="Emphasize architectural trade-offs and quantifiable business impact in your bullet points."
        )

    async def tutor_chat(
        self,
        skill: str,
        user_message: str,
        context: Optional[str] = None
    ) -> TutorReply:
        """
        Socratic AI Tutor conversational responder with diagnostic questions and mini-quizzes.
        Uses OpenAI or Gemini when API keys are configured; falls back to offline generator.
        """
        client = self._detect_client()
        if client == "openai" and self.openai_key:
            try:
                return await self._call_openai_tutor(skill, user_message, context)
            except Exception as e:
                logger.error(f"OpenAI tutor chat failed: {e}. Falling back to default generator.")
        elif client == "gemini" and self.gemini_key:
            try:
                return await self._call_gemini_tutor(skill, user_message, context)
            except Exception as e:
                logger.error(f"Gemini tutor chat failed: {e}. Falling back to default generator.")

        return self._generate_mock_tutor_reply(skill, user_message, context)

    async def _call_openai_tutor(
        self,
        skill: str,
        user_message: str,
        context: Optional[str] = None
    ) -> TutorReply:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_key)
        system_prompt = (
            f"You are Astria's Socratic Senior Staff Engineer AI Tutor mentoring on {skill}. "
            "Provide insightful architectural explanations, concrete production trade-offs, "
            "a high-yield interview tip, and an interactive 4-option mini-quiz with 0-indexed correct option. "
            "Output must be strictly valid JSON matching the TutorReply schema."
        )
        user_content = {
            "skill": skill,
            "user_question": user_message,
            "curriculum_context": context or ""
        }
        completion = await client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content)}
            ],
            temperature=0.3
        )
        raw_json = completion.choices[0].message.content or "{}"
        cleaned = clean_json_response(raw_json)
        reply = TutorReply.model_validate(json.loads(cleaned))
        reply.source = "openai"
        return reply

    async def _call_gemini_tutor(
        self,
        skill: str,
        user_message: str,
        context: Optional[str] = None
    ) -> TutorReply:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        prompt = f"""
        You are Astria's Socratic AI Technical Tutor specializing in {skill}. Return ONLY valid JSON matching this schema:
        {json.dumps(TutorReply.model_json_schema())}

        User Question: {user_message}
        Context: {context or 'Interview preparation'}
        """
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.3}
        }
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=35)
        res.raise_for_status()
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        reply = TutorReply.model_validate_json(clean_json_response(text))
        reply.source = "gemini"
        return reply

    def _generate_mock_tutor_reply(
        self,
        skill: str,
        user_message: str,
        context: Optional[str] = None
    ) -> TutorReply:
        explanation = (
            f"When mastering **{skill}**, the primary architectural trade-off centers on latency, "
            f"fault-tolerance, and state synchronization. In addressing: '{user_message}', "
            f"evaluate how downstream dependencies isolate degradation and fail safely."
        )
        tip = f"Pro Tip for {skill} interviews: Articulate concrete observability strategies (metrics, traces, error budgets) rather than just API definitions."

        quiz = TutorQuiz(
            question=f"Which architectural strategy best mitigates cascading failure when integrating with {skill}?",
            options=[
                "Circuit Breaker with Exponential Backoff",
                "Unbounded In-Memory Retry Queue",
                "Synchronous Blocking RPC Calls",
                "Disabling Connection Timeouts"
            ],
            correct_option_index=0,
            explanation="The Circuit Breaker pattern isolates degraded dependencies by immediately returning fallback responses, preventing resource pool exhaustion."
        )

        return TutorReply(
            explanation=explanation,
            practical_tip=tip,
            mini_quiz=quiz,
            source="mock"
        )


# Global singleton
llm_service = LLMService()
