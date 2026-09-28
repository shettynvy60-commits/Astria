import sys
import os
import uvicorn

# Ensure the backend directory is on sys.path so both Astria core
# and the ai_module package resolve correctly.
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# main.py already mounts the AI Resume Assistant router via:
#   from ai_module.routes.ai_routes import router as ai_resume_router
#   app.include_router(ai_resume_router)
import main as astria_main

if __name__ == "__main__":
    print("=" * 60)
    print("ASTRIA FULL-STACK BACKEND + AI RESUME ASSISTANT")
    print("Running on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(astria_main.app, host="0.0.0.0", port=8000)
