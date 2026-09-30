# Astria Frontend

React 18 + Vite + Tailwind CSS dark-mode dashboard for resume gap analysis, deterministic scoring, and pedagogical roadmaps.

## Components

- **`FileUpload.jsx`**: PDF drag-and-drop file picker and raw text paste area with instant demo presets (Backend Engineer, Full Stack Engineer).
- **`ScoreGauge.jsx`**: SVG animated radial gauge displaying the deterministic match score `(Matched + 0.5 * Partial) / Required`.
- **`SkillBadges.jsx`**: Color-coded category tags for Matched (Green), Partial (Amber), and Missing (Red) with transferable skill rationale.
- **`RoadmapView.jsx`**: Interactive week-by-week learning curriculum with hands-on mini-projects, interview prep questions, and curated documentation.
- **`TailoredResume.jsx`**: ATS-optimized resume bullet points in STAR format with one-click copy and strategic framing.

## Running Locally

```powershell
cd g:\astria\frontend
npm install
npm run dev
```

The frontend dev server will launch at [http://localhost:5173](http://localhost:5173) with automatic proxying to the FastAPI backend at `http://localhost:8000`.
