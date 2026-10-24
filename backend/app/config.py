import os
import urllib.parse
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend root directory if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

# Retrieve DATABASE_URL strictly from environment without fallback credentials
raw_db_url = os.getenv("DATABASE_URL")

if not raw_db_url or not raw_db_url.strip():
    raise RuntimeError(
        "CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing or empty. "
        "Please configure DATABASE_URL in your environment or backend/.env file."
    )

DATABASE_URL = raw_db_url.strip()

# Validate URL structure safely without exposing credentials
try:
    parsed_url = urllib.parse.urlparse(DATABASE_URL)
except Exception:
    raise RuntimeError(
        "CRITICAL CONFIGURATION ERROR: DATABASE_URL is malformed. "
        "A valid PostgreSQL connection URL is required (e.g. postgresql+psycopg://...)."
    )

if parsed_url.scheme not in ("postgresql", "postgresql+psycopg", "postgres"):
    scheme_display = parsed_url.scheme or "(none)"
    raise RuntimeError(
        f"CRITICAL CONFIGURATION ERROR: Unsupported database scheme '{scheme_display}'. "
        "DATABASE_URL must start with 'postgresql://' or 'postgresql+psycopg://'."
    )

if not parsed_url.hostname:
    raise RuntimeError(
        "CRITICAL CONFIGURATION ERROR: DATABASE_URL must specify a valid host/hostname."
    )

CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "http://localhost:3001,http://127.0.0.1:3001")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_RAW.split(",") if origin.strip()]

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))
