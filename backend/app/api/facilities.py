import logging
from typing import Dict, List
from fastapi import APIRouter, HTTPException, Path, status
import oracledb
from app.schemas.facility import (
    DoctorCreate,
    DoctorResponse,
    DoctorUpdate,
    HospitalCreate,
    HospitalResponse,
    HospitalUpdate,
    PharmacistCreate,
    PharmacistResponse,
    PharmacistUpdate,
    PharmacyCreate,
    PharmacyResponse,
    PharmacyUpdate,
)
from app.services import facility_service
from app.services.facility_service import (
    EntityAlreadyExistsError,
    EntityDependencyError,
)

logger = logging.getLogger("backend.api.facilities")

pharmacy_router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])
pharmacist_router = APIRouter(prefix="/pharmacists", tags=["Pharmacists"])
hospital_router = APIRouter(prefix="/hospitals", tags=["Hospitals"])
doctor_router = APIRouter(prefix="/doctors", tags=["Doctors"])


# ==========================================
# PHARMACIES ROUTER
# ==========================================
@pharmacy_router.get("", response_model=List[PharmacyResponse])
def list_pharmacies() -> List[PharmacyResponse]:
    return facility_service.get_all_pharmacies()


@pharmacy_router.get("/{pharmacy_id}", response_model=PharmacyResponse)
def get_pharmacy(pharmacy_id: int = Path(..., ge=1)) -> PharmacyResponse:
    res = facility_service.get_pharmacy_by_id(pharmacy_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Pharmacy {pharmacy_id} not found.")
    return res


@pharmacy_router.post("", response_model=PharmacyResponse, status_code=status.HTTP_201_CREATED)
def create_pharmacy(data: PharmacyCreate) -> PharmacyResponse:
    try:
        return facility_service.create_pharmacy(data)
    except EntityAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@pharmacy_router.put("/{pharmacy_id}", response_model=PharmacyResponse)
def update_pharmacy(pharmacy_id: int = Path(..., ge=1), data: PharmacyUpdate = ...) -> PharmacyResponse:
    res = facility_service.update_pharmacy(pharmacy_id, data)
    if not res:
        raise HTTPException(status_code=404, detail=f"Pharmacy {pharmacy_id} not found.")
    return res


@pharmacy_router.delete("/{pharmacy_id}")
def delete_pharmacy(pharmacy_id: int = Path(..., ge=1)) -> Dict[str, object]:
    try:
        deleted = facility_service.delete_pharmacy(pharmacy_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Pharmacy {pharmacy_id} not found.")
        return {"success": True, "message": f"Pharmacy {pharmacy_id} deleted."}
    except EntityDependencyError as e:
        raise HTTPException(status_code=409, detail=str(e))


# ==========================================
# PHARMACISTS ROUTER
# ==========================================
@pharmacist_router.get("", response_model=List[PharmacistResponse])
def list_pharmacists() -> List[PharmacistResponse]:
    return facility_service.get_all_pharmacists()


@pharmacist_router.get("/{pharmacist_id}", response_model=PharmacistResponse)
def get_pharmacist(pharmacist_id: int = Path(..., ge=1)) -> PharmacistResponse:
    res = facility_service.get_pharmacist_by_id(pharmacist_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Pharmacist {pharmacist_id} not found.")
    return res


@pharmacist_router.post("", response_model=PharmacistResponse, status_code=status.HTTP_201_CREATED)
def create_pharmacist(data: PharmacistCreate) -> PharmacistResponse:
    try:
        return facility_service.create_pharmacist(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except EntityAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@pharmacist_router.put("/{pharmacist_id}", response_model=PharmacistResponse)
def update_pharmacist(pharmacist_id: int = Path(..., ge=1), data: PharmacistUpdate = ...) -> PharmacistResponse:
    try:
        res = facility_service.update_pharmacist(pharmacist_id, data)
        if not res:
            raise HTTPException(status_code=404, detail=f"Pharmacist {pharmacist_id} not found.")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@pharmacist_router.delete("/{pharmacist_id}")
def delete_pharmacist(pharmacist_id: int = Path(..., ge=1)) -> Dict[str, object]:
    deleted = facility_service.delete_pharmacist(pharmacist_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Pharmacist {pharmacist_id} not found.")
    return {"success": True, "message": f"Pharmacist {pharmacist_id} deleted."}


# ==========================================
# HOSPITALS ROUTER
# ==========================================
@hospital_router.get("", response_model=List[HospitalResponse])
def list_hospitals() -> List[HospitalResponse]:
    return facility_service.get_all_hospitals()


@hospital_router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital(hospital_id: int = Path(..., ge=1)) -> HospitalResponse:
    res = facility_service.get_hospital_by_id(hospital_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Hospital {hospital_id} not found.")
    return res


@hospital_router.post("", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
def create_hospital(data: HospitalCreate) -> HospitalResponse:
    try:
        return facility_service.create_hospital(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except EntityAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@hospital_router.put("/{hospital_id}", response_model=HospitalResponse)
def update_hospital(hospital_id: int = Path(..., ge=1), data: HospitalUpdate = ...) -> HospitalResponse:
    try:
        res = facility_service.update_hospital(hospital_id, data)
        if not res:
            raise HTTPException(status_code=404, detail=f"Hospital {hospital_id} not found.")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@hospital_router.delete("/{hospital_id}")
def delete_hospital(hospital_id: int = Path(..., ge=1)) -> Dict[str, object]:
    try:
        deleted = facility_service.delete_hospital(hospital_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Hospital {hospital_id} not found.")
        return {"success": True, "message": f"Hospital {hospital_id} deleted."}
    except EntityDependencyError as e:
        raise HTTPException(status_code=409, detail=str(e))


# ==========================================
# DOCTORS ROUTER
# ==========================================
@doctor_router.get("", response_model=List[DoctorResponse])
def list_doctors() -> List[DoctorResponse]:
    return facility_service.get_all_doctors()


@doctor_router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int = Path(..., ge=1)) -> DoctorResponse:
    res = facility_service.get_doctor_by_id(doctor_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found.")
    return res


@doctor_router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(data: DoctorCreate) -> DoctorResponse:
    try:
        return facility_service.create_doctor(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except EntityAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@doctor_router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int = Path(..., ge=1), data: DoctorUpdate = ...) -> DoctorResponse:
    try:
        res = facility_service.update_doctor(doctor_id, data)
        if not res:
            raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found.")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@doctor_router.delete("/{doctor_id}")
def delete_doctor(doctor_id: int = Path(..., ge=1)) -> Dict[str, object]:
    try:
        deleted = facility_service.delete_doctor(doctor_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found.")
        return {"success": True, "message": f"Doctor {doctor_id} deleted."}
    except EntityDependencyError as e:
        raise HTTPException(status_code=409, detail=str(e))
