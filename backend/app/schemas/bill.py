from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BillBase(BaseModel):
    pharmacy_id: int = Field(..., ge=1, description="Dispensing Pharmacy ID")
    patient_id: int = Field(..., ge=1, description="Billed Patient ID")
    amount: float = Field(..., ge=0.0, description="Bill total amount in INR (>= 0)")


class BillCreate(BillBase):
    bill_id: Optional[int] = Field(None, ge=1, description="Optional bill ID")


class BillUpdate(BaseModel):
    pharmacy_id: Optional[int] = Field(None, ge=1)
    patient_id: Optional[int] = Field(None, ge=1)
    amount: Optional[float] = Field(None, ge=0.0)


class BillResponse(BillBase):
    bill_id: int
    pharmacy_name: Optional[str] = None
    patient_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PatientBillSummaryResponse(BaseModel):
    patient_id: int
    patient_name: str
    total_billed_amount: float
    total_bills_count: int
    bills: List[BillResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
