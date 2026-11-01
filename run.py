"""
FormWise AI — Single Unified Server Launcher
Runs the complete full-stack application (Frontend + Backend + AI) on http://localhost:8000
"""
import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# Ensure backend is on PYTHONPATH
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

def ensure_frontend_built():
    """Ensure frontend production build exists."""
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if not os.path.exists(index_html):
        print("Frontend build not found. Building frontend production bundle now...")
        frontend_dir = os.path.join(ROOT_DIR, "frontend")
        try:
            subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True, shell=True)
            print("Frontend built successfully!")
        except Exception as e:
            print(f"Warning: Failed to build frontend automatically: {e}")

def main():
    ensure_frontend_built()

    print("\n" + "=" * 62)
    print("      FormWise AI — Unified Full-Stack Application")
    print("      Understand. Fill. Verify. Apply.")
    print("=" * 62)
    print("  * Unified Web App & API: http://localhost:8000")
    print("  * Interactive API Docs:  http://localhost:8000/docs")
    print("  * Frontend SPA:          Directly served from single port")
    print("=" * 62 + "\n")

    import uvicorn
    # Change working directory to backend so relative paths in config resolve
    os.chdir(BACKEND_DIR)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
