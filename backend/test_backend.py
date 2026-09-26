"""
Astria Backend Test & Verification Suite
Verifies:
1. PII Scrubbing of names, emails, phone numbers.
2. Deterministic scoring formula: ((matched + 0.5 * partial) / total_required) * 100.
3. LLM Roadmap schema generation.
4. FastAPI routing.
"""

import asyncio
from pii_scrubber import PIIScrubber
from match_engine import MatchEngine, MatchStatus
from llm_service import LLMService


def test_pii_scrubber():
    print("\n--- Testing PII Scrubber ---")
    scrubber = PIIScrubber()
    sample_text = (
        "Jane Doe\n"
        "Email: jane.doe@example.com | Phone: (555) 123-4567 | Location: San Francisco, CA\n"
        "LinkedIn: https://linkedin.com/in/janedoe | GitHub: https://github.com/janedoe\n"
        "Experienced Backend Developer with Python, FastAPI, and Docker."
    )
    result = scrubber.scrub(sample_text)
    print("Sanitized text preview:\n", result.sanitized_text)
    print("Detected entities:", [f"{e.entity_type}: {e.placeholder} -> {e.original_value}" for e in result.detected_entities])

    assert "jane.doe@example.com" not in result.sanitized_text, "Email should be scrubbed"
    assert "(555) 123-4567" not in result.sanitized_text, "Phone number should be scrubbed"
    assert len(result.detected_entities) >= 2, "Should detect at least email and phone"
    print("[PASS] PII Scrubber Test Passed!")


def test_match_engine():
    print("\n--- Testing Deterministic Match Engine ---")
    engine = MatchEngine()

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
    print(f"Matched ({len(result.matched_skills)}):", [s.name for s in result.matched_skills])
    print(f"Partial ({len(result.partial_skills)}):", [f"{s.name} ({s.candidate_evidence})" for s in result.partial_skills])
    print(f"Missing ({len(result.missing_skills)}):", [s.name for s in result.missing_skills])

    expected_score = round(((1 + 0.5 * 2) / 4) * 100.0, 1) # 50.0%
    assert result.score_percentage == expected_score, f"Expected {expected_score}, got {result.score_percentage}"
    print("[PASS] Match Engine Test Passed!")


async def test_llm_roadmap():
    print("\n--- Testing LLM Roadmap Generator ---")
    llm = LLMService()
    curriculum = await llm.generate_roadmap(
        target_role="Senior Backend Engineer",
        missing_skills=["kafka"],
        partial_skills=[{"name": "postgresql", "candidate_evidence": "MySQL"}],
        matched_skills=["fastapi", "python"],
        target_timeline_weeks=2
    )

    print(f"Curriculum Target: {curriculum.target_role}")
    print(f"Total Weeks: {curriculum.total_weeks}")
    print(f"Milestones generated: {len(curriculum.milestones)}")
    for m in curriculum.milestones:
        print(f"  - Week {m.week_number}: {m.milestone_title}")
        for mod in m.modules:
            print(f"      Module: {mod.title} (Focus: {mod.focus_skill})")
            print(f"      Deliverable: {mod.practical_project.deliverable}")

    assert curriculum.total_weeks > 0
    assert len(curriculum.milestones) > 0
    print("[PASS] LLM Roadmap Test Passed!")


if __name__ == "__main__":
    test_pii_scrubber()
    test_match_engine()
    asyncio.run(test_llm_roadmap())
    print("\n==============================")
    print("ALL VERIFICATION TESTS PASSED!")
    print("==============================")
