import os
from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

# Search for and load .env from current directory or project root
for candidate in [".env", "../.env", "../../.env", os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")]:
    abs_candidate = os.path.abspath(candidate)
    if os.path.exists(abs_candidate):
        load_dotenv(abs_candidate, override=True)
        break

class Settings(BaseSettings):
    APP_NAME: str = "FormWise AI"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "formwise-ai-super-secret-production-key-2026-secure-jwt")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./formwise.db")
    
    # Supabase (Optional for local dev, used if configured)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET", None)
    
    # AI Engine (Groq, Gemini, OpenAI, or heuristic_local)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY", os.getenv("GROQ_API_KEY", os.getenv("GEMINI_API_KEY", None)))
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    
    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", os.path.abspath("./backend_storage"))
    MAX_UPLOAD_SIZE_MB: int = 25
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @property
    def effective_llm_provider(self) -> str:
        if self.LLM_API_KEY:
            key = self.LLM_API_KEY.strip()
            if key.startswith("gsk_"):
                return "groq"
            elif key.startswith("AIza"):
                return "gemini"
            elif key.startswith("sk-"):
                return "openai"
        return self.LLM_PROVIDER.lower()

    @property
    def effective_llm_model(self) -> str:
        provider = self.effective_llm_provider
        if provider == "groq":
            # If default was gemini model, switch to Groq model
            if not self.LLM_MODEL or "gemini" in self.LLM_MODEL:
                return "openai/gpt-oss-120b"
        return self.LLM_MODEL

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "vault"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "forms"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "exports"), exist_ok=True)
