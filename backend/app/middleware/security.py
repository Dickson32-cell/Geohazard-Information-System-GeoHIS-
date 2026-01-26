"""
Security Middleware for GeoHIS

Implements security headers and input sanitization.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import re
import html
from typing import Optional


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.
    
    Adds headers recommended by OWASP for web application security.
    """
    
    def __init__(self, app: ASGIApp, csp_enabled: bool = True):
        super().__init__(app)
        self.csp_enabled = csp_enabled
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )
        
        # Content Security Policy (if enabled)
        if self.csp_enabled:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none';"
            )
        
        # Strict Transport Security (for HTTPS)
        # Only add if request came over HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        return response


def sanitize_string(value: str) -> str:
    """
    Sanitize a string input to prevent XSS attacks.
    
    Args:
        value: Input string to sanitize
        
    Returns:
        Sanitized string with HTML entities escaped
    """
    if not value:
        return value
    
    # Escape HTML entities
    sanitized = html.escape(value, quote=True)
    
    # Remove any potential script tags that might have been double-encoded
    sanitized = re.sub(r'&lt;script.*?&gt;.*?&lt;/script&gt;', '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    
    return sanitized


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Safe filename with dangerous characters removed
    """
    if not filename:
        return filename
    
    # Remove path separators
    filename = filename.replace("/", "_").replace("\\", "_")
    
    # Remove null bytes
    filename = filename.replace("\x00", "")
    
    # Remove special characters that could be problematic
    filename = re.sub(r'[<>:"|?*]', '_', filename)
    
    # Ensure filename doesn't start with a dot (hidden files)
    while filename.startswith('.'):
        filename = filename[1:]
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        max_name_len = 255 - len(ext) - 1

        filename = name[:max_name_len] + ('.' + ext if ext else '')
    
    return filename or "unnamed_file"


def validate_content_type(content_type: Optional[str], allowed_types: list) -> bool:
    """
    Validate that a content type is in the allowed list.
    
    Args:
        content_type: Content-Type header value
        allowed_types: List of allowed MIME types
        
    Returns:
        True if content type is allowed
    """
    if not content_type:
        return False
    
    # Extract base content type (without charset, etc.)
    base_type = content_type.split(";")[0].strip().lower()
    
    return base_type in [t.lower() for t in allowed_types]


# Allowed file types for GeoJSON uploads
ALLOWED_GEOJSON_TYPES = [
    "application/json",
    "application/geo+json",
    "text/json",
    "application/octet-stream"  # Some browsers send this for .geojson
]

# Maximum file sizes by type
FILE_SIZE_LIMITS = {
    "geojson": 50 * 1024 * 1024,  # 50 MB
    "csv": 10 * 1024 * 1024,      # 10 MB
    "default": 5 * 1024 * 1024    # 5 MB
}


def get_file_size_limit(filename: str) -> int:
    """
    Get the file size limit based on file extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        Maximum allowed size in bytes
    """
    if not filename:
        return FILE_SIZE_LIMITS["default"]
    
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if ext in ["geojson", "json"]:
        return FILE_SIZE_LIMITS["geojson"]
    elif ext == "csv":
        return FILE_SIZE_LIMITS["csv"]
    else:
        return FILE_SIZE_LIMITS["default"]
