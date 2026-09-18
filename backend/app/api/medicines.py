import logging
from typing import Dict, List
from fastapi import APIRouter, HTTPException, Path, status
import oracledb
from app.schemas.medicine import MedicineCreate, MedicineResponse, MedicineUpdate
from app.services import medicine_service
from app.services.medicine_service import (
    MedicineAlreadyExistsError,
    MedicineDependencyError,
    MedicineNotFoundError,
)

logger = logging.getLogger("backend.api.medicines")

router = APIRouter(prefix="/medicines", tags=["Medicines"])


@router.get(
    "",
    response_model=List[MedicineResponse],
    summary="List All Medicines",
    description="Retrieve all medicines from inventory with current stock and expiry status.",
)
def list_medicines() -> List[MedicineResponse]:
    try:
        return medicine_service.get_all_medicines()
    except Exception as exc:
        logger.error("Error retrieving medicines: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medicines from database.",
        )


@router.get(
    "/{medicine_id}",
    response_model=MedicineResponse,
    summary="Get Medicine by ID",
    description="Retrieve single medicine details by ID.",
)
def get_medicine(
    medicine_id: int = Path(..., ge=1, description="Medicine ID"),
) -> MedicineResponse:
    try:
        med = medicine_service.get_medicine_by_id(medicine_id)
        if not med:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine with ID {medicine_id} not found.",
            )
        return med
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error retrieving medicine %d: %s", medicine_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medicine from database.",
        )


@router.post(
    "",
    response_model=MedicineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Medicine",
    description="Insert a new medicine into the inventory.",
)
def create_medicine(data: MedicineCreate) -> MedicineResponse:
    try:
        return medicine_service.create_medicine(data)
    except MedicineAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except oracledb.DatabaseError as db_err:
        logger.error("Database error creating medicine: %s", db_err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating medicine.",
        )
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as exc:
        logger.error("Unexpected error creating medicine: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error creating medicine.",
        )


@router.put(
    "/{medicine_id}",
    response_model=MedicineResponse,
    summary="Update Medicine",
    description="Update an existing medicine's name, stock, dates, or price.",
)
def update_medicine(
    medicine_id: int = Path(..., ge=1),
    update_data: MedicineUpdate = ...,
) -> MedicineResponse:
    try:
        updated = medicine_service.update_medicine(medicine_id, update_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine with ID {medicine_id} not found.",
            )
        return updated
    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except oracledb.DatabaseError as db_err:
        logger.error("Database error updating medicine: %s", db_err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while updating medicine.",
        )
    except Exception as exc:
        logger.error("Unexpected error updating medicine %d: %s", medicine_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error updating medicine.",
        )


@router.delete(
    "/{medicine_id}",
    summary="Delete Medicine",
    description="Remove a medicine from inventory. Fails if prescribed in existing prescriptions.",
)
def delete_medicine(medicine_id: int = Path(..., ge=1)) -> Dict[str, object]:
    try:
        deleted = medicine_service.delete_medicine(medicine_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine with ID {medicine_id} not found.",
            )
        return {
            "success": True,
            "message": f"Medicine with ID {medicine_id} successfully deleted.",
            "medicine_id": medicine_id,
        }
    except HTTPException:
        raise
    except MedicineDependencyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected error deleting medicine %d: %s", medicine_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error deleting medicine.",
        )
