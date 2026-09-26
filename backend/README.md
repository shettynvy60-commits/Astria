# Astria Backend Service

FastAPI-powered privacy-first backend for resume gap analysis, deterministic scoring, and pedagogical roadmaps.

## Architecture

- **`pii_scrubber.py`**: Local PII sanitization using Microsoft Presidio & spaCy with regex fallback. Strips names, emails, phone numbers, and developer profiles with zero external network leakage.
- **`match_engine.py`**: Deterministic score calculator implementing:
  $$\text{Match Score (\%)} = \left( \frac{\text{matched} + 0.5 \times \text{partial}}{\text{total\_required}} \right) \times 100$$
- **`llm_service.py`**: Pedagogical curriculum generator targeting missing/partial skills using structured JSON schema. Connects to OpenAI or Google Gemini (with intelligent offline mock fallback).
- **`main.py`**: FastAPI application exposing `/api/analyze`, `/api/generate-roadmap`, `/api/tailor-resume`, and `/api/tutor/chat`.

## Getting Started

### 1. Set Up Environment

```powershell
cd g:\astria\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Configure Environment Variables (Optional)

Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Add your `OPENAI_API_KEY` or `GEMINI_API_KEY`. If left blank, Astria activates its built-in realistic pedagogical generator for offline development.

### 3. Run the Server

```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Or simply double-click `run_backend.bat`.

### 4. Interactive API Documentation

Visit:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
