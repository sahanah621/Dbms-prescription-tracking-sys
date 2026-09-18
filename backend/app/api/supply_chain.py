import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Path, Query, status
from app.schemas.supply_chain import (
    ManufacturerCreate,
    ManufacturerResponse,
    ManufacturerUpdate,
    MedicineOrderCreate,
    MedicineOrderResponse,
    MedicineOrderUpdate,
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
    WholesaleSupplierCreate,
    WholesaleSupplierResponse,
    WholesaleSupplierUpdate,
)
from app.services import supply_chain_service
from app.services.supply_chain_service import (
    SupplyChainAlreadyExistsError,
    SupplyChainDependencyError,
)

logger = logging.getLogger("backend.api.supply_chain")

supplier_router = APIRouter(prefix="/suppliers", tags=["Suppliers"])
manufacturer_router = APIRouter(prefix="/manufacturers", tags=["Manufacturers"])
wholesale_router = APIRouter(prefix="/wholesale-suppliers", tags=["Wholesale Suppliers"])
order_router = APIRouter(prefix="/medicine-orders", tags=["Medicine Orders"])


# ==============================================================================
# SUPPLIERS ROUTER
# ==============================================================================
@supplier_router.get("", response_model=List[SupplierResponse])
def list_suppliers() -> List[SupplierResponse]:
    return supply_chain_service.get_all_suppliers()


@supplier_router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int = Path(..., ge=1)) -> SupplierResponse:
    res = supply_chain_service.get_supplier_by_id(supplier_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Supplier {supplier_id} not found.")
    return res


@supplier_router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(data: SupplierCreate) -> SupplierResponse:
    try:
        return supply_chain_service.create_supplier(data)
    except SupplyChainAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@supplier_router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int = Path(..., ge=1), data: SupplierUpdate = ...) -> SupplierResponse:
    try:
        res = supply_chain_service.update_supplier(supplier_id, data)
        if not res:
            raise HTTPException(status_code=404, detail=f"Supplier {supplier_id} not found.")
        return res
    except SupplyChainAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@supplier_router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int = Path(..., ge=1)) -> Dict[str, object]:
    try:
        deleted = supply_chain_service.delete_supplier(supplier_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Supplier {supplier_id} not found.")
        return {"success": True, "message": f"Supplier {supplier_id} deleted."}
    except SupplyChainDependencyError as e:
        raise HTTPException(status_code=409, detail=str(e))


# ==============================================================================
# MANUFACTURERS ROUTER
# ==============================================================================
@manufacturer_router.get("", response_model=List[ManufacturerResponse])
def list_manufacturers() -> List[ManufacturerResponse]:
    return supply_chain_service.get_all_manufacturers()


@manufacturer_router.get("/{manufacturer_id}", response_model=ManufacturerResponse)
def get_manufacturer(manufacturer_id: int = Path(..., ge=1)) -> ManufacturerResponse:
    res = supply_chain_service.get_manufacturer_by_id(manufacturer_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Manufacturer {manufacturer_id} not found.")
    return res


@manufacturer_router.post("", response_model=ManufacturerResponse, status_code=status.HTTP_201_CREATED)
def create_manufacturer(data: ManufacturerCreate) -> ManufacturerResponse:
    try:
        return supply_chain_service.create_manufacturer(data)
    except SupplyChainAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@manufacturer_router.put("/{manufacturer_id}", response_model=ManufacturerResponse)
def update_manufacturer(manufacturer_id: int = Path(..., ge=1), data: ManufacturerUpdate = ...) -> ManufacturerResponse:
    try:
        res = supply_chain_service.update_manufacturer(manufacturer_id, data)
        if not res:
            raise HTTPException(status_code=404, detail=f"Manufacturer {manufacturer_id} not found.")
        return res
    except SupplyChainAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@manufacturer_router.delete("/{manufacturer_id}")
def delete_manufacturer(manufacturer_id: int = Path(..., ge=1)) -> Dict[str, object]:
    deleted = supply_chain_service.delete_manufacturer(manufacturer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Manufacturer {manufacturer_id} not found.")
    return {"success": True, "message": f"Manufacturer {manufacturer_id} deleted."}


# ==============================================================================
# WHOLESALE SUPPLIERS ROUTER
# ==============================================================================
@wholesale_router.get("", response_model=List[WholesaleSupplierResponse])
def list_wholesale_suppliers() -> List[WholesaleSupplierResponse]:
    return supply_chain_service.get_all_wholesale_suppliers()


@wholesale_router.get("/{gst_no}", response_model=WholesaleSupplierResponse)
def get_wholesale_supplier(gst_no: str = Path(..., min_length=3)) -> WholesaleSupplierResponse:
    res = supply_chain_service.get_wholesale_supplier_by_gst(gst_no)
    if not res:
        raise HTTPException(status_code=404, detail=f"Wholesale Supplier with GST {gst_no} not found.")
    return res


@wholesale_router.post("", response_model=WholesaleSupplierResponse, status_code=status.HTTP_201_CREATED)
def create_wholesale_supplier(data: WholesaleSupplierCreate) -> WholesaleSupplierResponse:
    try:
        return supply_chain_service.create_wholesale_supplier(data)
    except SupplyChainAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@wholesale_router.put("/{gst_no}", response_model=WholesaleSupplierResponse)
def update_wholesale_supplier(gst_no: str = Path(..., min_length=3), data: WholesaleSupplierUpdate = ...) -> WholesaleSupplierResponse:
    res = supply_chain_service.update_wholesale_supplier(gst_no, data)
    if not res:
        raise HTTPException(status_code=404, detail=f"Wholesale Supplier with GST {gst_no} not found.")
    return res


@wholesale_router.delete("/{gst_no}")
def delete_wholesale_supplier(gst_no: str = Path(..., min_length=3)) -> Dict[str, object]:
    deleted = supply_chain_service.delete_wholesale_supplier(gst_no)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Wholesale Supplier with GST {gst_no} not found.")
    return {"success": True, "message": f"Wholesale Supplier {gst_no} deleted."}


# ==============================================================================
# MEDICINE ORDERS ROUTER
# ==============================================================================
@order_router.get("", response_model=List[MedicineOrderResponse])
def list_orders(
    supplier_id: Optional[int] = Query(None, description="Filter by supplier ID"),
    pharmacy_id: Optional[int] = Query(None, description="Filter by pharmacy ID"),
) -> List[MedicineOrderResponse]:
    return supply_chain_service.get_all_orders(supplier_id=supplier_id, pharmacy_id=pharmacy_id)


@order_router.get("/{order_id}", response_model=MedicineOrderResponse)
def get_order(order_id: int = Path(..., ge=1)) -> MedicineOrderResponse:
    res = supply_chain_service.get_order_by_id(order_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found.")
    return res


@order_router.post("", response_model=MedicineOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(data: MedicineOrderCreate) -> MedicineOrderResponse:
    try:
        return supply_chain_service.create_order(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SupplyChainAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@order_router.put("/{order_id}", response_model=MedicineOrderResponse)
def update_order(order_id: int = Path(..., ge=1), data: MedicineOrderUpdate = ...) -> MedicineOrderResponse:
    try:
        res = supply_chain_service.update_order(order_id, data)
        if not res:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found.")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@order_router.delete("/{order_id}")
def delete_order(order_id: int = Path(..., ge=1)) -> Dict[str, object]:
    deleted = supply_chain_service.delete_order(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found.")
    return {"success": True, "message": f"Order {order_id} deleted."}
