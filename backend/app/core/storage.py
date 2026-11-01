import os
import shutil
import uuid
from typing import Tuple
from fastapi import HTTPException, UploadFile
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
}

class StorageService:
    @staticmethod
    def _ensure_user_dir(category: str, user_id: str) -> str:
        path = os.path.join(settings.STORAGE_DIR, category, user_id)
        os.makedirs(path, exist_ok=True)
        return path

    @staticmethod
    async def save_upload(file: UploadFile, category: str, user_id: str) -> Tuple[str, str, int]:
        # Validate mime type
        mime = file.content_type
        if mime not in ALLOWED_MIME_TYPES:
            # Fallback by extension
            filename_lower = (file.filename or "").lower()
            if filename_lower.endswith(".pdf"):
                mime = "application/pdf"
            elif filename_lower.endswith((".jpg", ".jpeg")):
                mime = "image/jpeg"
            elif filename_lower.endswith(".png"):
                mime = "image/png"
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type '{file.content_type}'. Allowed types: PDF, JPG, PNG."
                )

        ext = ALLOWED_MIME_TYPES.get(mime, ".bin")
        user_dir = StorageService._ensure_user_dir(category, user_id)
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(user_dir, safe_filename)

        # Standard FastAPI streaming to disk
        try:
            with open(target_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            if os.path.exists(target_path):
                os.remove(target_path)
            raise HTTPException(status_code=500, detail=f"Failed to write file: {str(e)}")

        size = os.path.getsize(target_path)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if size > max_bytes:
            os.remove(target_path)
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        return target_path, mime, size

    @staticmethod
    def delete_file(file_path: str, user_id: str) -> bool:
        if not file_path or not os.path.exists(file_path):
            return False
        # Security check: must reside within user's designated directory
        abs_path = os.path.abspath(file_path)
        expected_base = os.path.abspath(settings.STORAGE_DIR)
        if not abs_path.startswith(expected_base) or user_id not in abs_path:
            raise HTTPException(status_code=403, detail="Unauthorized file deletion path")
        
        try:
            os.remove(abs_path)
            return True
        except Exception:
            return False
