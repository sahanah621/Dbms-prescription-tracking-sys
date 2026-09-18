from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==========================================
# PHARMACY SCHEMAS
# ==========================================
class PharmacyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Pharmacy trade name")
    rating: float = Field(0.0, ge=0.0, le=5.0, description="Customer rating (0.0 - 5.0)")
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    street: str = Field(..., min_length=1, max_length=100)
    contact_no: str = Field(..., min_length=5, max_length=15, description="Contact phone number")


class PharmacyCreate(PharmacyBase):
    pharmacy_id: Optional[int] = Field(None, ge=1, description="Optional manual ID")


class PharmacyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    street: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_no: Optional[str] = Field(None, min_length=5, max_length=15)


class PharmacyResponse(PharmacyBase):
    pharmacy_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PHARMACIST SCHEMAS
# ==========================================
class PharmacistBase(BaseModel):
    pharmacy_id: int = Field(..., ge=1, description="Associated Pharmacy ID")
    name: str = Field(..., min_length=1, max_length=60, description="Pharmacist full name")
    shift: str = Field(..., description="Duty shift: 'morning', 'evening', or 'night'")

    @field_validator("shift")
    @classmethod
    def validate_shift(cls, v: str) -> str:
        lower_v = v.strip().lower()
        if lower_v not in ("morning", "evening", "night"):
            raise ValueError("Shift must be 'morning', 'evening', or 'night'")
        return lower_v


class PharmacistCreate(PharmacistBase):
    pharmacist_id: Optional[int] = Field(None, ge=1)


class PharmacistUpdate(BaseModel):
    pharmacy_id: Optional[int] = Field(None, ge=1)
    name: Optional[str] = Field(None, min_length=1, max_length=60)
    shift: Optional[str] = None

    @field_validator("shift")
    @classmethod
    def validate_shift(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            lower_v = v.strip().lower()
            if lower_v not in ("morning", "evening", "night"):
                raise ValueError("Shift must be 'morning', 'evening', or 'night'")
            return lower_v
        return v


class PharmacistResponse(PharmacistBase):
    pharmacist_id: int
    pharmacy_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# HOSPITAL SCHEMAS
# ==========================================
class HospitalBase(BaseModel):
    pharmacy_id: int = Field(..., ge=1, description="Affiliated Pharmacy ID")
    name: str = Field(..., min_length=1, max_length=100, description="Hospital name")
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    street: str = Field(..., min_length=1, max_length=100)
    contact: str = Field(..., min_length=5, max_length=15, description="Hospital contact number")


class HospitalCreate(HospitalBase):
    hospital_id: Optional[int] = Field(None, ge=1)


class HospitalUpdate(BaseModel):
    pharmacy_id: Optional[int] = Field(None, ge=1)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    street: Optional[str] = Field(None, min_length=1, max_length=100)
    contact: Optional[str] = Field(None, min_length=5, max_length=15)


class HospitalResponse(HospitalBase):
    hospital_id: int
    pharmacy_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# DOCTOR SCHEMAS
# ==========================================
class DoctorBase(BaseModel):
    hospital_id: int = Field(..., ge=1, description="Affiliated Hospital ID")
    first_name: str = Field(..., min_length=1, max_length=30)
    last_name: str = Field(..., min_length=1, max_length=30)
    qualification: str = Field(..., min_length=1, max_length=100, description="Degrees & Specialization")
    experience: int = Field(0, ge=0, description="Years of medical practice (>= 0)")
    contact_no: str = Field(..., min_length=5, max_length=15, description="Mobile / Contact number")


class DoctorCreate(DoctorBase):
    doctor_id: Optional[int] = Field(None, ge=1)


class DoctorUpdate(BaseModel):
    hospital_id: Optional[int] = Field(None, ge=1)
    first_name: Optional[str] = Field(None, min_length=1, max_length=30)
    last_name: Optional[str] = Field(None, min_length=1, max_length=30)
    qualification: Optional[str] = Field(None, min_length=1, max_length=100)
    experience: Optional[int] = Field(None, ge=0)
    contact_no: Optional[str] = Field(None, min_length=5, max_length=15)


class DoctorResponse(DoctorBase):
    doctor_id: int
    hospital_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
