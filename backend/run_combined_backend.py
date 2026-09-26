import sys
import os
import uvicorn

backend_dir = os.path.dirname(os.path.abspath(__file__))
ai_dir = os.path.abspath(os.path.join(backend_dir, "..", "..", "resume-builder-ai"))
sys.path = [backend_dir, ai_dir] + [p for p in sys.path if p not in (backend_dir, ai_dir)]

import main as astria_main
from app.routes.ai_routes import router as ai_resume_router

# Include the AI resume builder endpoints
astria_main.app.include_router(ai_resume_router)

if __name__ == "__main__":
    print("=" * 60)
    print("ASTRIA FULL-STACK BACKEND + AI RESUME ASSISTANT")
    print("Running on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(astria_main.app, host="0.0.0.0", port=8000)
