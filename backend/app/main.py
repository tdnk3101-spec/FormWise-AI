import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base
from app.models import models # Ensure models are loaded

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="FormWise AI: Understand. Fill. Verify. Apply. — Master API"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
from app.api.v1 import auth, users, documents, forms, autofill, validation, history, admin

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users & Profile"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Document Vault"])
app.include_router(forms.router, prefix=f"{settings.API_V1_STR}/forms", tags=["Form Understanding"])
app.include_router(autofill.router, prefix=f"{settings.API_V1_STR}/forms", tags=["Smart Autofill"])
app.include_router(validation.router, prefix=f"{settings.API_V1_STR}/forms", tags=["Validation & Export"])
app.include_router(history.router, prefix=f"{settings.API_V1_STR}/history", tags=["Application History"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin Portal"])

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "storage": "ready",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_configured": bool(settings.LLM_API_KEY)
    }

# Unified Frontend SPA & Static File Serving
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/favicon.svg", include_in_schema=False)
    def favicon():
        fav = os.path.join(FRONTEND_DIST, "favicon.svg")
        if os.path.exists(fav):
            return FileResponse(fav)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/icons.svg", include_in_schema=False)
    def icons():
        ic = os.path.join(FRONTEND_DIST, "icons.svg")
        if os.path.exists(ic):
            return FileResponse(ic)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/", include_in_schema=False)
    def serve_root():
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index_file)

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build not found")
else:
    @app.get("/")
    def root():
        return {
            "app": settings.APP_NAME,
            "tagline": "Understand. Fill. Verify. Apply.",
            "status": "operational",
            "version": "1.0.0"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
