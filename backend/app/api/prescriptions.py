import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Path, Query, status
import oracledb
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services import prescription_service
from app.services.prescription_service import (
    PrescriptionAlreadyExistsError,
    PrescriptionNotFoundError,
)

logger = logging.getLogger("backend.api.prescriptions")

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.get(
    "",
    response_model=List[PrescriptionResponse],
    summary="List Prescriptions",
    description="Retrieve prescriptions, optionally filtered by patient_id or doctor_id.",
)
def list_prescriptions(
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    doctor_id: Optional[int] = Query(None, description="Filter by doctor ID"),
) -> List[PrescriptionResponse]:
    try:
        return prescription_service.get_all_prescriptions(patient_id=patient_id, doctor_id=doctor_id)
    except Exception as exc:
        logger.error("Error retrieving prescriptions: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prescriptions from database.",
        )


@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
    summary="Get Prescription by ID",
    description="Retrieve detailed prescription including all prescribed items and total cost.",
)
def get_prescription(
    prescription_id: int = Path(..., ge=1),
) -> PrescriptionResponse:
    try:
        rx = prescription_service.get_prescription_by_id(prescription_id)
        if not rx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prescription with ID {prescription_id} not found.",
            )
        return rx
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error retrieving prescription %d: %s", prescription_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prescription from database.",
        )


@router.post(
    "",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Prescription",
    description="Create a new prescription along with its medicine items in a single atomic transaction.",
)
def create_prescription(data: PrescriptionCreate) -> PrescriptionResponse:
    try:
        return prescription_service.create_prescription(data)
    except PrescriptionAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except oracledb.DatabaseError as db_err:
        error_obj = db_err.args[0] if db_err.args else None
        error_code = getattr(error_obj, "code", None)
        error_msg = getattr(error_obj, "message", str(db_err))

        # Check for trigger ORA-20002 (prescription date cannot be in the future)
        if error_code == 20002 or "20002" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Database business rule violation: Prescription date cannot be in the future.",
            )
        logger.error("Database error creating prescription [%s]: %s", error_code, error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating prescription.",
        )
    except Exception as exc:
        logger.error("Unexpected error creating prescription: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error creating prescription.",
        )


@router.delete(
    "/{prescription_id}",
    summary="Delete Prescription",
    description="Delete a prescription and all of its associated prescription items.",
)
def delete_prescription(prescription_id: int = Path(..., ge=1)) -> Dict[str, object]:
    try:
        deleted = prescription_service.delete_prescription(prescription_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prescription with ID {prescription_id} not found.",
            )
        return {
            "success": True,
            "message": f"Prescription with ID {prescription_id} and its items successfully deleted.",
            "prescription_id": prescription_id,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Unexpected error deleting prescription %d: %s", prescription_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error deleting prescription.",
        )
