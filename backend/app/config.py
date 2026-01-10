"""
GeoHIS Centralized Configuration

Manages environment-based configuration with validation.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Application
    app_name: str = "GeoHIS API"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", description="Environment: development, staging, production")
    debug: bool = Field(default=False, description="Debug mode - disable in production")
    
    # Database
    database_url: str = Field(
        default="postgresql://user:password@localhost/geohis",
        description="PostgreSQL connection URL"
    )
    db_pool_size: int = Field(default=20, description="Database connection pool size")
    db_max_overflow: int = Field(default=30, description="Max overflow connections")
    db_pool_timeout: int = Field(default=30, description="Pool connection timeout in seconds")
    
    # Authentication
    secret_key: str = Field(
        default="change-this-to-a-secure-random-key-in-production",
        description="JWT secret key - MUST be changed in production"
    )
    algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token lifetime in minutes")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token lifetime in days")
    
    # CORS
    cors_origins: str = Field(
        default="http://localhost:3001,http://localhost:8081",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, description="Default requests per minute")
    rate_limit_upload: int = Field(default=10, description="Upload requests per minute")
    rate_limit_auth: int = Field(default=5, description="Auth requests per minute (login/register)")
    
    # File Upload
    max_upload_size_mb: int = Field(default=50, description="Maximum file upload size in MB")
    max_coordinates_per_request: int = Field(default=10000, description="Maximum coordinates per analysis request")
    
    # Redis (for caching and rate limiting)
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    cache_enabled: bool = Field(default=True, description="Enable caching")
    cache_ttl_seconds: int = Field(default=300, description="Default cache TTL in seconds")
    
    # Background Tasks
    celery_broker_url: str = Field(default="redis://localhost:6379/1", description="Celery broker URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/2", description="Celery result backend")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def max_upload_size_bytes(self) -> int:
        """Get max upload size in bytes."""
        return self.max_upload_size_mb * 1024 * 1024
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"
    
    def validate_production(self) -> None:
        """Validate settings for production environment."""
        if self.is_production:
            if "change-this" in self.secret_key.lower():
                raise ValueError("SECRET_KEY must be changed in production!")
            if self.debug:
                raise ValueError("DEBUG must be False in production!")
            if "password" in self.database_url.lower():
                raise ValueError("Database password must be changed in production!")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to avoid repeatedly reading from environment.
    """
    settings = Settings()
    settings.validate_production()
    return settings


# Convenience instance
settings = get_settings()
