from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class PrescriptionItemBase(BaseModel):
    medicine_id: int = Field(..., ge=1, description="Medicine ID from inventory")
    dosage: str = Field(..., min_length=1, max_length=50, description="Dosage (e.g. 650mg, 10ml)")
    frequency: str = Field(..., min_length=1, max_length=50, description="Frequency (e.g. BD, TDS, OD)")
    duration: str = Field(..., min_length=1, max_length=50, description="Duration (e.g. 5 Days, 1 Month)")


class PrescriptionItemCreate(PrescriptionItemBase):
    item_id: Optional[int] = Field(None, ge=1)


class PrescriptionItemResponse(PrescriptionItemBase):
    item_id: int
    prescription_id: int
    medicine_name: Optional[str] = None
    unit_price: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class PrescriptionBase(BaseModel):
    doctor_id: int = Field(..., ge=1, description="Prescribing Doctor ID")
    patient_id: int = Field(..., ge=1, description="Patient ID")
    prescription_date: Optional[date] = Field(None, description="Date of prescription (defaults to today)")

    @field_validator("prescription_date")
    @classmethod
    def validate_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("Prescription date cannot be in the future")
        return v


class PrescriptionCreate(PrescriptionBase):
    prescription_id: Optional[int] = Field(None, ge=1, description="Optional prescription ID")
    items: List[PrescriptionItemBase] = Field(
        default_factory=list,
        description="Prescribed medicine items with dosage, frequency, and duration",
    )


class PrescriptionResponse(PrescriptionBase):
    prescription_id: int
    prescription_date: date
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    items: List[PrescriptionItemResponse] = Field(default_factory=list)
    total_items: int = 0
    estimated_total_cost: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
