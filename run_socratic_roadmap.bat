@echo off
title Astria Roadmap Socratic Edition (Port 5174)
echo ========================================================
echo Starting Astria Roadmap Socratic Edition on Port 5174...
echo (Your original localhost on 5173 remains untouched)
echo ========================================================
cd /d "%~dp0roadmap_socratic_app"
call npm.cmd run dev
pause
