"""
Astria Backend Test & Verification Suite
Comprehensive tests covering:
1. PII Scrubbing, email sentence boundary handling, and collision-free unscrubbing.
2. Deterministic ATS scoring formula: ((matched + 0.5 * partial) / total_required) * 100.
3. Skill extraction with false-positive elimination ('go', 'react', 'rest', 'js') and symbol boundaries ('c++', 'c#', 'ci/cd').
4. Zero-dependency native DOCX parser text extraction.
5. LLM Roadmap, Resume Tailoring, and Socratic AI Tutor responses.
"""

import asyncio
import io
import zipfile
from pii_scrubber import PIIScrubber
from match_engine import MatchEngine, MatchStatus
from llm_service import LLMService, clean_json_response
from main import extract_text_from_upload


def test_pii_scrubber():
    print("\n--- Testing PII Scrubber & Email Boundary & Unscrubbing ---")
    scrubber = PIIScrubber()
    sample_text = (
        "Jane Doe\n"
        "Email: jane.doe@example.com. Phone: (555) 123-4567. Location: San Francisco, CA.\n"
        "LinkedIn: https://linkedin.com/in/janedoe | GitHub: https://github.com/janedoe\n"
        "Experienced Backend Developer with Python, FastAPI, and Docker."
    )
    result = scrubber.scrub(sample_text)
    print("Sanitized text preview:\n", result.sanitized_text)

    # 1. Check email was scrubbed without swallowing trailing period
    assert "jane.doe@example.com" not in result.sanitized_text, "Email should be scrubbed"
    assert "<EMAIL_ADDRESS_1>." in result.sanitized_text or "[EMAIL_ADDRESS]." in result.sanitized_text, "Trailing period after email must be preserved"

    # 2. Check phone was scrubbed without swallowing trailing period
    assert "(555) 123-4567" not in result.sanitized_text, "Phone number should be scrubbed"
    assert "<PHONE_NUMBER_1>." in result.sanitized_text or "[PHONE_NUMBER]." in result.sanitized_text, "Trailing period after phone must be preserved"

    # 3. Check perfect restoration
    restored = scrubber.restore(result.sanitized_text, result.mapping)
    assert restored == sample_text, "Restored text must match original text exactly"

    # 4. Check token collision safety (<PERSON_1> vs <PERSON_10>)
    collision_map = {"<PERSON_1>": "Alice", "<PERSON_10>": "Bob"}
    collision_test = "Candidates: <PERSON_1> and <PERSON_10>"
    restored_collision = scrubber.restore(collision_test, collision_map)
    assert restored_collision == "Candidates: Alice and Bob", f"Failed collision test: {restored_collision}"

    print("[PASS] PII Scrubber & Unscrubbing Tests Passed!")


def test_match_engine():
    print("\n--- Testing Deterministic Match Engine & False Positive Prevention ---")
    engine = MatchEngine()

    # 1. Test ATS Mathematical Formula
    resume = (
        "Backend engineer with 4 years of experience building APIs with FastAPI, Python, and MySQL. "
        "Proficient with Docker and Git."
    )
    custom_required = ["fastapi", "postgresql", "kubernetes", "kafka"]
    result = engine.evaluate_match(
        resume_text=resume,
        job_description_text="",
        custom_required=custom_required
    )

    print(f"Calculated Score: {result.score_percentage}%")
    print(f"Audit expression: {result.audit.audit_expression}")
    expected_score = round(((1 + 0.5 * 2) / 4) * 100.0, 1)  # 50.0%
    assert result.score_percentage == expected_score, f"Expected {expected_score}, got {result.score_percentage}"

    # 2. Test False Positive Prevention on Natural English Sentences
    s1 = engine.extract_skills_from_text("We go above and beyond to deliver customer satisfaction.")
    assert "go" not in s1, f"'go' falsely matched in regular sentence: {s1}"

    s2 = engine.extract_skills_from_text("Ability to react quickly under high-pressure incidents.")
    assert "react" not in s2, f"'react' falsely matched in regular sentence: {s2}"

    s3 = engine.extract_skills_from_text("The rest of the team will handle the deployment.")
    assert "rest" not in s3, f"'rest' falsely matched in regular sentence: {s3}"

    s4 = engine.extract_skills_from_text("We build our client interfaces with Next.js and Vue.js.")
    assert "javascript" not in s4, f"'javascript' falsely matched by .js extension: {s4}"
    assert "next.js" in s4, "next.js should be detected"
    assert "vue" in s4, "vue should be detected"

    # 3. Test Recognition of Programming Languages and Symbols
    s5 = engine.extract_skills_from_text(
        "Senior Engineer proficient in Golang, React.js, REST APIs, C++, CI/CD pipelines, and C#."
    )
    expected_skills = {"go", "react", "rest", "c++", "ci/cd", "c#"}
    assert expected_skills.issubset(s5), f"Failed to extract symbols: missing {expected_skills - s5}"

    print("[PASS] Match Engine & False-Positive Prevention Tests Passed!")


def test_docx_parser():
    print("\n--- Testing Native Zero-Dependency DOCX Parser ---")
    # Build synthetic in-memory DOCX file
    docx_buffer = io.BytesIO()
    with zipfile.ZipFile(docx_buffer, "w") as z:
        sample_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body>'
            '<w:p><w:r><w:t>John Doe Resume</w:t></w:r></w:p>'
            '<w:p><w:r><w:t>Backend Software Engineer with Python and Docker experience.</w:t></w:r></w:p>'
            '</w:body>'
            '</w:document>'
        )
        z.writestr("word/document.xml", sample_xml)

    extracted = extract_text_from_upload(docx_buffer.getvalue(), "john_doe_resume.docx")
    print("Extracted DOCX Text:\n", extracted)
    assert "John Doe Resume" in extracted
    assert "Backend Software Engineer" in extracted
    print("[PASS] Native DOCX Parser Test Passed!")


async def test_llm_services():
    print("\n--- Testing LLM Roadmap, Resume Tailoring & Tutor Chat ---")
    llm = LLMService()

    # 1. Clean JSON response helper
    fenced_json = '```json\n{"status": "ok", "count": 42}\n```'
    assert clean_json_response(fenced_json) == '{"status": "ok", "count": 42}'

    # 2. Roadmap Generation
    curriculum = await llm.generate_roadmap(
        target_role="Senior Backend Engineer",
        missing_skills=["kafka"],
        partial_skills=[{"name": "postgresql", "candidate_evidence": "MySQL"}],
        matched_skills=["fastapi", "python"],
        target_timeline_weeks=2
    )
    assert curriculum.total_weeks > 0
    assert len(curriculum.milestones) > 0
    print(f"Generated {len(curriculum.milestones)} milestones for {curriculum.target_role}")

    # 3. Resume Tailoring
    tailored = await llm.tailor_resume_bullets(
        sanitized_resume_text="Worked with MySQL and Redis.",
        target_role="Senior Backend Engineer",
        partial_skills=[{"name": "postgresql", "candidate_evidence": "MySQL"}],
        matched_skills=["fastapi"]
    )
    assert len(tailored.bullet_points) > 0
    print(f"Generated {len(tailored.bullet_points)} tailored bullet points")

    # 4. Socratic AI Tutor Chat
    reply = await llm.tutor_chat(
        skill="Apache Kafka",
        user_message="How do consumer groups handle partition rebalancing without dropped messages?",
        context="Week 2 Kafka Deep Dive"
    )
    assert reply.explanation is not None
    assert reply.mini_quiz is not None
    assert len(reply.mini_quiz.options) == 4
    print("Tutor Reply Quiz Question:", reply.mini_quiz.question)

    print("[PASS] LLM Roadmap, Tailoring & Tutor Tests Passed!")


if __name__ == "__main__":
    test_pii_scrubber()
    test_match_engine()
    test_docx_parser()
    asyncio.run(test_llm_services())
    print("\n" + "=" * 45)
    print("ALL ASTRIA BACKEND VERIFICATION TESTS PASSED!")
    print("=" * 45)
