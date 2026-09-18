import logging
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Path, status
import oracledb
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services import patient_service
from app.services.patient_service import (
    PatientAlreadyExistsError,
    PatientDependencyError,
    PatientNotFoundError,
)

logger = logging.getLogger("backend.api.patients")

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get(
    "",
    response_model=List[PatientResponse],
    summary="List All Patients",
    description="Retrieve all patient records from the Oracle database, ordered by Patient ID.",
)
def list_patients() -> List[PatientResponse]:
    """Retrieve all patients."""
    try:
        return patient_service.get_all_patients()
    except Exception as exc:
        logger.error("Error retrieving patients: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patients from database.",
        )


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Get Patient by ID",
    description="Retrieve a single patient's details by their unique Patient ID.",
    responses={
        404: {"description": "Patient not found"},
    },
)
def get_patient(
    patient_id: int = Path(..., ge=1, description="Unique ID of the patient to retrieve"),
) -> PatientResponse:
    """Retrieve patient by ID."""
    try:
        patient = patient_service.get_patient_by_id(patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found.",
            )
        return patient
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error retrieving patient %d: %s", patient_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient from database.",
        )


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Patient",
    description="Insert a new patient record into the Oracle database. If patient_id is omitted, it is auto-assigned.",
    responses={
        201: {"description": "Patient created successfully"},
        400: {"description": "Invalid input or business rule violation"},
        409: {"description": "Patient ID already exists"},
    },
)
def create_patient(patient_data: PatientCreate) -> PatientResponse:
    """Create a new patient."""
    try:
        return patient_service.create_patient(patient_data)
    except PatientAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except oracledb.DatabaseError as db_err:
        error_obj = db_err.args[0] if db_err.args else None
        error_code = getattr(error_obj, "code", None)
        error_msg = getattr(error_obj, "message", str(db_err))

        # Check for trigger violation (e.g. ORA-20001: date of birth cannot be in the future)
        if error_code == 20001 or "20001" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Database business rule violation: Date of birth cannot be in the future.",
            )
        logger.error("Database error creating patient [%s]: %s", error_code, error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating patient.",
        )
    except Exception as exc:
        logger.error("Unexpected error creating patient: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating patient.",
        )


@router.put(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Update Patient Details",
    description="Update an existing patient's details in the Oracle database.",
    responses={
        200: {"description": "Patient updated successfully"},
        400: {"description": "Invalid input or business rule violation"},
        404: {"description": "Patient not found"},
    },
)
def update_patient(
    patient_id: int = Path(..., ge=1, description="Unique ID of the patient to update"),
    patient_update: PatientUpdate = ...,
) -> PatientResponse:
    """Update existing patient."""
    try:
        updated = patient_service.update_patient(patient_id, patient_update)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found.",
            )
        return updated
    except HTTPException:
        raise
    except oracledb.DatabaseError as db_err:
        error_obj = db_err.args[0] if db_err.args else None
        error_code = getattr(error_obj, "code", None)
        error_msg = getattr(error_obj, "message", str(db_err))

        if error_code == 20001 or "20001" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Database business rule violation: Date of birth cannot be in the future.",
            )
        logger.error("Database error updating patient [%s]: %s", error_code, error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while updating patient.",
        )
    except Exception as exc:
        logger.error("Unexpected error updating patient %d: %s", patient_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating patient.",
        )


@router.delete(
    "/{patient_id}",
    summary="Delete Patient",
    description="Remove a patient record from the Oracle database. Fails if dependent records exist.",
    responses={
        200: {"description": "Patient deleted successfully"},
        404: {"description": "Patient not found"},
        409: {"description": "Cannot delete due to dependent foreign key records"},
    },
)
def delete_patient(
    patient_id: int = Path(..., ge=1, description="Unique ID of the patient to delete"),
) -> Dict[str, Any]:
    """Delete patient by ID."""
    try:
        deleted = patient_service.delete_patient(patient_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found.",
            )
        return {
            "success": True,
            "message": f"Patient with ID {patient_id} successfully deleted.",
            "patient_id": patient_id,
        }
    except HTTPException:
        raise
    except PatientDependencyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected error deleting patient %d: %s", patient_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting patient.",
        )
