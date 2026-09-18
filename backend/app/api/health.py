from fastapi import APIRouter, Response, status
from app.config import settings
from app.database import check_oracle_connection
from app.schemas.health import DatabaseHealth, HealthResponse

router = APIRouter(tags=["System Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System and Oracle Database Health Check",
    description="Checks the backend operational status and verifies active connectivity to Oracle 21c XE (XEPDB1).",
    responses={
        200: {"description": "Backend is running and Oracle connection succeeded"},
        503: {"description": "Backend is running but Oracle connection failed"},
    },
)
def get_health(response: Response) -> HealthResponse:
    """
    Verify backend status and active connectivity to Oracle XEPDB1.
    Returns HTTP 200 if connected, or HTTP 503 if database connectivity fails.
    """
    db_result = check_oracle_connection()
    is_db_connected = db_result.get("connected", False)

    if not is_db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    db_health = DatabaseHealth(
        connected=is_db_connected,
        status=db_result.get("status", "unhealthy"),
        container=db_result.get("container"),
        schema_name=db_result.get("schema"),
        oracle_version=db_result.get("oracle_version"),
        host=db_result.get("host", settings.ORACLE_HOST),
        port=db_result.get("port", settings.ORACLE_PORT),
        service=db_result.get("service", settings.ORACLE_SERVICE),
        message=db_result.get("message", ""),
        error_code=db_result.get("error_code"),
        error_message=db_result.get("error_message"),
    )

    return HealthResponse(
        status="ok" if is_db_connected else "degraded",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        database=db_health,
    )
