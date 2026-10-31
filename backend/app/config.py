
import os
from pathlib import Path
from dotenv import load_dotenv

# Locate backend/.env
BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"

# Load environment variables
load_dotenv(dotenv_path=ENV_FILE, override=True)

# Featherless AI configuration
FEATHERLESS_API_KEY = os.getenv(
    "FEATHERLESS_API_KEY", ""
).strip()

FEATHERLESS_BASE_URL = os.getenv(
    "FEATHERLESS_BASE_URL",
    "https://api.featherless.ai/v1"
).strip().rstrip("/")

FEATHERLESS_MODEL = os.getenv(
    "FEATHERLESS_MODEL",
    "Qwen/Qwen2.5-7B-Instruct"
).strip()

# Application configuration
APP_ENV = os.getenv("APP_ENV", "development")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
]

# Job search providers (keys are optional; configure at least one to enable live discovery).
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "").strip()
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "").strip()
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "").strip()