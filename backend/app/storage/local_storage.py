from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Any, Dict, List

from app.core.logging import get_logger

logger = get_logger(__name__)


class LocalStorageService:
    """Local file storage service for development/testing."""
    
    def __init__(self, base_path: str = "/app/storage"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    async def save_reference_photos(
        self,
        files: List[tuple],
        user_id: str,
        model_name: str,
    ) -> Dict[str, Any]:
        """Save reference photos to local storage."""
        saved_files = []
        errors = []
        
        user_dir = self.base_path / "reference_photos" / user_id / model_name
        user_dir.mkdir(parents=True, exist_ok=True)
        
        for file_content, filename in files:
            try:
                file_id = str(uuid.uuid4())
                file_ext = filename.split(".")[-1] if "." in filename else "jpg"
                safe_filename = f"{file_id}.{file_ext}"
                file_path = user_dir / safe_filename
                
                with open(file_path, "wb") as f:
                    f.write(file_content)
                
                saved_files.append({
                    "filename": safe_filename,
                    "path": str(file_path),
                    "original_name": filename,
                })
            except Exception as e:
                logger.error(f"Failed to save {filename}: {str(e)}")
                errors.append(f"Failed to save {filename}: {str(e)}")
        
        if errors and not saved_files:
            return {
                "ok": False,
                "error": "; ".join(errors),
                "saved_count": 0,
            }
        
        return {
            "ok": True,
            "saved": saved_files,
            "saved_count": len(saved_files),
            "errors": errors if errors else None,
            "storage_type": "local",
        }
    
    def get_file_path(self, user_id: str, model_name: str, filename: str) -> Path:
        """Get the full path for a file."""
        return self.base_path / "reference_photos" / user_id / model_name / filename
    
    def file_exists(self, user_id: str, model_name: str, filename: str) -> bool:
        """Check if a file exists."""
        return self.get_file_path(user_id, model_name, filename).exists()
    
    def delete_file(self, user_id: str, model_name: str, filename: str) -> Dict[str, Any]:
        """Delete a file from local storage."""
        try:
            file_path = self.get_file_path(user_id, model_name, filename)
            if file_path.exists():
                file_path.unlink()
                return {"ok": True}
            return {"ok": False, "error": "File not found"}
        except Exception as e:
            logger.error(f"Failed to delete {filename}: {str(e)}")
            return {"ok": False, "error": str(e)}


# Alias for backwards compatibility
LocalStorage = LocalStorageService
