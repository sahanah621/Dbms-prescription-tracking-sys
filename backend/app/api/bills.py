import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Path, Query, status
from app.schemas.bill import BillCreate, BillResponse, BillUpdate, PatientBillSummaryResponse
from app.services import bill_service
from app.services.bill_service import BillAlreadyExistsError

logger = logging.getLogger("backend.api.bills")

router = APIRouter(prefix="/bills", tags=["Bills"])


@router.get("", response_model=List[BillResponse])
def list_bills(patient_id: Optional[int] = Query(None, description="Filter by patient ID")) -> List[BillResponse]:
    return bill_service.get_all_bills(patient_id=patient_id)


@router.get("/summary/{patient_id}", response_model=PatientBillSummaryResponse)
def get_patient_bill_summary(patient_id: int = Path(..., ge=1)) -> PatientBillSummaryResponse:
    summary = bill_service.get_patient_bill_summary(patient_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")
    return summary


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int = Path(..., ge=1)) -> BillResponse:
    bill = bill_service.get_bill_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found.")
    return bill


@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(data: BillCreate) -> BillResponse:
    try:
        return bill_service.create_bill(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BillAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(bill_id: int = Path(..., ge=1), data: BillUpdate = ...) -> BillResponse:
    try:
        updated = bill_service.update_bill(bill_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{bill_id}")
def delete_bill(bill_id: int = Path(..., ge=1)) -> Dict[str, object]:
    deleted = bill_service.delete_bill(bill_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found.")
    return {"success": True, "message": f"Bill {bill_id} deleted."}
