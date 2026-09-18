import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.bills import router as bills_router
from app.api.facilities import (
    doctor_router,
    hospital_router,
    pharmacist_router,
    pharmacy_router,
)
from app.api.health import router as health_router
from app.api.medicines import router as medicines_router
from app.api.patients import router as patients_router
from app.api.prescriptions import router as prescriptions_router
from app.api.supply_chain import (
    manufacturer_router,
    order_router,
    supplier_router,
    wholesale_router,
)
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("backend.main")

# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "FastAPI Backend for Prescription Tracking System DBMS Academic Project.\n\n"
        "Connects to local Oracle Database 21c XE (Pluggable Database: XEPDB1) using python-oracledb."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(medicines_router, prefix="/api")
app.include_router(prescriptions_router, prefix="/api")
app.include_router(pharmacy_router, prefix="/api")
app.include_router(pharmacist_router, prefix="/api")
app.include_router(hospital_router, prefix="/api")
app.include_router(doctor_router, prefix="/api")
app.include_router(bills_router, prefix="/api")
app.include_router(supplier_router, prefix="/api")
app.include_router(manufacturer_router, prefix="/api")
app.include_router(wholesale_router, prefix="/api")
app.include_router(order_router, prefix="/api")


@app.get(
    "/",
    summary="Root Endpoint",
    description="Returns welcome information and endpoints overview.",
    tags=["Root"],
)
def root():
    return {
        "message": "Welcome to the Prescription Tracking System API",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health",
        "database": {
            "engine": "Oracle 21c XE",
            "service": settings.ORACLE_SERVICE,
            "host": settings.ORACLE_HOST,
            "port": settings.ORACLE_PORT,
            "user": settings.ORACLE_USER,
        },
    }
