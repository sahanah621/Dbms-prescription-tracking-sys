from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Oracle Database Settings
    ORACLE_USER: str = "PDBADMIN"
    ORACLE_PASSWORD: Optional[str] = None
    ORACLE_HOST: str = "localhost"
    ORACLE_PORT: int = 1521
    ORACLE_SERVICE: str = "XEPDB1"
    ORACLE_CLIENT_LIB_DIR: Optional[str] = r"C:\app\sadha\product\21c\dbhomeXE\bin"

    # Application Settings
    APP_NAME: str = "Prescription Tracking System API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def dsn(self) -> str:
        return f"{self.ORACLE_HOST}:{self.ORACLE_PORT}/{self.ORACLE_SERVICE}"


settings = Settings()
