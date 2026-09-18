from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==========================================
# SUPPLIER SCHEMAS
# ==========================================
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Supplier corporate or business name")
    contact: str = Field(..., min_length=5, max_length=15, description="Contact phone number")
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    street: str = Field(..., min_length=1, max_length=100)


class SupplierCreate(SupplierBase):
    supplier_id: Optional[int] = Field(None, ge=1, description="Optional manual supplier ID")


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact: Optional[str] = Field(None, min_length=5, max_length=15)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    street: Optional[str] = Field(None, min_length=1, max_length=100)


class SupplierResponse(SupplierBase):
    supplier_id: int
    linked_manufacturers_count: Optional[int] = 0
    linked_pharmacies_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MANUFACTURER SCHEMAS
# ==========================================
class ManufacturerBase(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=100, description="Pharmaceutical manufacturer brand name")
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    street: str = Field(..., min_length=1, max_length=100)


class ManufacturerCreate(ManufacturerBase):
    manufacturer_id: Optional[int] = Field(None, ge=1, description="Optional manual manufacturer ID")


class ManufacturerUpdate(BaseModel):
    brand_name: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    street: Optional[str] = Field(None, min_length=1, max_length=100)


class ManufacturerResponse(ManufacturerBase):
    manufacturer_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# WHOLESALE SUPPLIER SCHEMAS
# ==========================================
class WholesaleSupplierBase(BaseModel):
    gst_no: str = Field(..., min_length=5, max_length=20, description="Goods and Services Tax Identification Number")
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    street: str = Field(..., min_length=1, max_length=100)


class WholesaleSupplierCreate(WholesaleSupplierBase):
    pass


class WholesaleSupplierUpdate(BaseModel):
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    street: Optional[str] = Field(None, min_length=1, max_length=100)


class WholesaleSupplierResponse(WholesaleSupplierBase):
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MEDICINE ORDER SCHEMAS
# ==========================================
VALID_ORDER_STATUSES = ("pending", "processing", "shipped", "delivered", "cancelled")
VALID_PAYMENT_STATUSES = ("pending", "paid", "partial", "refunded")


class MedicineOrderBase(BaseModel):
    supplier_id: int = Field(..., ge=1, description="Fulfilling Supplier ID")
    pharmacy_id: int = Field(..., ge=1, description="Receiving Pharmacy ID")
    quantity_ordered: int = Field(..., gt=0, description="Total units ordered (must be > 0)")
    order_date: Optional[date] = Field(None, description="Date of order placement (defaults to today)")
    arrival_date: Optional[date] = Field(None, description="Expected or actual arrival date")
    payment_status: str = Field("pending", description="Payment status: pending, paid, partial, refunded")
    order_status: str = Field("pending", description="Order progress status: pending, processing, shipped, delivered, cancelled")

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: str) -> str:
        s = v.strip().lower()
        if s not in VALID_PAYMENT_STATUSES:
            raise ValueError(f"payment_status must be one of {VALID_PAYMENT_STATUSES}")
        return s

    @field_validator("order_status")
    @classmethod
    def validate_order_status(cls, v: str) -> str:
        s = v.strip().lower()
        if s not in VALID_ORDER_STATUSES:
            raise ValueError(f"order_status must be one of {VALID_ORDER_STATUSES}")
        return s


class MedicineOrderCreate(MedicineOrderBase):
    order_id: Optional[int] = Field(None, ge=1, description="Optional manual order ID")


class MedicineOrderUpdate(BaseModel):
    supplier_id: Optional[int] = Field(None, ge=1)
    pharmacy_id: Optional[int] = Field(None, ge=1)
    quantity_ordered: Optional[int] = Field(None, gt=0)
    arrival_date: Optional[date] = None
    payment_status: Optional[str] = None
    order_status: Optional[str] = None

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip().lower()
            if s not in VALID_PAYMENT_STATUSES:
                raise ValueError(f"payment_status must be one of {VALID_PAYMENT_STATUSES}")
            return s
        return v

    @field_validator("order_status")
    @classmethod
    def validate_order_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip().lower()
            if s not in VALID_ORDER_STATUSES:
                raise ValueError(f"order_status must be one of {VALID_ORDER_STATUSES}")
            return s
        return v


class MedicineOrderResponse(MedicineOrderBase):
    order_id: int
    supplier_name: Optional[str] = None
    pharmacy_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ASSOCIATION SCHEMAS
# ==========================================
class SupplierLinkRequest(BaseModel):
    supplier_id: int
    target_id: int  # manufacturer_id or pharmacy_id


class SupplierWholesaleLinkRequest(BaseModel):
    supplier_id: int
    gst_no: str
