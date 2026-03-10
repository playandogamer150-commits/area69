from __future__ import annotations

from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class R2StorageService:
    def __init__(self) -> None:
        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
        self.bucket_name = settings.R2_BUCKET_NAME

    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str = "application/octet-stream",
        is_public: bool = True,
    ) -> Dict[str, Any]:
        """Upload a single file to Cloudflare R2."""
        try:
            extra_args = {"ContentType": content_type}
            if is_public:
                extra_args["ACL"] = "public-read"
            
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=file_name,
                Body=file_content,
                **extra_args,
            )
            
            base_url = settings.R2_PUBLIC_BASE_URL.rstrip("/") if settings.R2_PUBLIC_BASE_URL else f"https://pub-{settings.R2_ACCOUNT_ID}.r2.dev"
            public_url = f"{base_url}/{file_name}"
            
            return {
                "ok": True,
                "file_url": public_url,
                "file_name": file_name,
                "content_type": content_type,
            }
        except ClientError as e:
            logger.error(f"R2 upload failed: {str(e)}")
            return {"ok": False, "error": str(e)}

    async def upload_file_async(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str = "application/octet-stream",
        is_public: bool = True,
    ) -> Dict[str, Any]:
        """Async version of upload_file."""
        return self.upload_file(file_content, file_name, content_type, is_public)

    def upload_reference_photos(
        self,
        files: List[tuple],
        user_id: str,
        model_name: str,
    ) -> Dict[str, Any]:
        """Upload multiple reference photos for LoRA training."""
        uploaded_urls = []
        errors = []
        
        for file_content, file_name in files:
            safe_name = file_name.replace(" ", "_")
            storage_path = f"users/{user_id}/{model_name}/{safe_name}"
            
            result = self.upload_file(
                file_content=file_content,
                file_name=storage_path,
                content_type="image/jpeg",
                is_public=False,
            )
            
            if result.get("ok"):
                uploaded_urls.append(result["file_url"])
            else:
                errors.append(f"Failed to upload {file_name}: {result.get('error')}")
        
        if errors and not uploaded_urls:
            return {"ok": False, "error": "; ".join(errors), "uploaded_count": 0}
        
        return {
            "ok": True,
            "file_urls": uploaded_urls,
            "count": len(uploaded_urls),
            "errors": errors if errors else None,
        }

    def download_file(self, file_name: str) -> Optional[bytes]:
        """Download a file from R2."""
        try:
            response = self.client.get_object(
                Bucket=self.bucket_name,
                Key=file_name,
            )
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"R2 download failed: {str(e)}")
            return None

    def delete_file(self, file_name: str) -> Dict[str, Any]:
        """Delete a file from R2."""
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=file_name,
            )
            return {"ok": True}
        except ClientError as e:
            logger.error(f"R2 delete failed: {str(e)}")
            return {"ok": False, "error": str(e)}

    def generate_presigned_url(
        self,
        file_name: str,
        expiration: int = 3600,
    ) -> Dict[str, Any]:
        """Generate a presigned URL for private files."""
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": file_name,
                },
                ExpiresIn=expiration,
            )
            return {"ok": True, "url": url}
        except ClientError as e:
            logger.error(f"R2 presigned URL failed: {str(e)}")
            return {"ok": False, "error": str(e)}

    def list_files(self, prefix: str = "") -> Dict[str, Any]:
        """List files in a bucket with optional prefix."""
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
            )
            
            files = []
            if "Contents" in response:
                for obj in response["Contents"]:
                    files.append({
                        "key": obj["Key"],
                        "size": obj["Size"],
                        "last_modified": obj["LastModified"].isoformat(),
                    })
            
            return {"ok": True, "files": files, "count": len(files)}
        except ClientError as e:
            logger.error(f"R2 list failed: {str(e)}")
            return {"ok": False, "error": str(e)}

    def copy_file(self, source_key: str, dest_key: str) -> Dict[str, Any]:
        """Copy a file within R2."""
        try:
            copy_source = {"Bucket": self.bucket_name, "Key": source_key}
            self.client.copy_object(
                Bucket=self.bucket_name,
                Key=dest_key,
                CopySource=copy_source,
            )
            return {"ok": True}
        except ClientError as e:
            logger.error(f"R2 copy failed: {str(e)}")
            return {"ok": False, "error": str(e)}


class R2Storage(R2StorageService):
    """Alias for backwards compatibility."""
    pass
