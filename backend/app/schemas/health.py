from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    connected: bool = Field(..., description="Whether database connection succeeded")
    status: str = Field(..., description="Database status ('healthy' or 'unhealthy')")
    container: Optional[str] = Field(None, description="Oracle Container / Pluggable DB name")
    schema_name: Optional[str] = Field(None, description="Active Oracle schema name")
    oracle_version: Optional[str] = Field(None, description="Oracle database release version")
    host: str = Field(..., description="Database host")
    port: int = Field(..., description="Database listener port")
    service: str = Field(..., description="Oracle service name")
    message: str = Field(..., description="Human-readable connection message")
    error_code: Optional[int] = Field(None, description="Oracle error code if failed")
    error_message: Optional[str] = Field(None, description="Detailed error message if failed")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall API health status ('ok' or 'degraded')")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="API version")
    database: DatabaseHealth = Field(..., description="Oracle database health details")
