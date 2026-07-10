from pathlib import Path
# from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    GROQ_API_KEY: str
    BREVO_API_KEY: str

    EMAIL_ADDRESS: str
    EMAIL_PASSWORD: str

    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'quiz.db'}"

    FRONTEND_URL: str
    BACKEND_URL: str
    FRONTEND_PREVIEW_URL: str = "http://localhost:4173"

    GROQ_MODEL:str

    CHROMA_DB: str = str(BACKEND_DIR / "chroma_db")

     
    model_config = SettingsConfigDict(
    env_file=BACKEND_DIR / ".env",
    extra="ignore",
)


settings = Settings()