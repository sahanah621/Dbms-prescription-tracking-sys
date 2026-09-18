import logging
import os
from contextlib import contextmanager
from typing import Any, Dict, Generator, Optional
import oracledb
from app.config import settings

logger = logging.getLogger("backend.database")

# Flag tracking whether Thick Mode client has been initialized
_oracle_client_initialized = False


def init_oracle_client_if_needed() -> bool:
    """Initialize Oracle Thick Mode client if client directory exists and not already initialized."""
    global _oracle_client_initialized
    if _oracle_client_initialized:
        return True

    lib_dir = settings.ORACLE_CLIENT_LIB_DIR
    if lib_dir and os.path.isdir(lib_dir):
        try:
            oracledb.init_oracle_client(lib_dir=lib_dir)
            _oracle_client_initialized = True
            logger.info("Initialized Oracle Client in Thick Mode from: %s", lib_dir)
            return True
        except Exception as exc:
            logger.warning("Could not initialize Oracle Thick Mode client: %s", exc)
            return False
    return False


def create_connection() -> oracledb.Connection:
    """
    Establish a connection to the Oracle database.
    - If ORACLE_PASSWORD is provided: connects via standard user/password authentication.
    - If ORACLE_PASSWORD is not provided: falls back to local OS authentication if Oracle Client is available.
    """
    if settings.ORACLE_PASSWORD:
        logger.debug("Connecting to Oracle as %s via standard authentication", settings.ORACLE_USER)
        return oracledb.connect(
            user=settings.ORACLE_USER,
            password=settings.ORACLE_PASSWORD,
            dsn=settings.dsn,
        )

    # Fallback to local Windows OS authentication if client lib dir is present
    client_ready = init_oracle_client_if_needed()
    if client_ready:
        logger.debug("Connecting to Oracle via local OS authentication (SYSDBA)")
        conn = oracledb.connect(mode=oracledb.SYSDBA, dsn=settings.dsn)
        # Ensure session is pointed to target pluggable DB and schema
        with conn.cursor() as cursor:
            cursor.execute(f"ALTER SESSION SET CONTAINER = {settings.ORACLE_SERVICE}")
            cursor.execute(f"ALTER SESSION SET CURRENT_SCHEMA = {settings.ORACLE_USER}")
        return conn

    raise oracledb.DatabaseError(
        "ORACLE_PASSWORD is not set in backend/.env, and local Oracle Client is unavailable for OS authentication."
    )


@contextmanager
def get_db_connection() -> Generator[oracledb.Connection, None, None]:
    """Context manager for acquiring and safely releasing an Oracle connection."""
    conn = None
    try:
        conn = create_connection()
        yield conn
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception as e:
                logger.warning("Error closing Oracle connection: %s", e)


def check_oracle_connection() -> Dict[str, Any]:
    """
    Execute a health check against Oracle XEPDB1.
    Tests basic connectivity, retrieves database version, active container, and schema.
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1 FROM dual")
                ping_result = cursor.fetchone()

                cursor.execute(
                    "SELECT sys_context('USERENV', 'CON_NAME'), sys_context('USERENV', 'CURRENT_SCHEMA') FROM dual"
                )
                con_name, schema_name = cursor.fetchone()

            return {
                "connected": True,
                "status": "healthy",
                "ping": ping_result[0] if ping_result else None,
                "container": con_name,
                "schema": schema_name,
                "oracle_version": conn.version,
                "host": settings.ORACLE_HOST,
                "port": settings.ORACLE_PORT,
                "service": settings.ORACLE_SERVICE,
                "message": "Successfully connected to Oracle Database",
            }
    except oracledb.DatabaseError as db_err:
        error_obj = db_err.args[0] if db_err.args else None
        error_msg = getattr(error_obj, "message", str(db_err))
        error_code = getattr(error_obj, "code", None)
        logger.error("Oracle connection error [%s]: %s", error_code, error_msg)
        return {
            "connected": False,
            "status": "unhealthy",
            "error_code": error_code,
            "error_message": error_msg,
            "host": settings.ORACLE_HOST,
            "port": settings.ORACLE_PORT,
            "service": settings.ORACLE_SERVICE,
            "message": "Failed to connect to Oracle Database",
        }
    except Exception as exc:
        logger.error("Unexpected error during Oracle health check: %s", exc)
        return {
            "connected": False,
            "status": "unhealthy",
            "error_message": str(exc),
            "host": settings.ORACLE_HOST,
            "port": settings.ORACLE_PORT,
            "service": settings.ORACLE_SERVICE,
            "message": "Unexpected error connecting to Oracle Database",
        }
