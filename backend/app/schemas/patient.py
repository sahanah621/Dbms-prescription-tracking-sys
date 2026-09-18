from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=30, description="Patient's first name")
    last_name: str = Field(..., min_length=1, max_length=30, description="Patient's last name")
    dob: date = Field(..., description="Date of birth in YYYY-MM-DD format")
    sex: str = Field(..., min_length=1, max_length=1, description="Gender/Sex (e.g. M, F, O)")
    street: str = Field(..., min_length=1, max_length=100, description="Street address")
    city: str = Field(..., min_length=1, max_length=50, description="City")
    state: str = Field(..., min_length=1, max_length=50, description="State")

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: str) -> str:
        upper_v = v.strip().upper()
        if upper_v not in ("M", "F", "O"):
            raise ValueError("Sex must be 'M', 'F', or 'O'")
        return upper_v


class PatientCreate(PatientBase):
    patient_id: Optional[int] = Field(
        None,
        ge=1,
        description="Optional manual patient ID. If omitted, the next sequential ID is auto-assigned.",
    )


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=30, description="Patient's first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=30, description="Patient's last name")
    dob: Optional[date] = Field(None, description="Date of birth in YYYY-MM-DD format")
    sex: Optional[str] = Field(None, min_length=1, max_length=1, description="Gender/Sex (e.g. M, F, O)")
    street: Optional[str] = Field(None, min_length=1, max_length=100, description="Street address")
    city: Optional[str] = Field(None, min_length=1, max_length=50, description="City")
    state: Optional[str] = Field(None, min_length=1, max_length=50, description="State")

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            upper_v = v.strip().upper()
            if upper_v not in ("M", "F", "O"):
                raise ValueError("Sex must be 'M', 'F', or 'O'")
            return upper_v
        return v


class PatientResponse(PatientBase):
    patient_id: int = Field(..., description="Unique Patient ID (Primary Key)")

    model_config = ConfigDict(from_attributes=True)
