"""
GeoHIS Database Configuration

Production-ready database configuration with connection pooling
and environment-based settings.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decouple import config
import logging

logger = logging.getLogger(__name__)

# Database configuration from environment
DATABASE_URL = config("DATABASE_URL", default="sqlite:///./geohis.db")
ENVIRONMENT = config("ENVIRONMENT", default="development")

# Connection pool settings
POOL_SIZE = config("DB_POOL_SIZE", default=20, cast=int)
MAX_OVERFLOW = config("DB_MAX_OVERFLOW", default=30, cast=int)
POOL_TIMEOUT = config("DB_POOL_TIMEOUT", default=30, cast=int)

# Determine if using SQLite (for development)
is_sqlite = DATABASE_URL.startswith("sqlite")

# Create engine with appropriate settings
if is_sqlite:
    # SQLite doesn't support connection pooling the same way
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Disable SQL logging in production
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL with connection pooling
    engine = create_engine(
        DATABASE_URL,
        echo=ENVIRONMENT == "development",  # Only log SQL in development
        pool_pre_ping=True,  # Verify connections before use
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_timeout=POOL_TIMEOUT,
        pool_recycle=1800,  # Recycle connections after 30 minutes
    )

# Log database configuration (without password)
safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
logger.info(f"Database configured: {safe_url}")

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependency to get database session.
    
    Yields a database session and ensures proper cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    
    Creates all tables defined by SQLAlchemy models.
    """
    from app.models.models import Base
    from app.auth.models import User, RefreshToken
    
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")


def check_db_connection() -> bool:
    """
    Check if database connection is working.
    
    Returns:
        True if connection is successful, False otherwise
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False