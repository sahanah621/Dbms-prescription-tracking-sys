from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class MedicineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Medicine brand/generic name")
    manu_date: date = Field(..., description="Manufacturing date (YYYY-MM-DD)")
    exp_date: date = Field(..., description="Expiry date (YYYY-MM-DD)")
    price: float = Field(..., gt=0, description="Unit price (must be > 0)")
    available_quantity: int = Field(0, ge=0, description="Available stock quantity (>= 0)")

    @model_validator(mode="after")
    def validate_dates(self) -> "MedicineBase":
        if self.exp_date <= self.manu_date:
            raise ValueError("Expiry date must be after manufacturing date")
        return self


class MedicineCreate(MedicineBase):
    medicine_id: Optional[int] = Field(
        None,
        ge=1,
        description="Optional manual ID. If omitted, the next sequential ID is auto-assigned.",
    )


class MedicineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    manu_date: Optional[date] = None
    exp_date: Optional[date] = None
    price: Optional[float] = Field(None, gt=0)
    available_quantity: Optional[int] = Field(None, ge=0)

    @model_validator(mode="after")
    def validate_dates(self) -> "MedicineUpdate":
        if self.manu_date is not None and self.exp_date is not None:
            if self.exp_date <= self.manu_date:
                raise ValueError("Expiry date must be after manufacturing date")
        return self


class MedicineResponse(MedicineBase):
    medicine_id: int = Field(..., description="Primary key medicine ID")
    is_expired: bool = Field(False, description="Whether the medicine is past its expiry date")

    model_config = ConfigDict(from_attributes=True)
