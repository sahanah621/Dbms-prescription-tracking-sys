import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional
import oracledb
from app.database import get_db_connection
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

logger = logging.getLogger("backend.services.supply_chain")


class SupplyChainAlreadyExistsError(Exception):
    pass


class SupplyChainDependencyError(Exception):
    pass


def _row_to_date(val: Any) -> Optional[date]:
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
    return None


# ==============================================================================
# SUPPLIER SERVICE
# ==============================================================================
def get_all_suppliers() -> List[SupplierResponse]:
    query = """
        SELECT s.supplier_id, s.name, s.contact, s.city, s.state, s.street,
               (SELECT COUNT(*) FROM supplier_manufacturer sm WHERE sm.supplier_id = s.supplier_id) AS mfg_count,
               (SELECT COUNT(*) FROM supplier_pharmacy sp WHERE sp.supplier_id = s.supplier_id) AS pharm_count
        FROM supplier s
        ORDER BY s.supplier_id ASC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [
                SupplierResponse(
                    supplier_id=r[0],
                    name=r[1],
                    contact=r[2],
                    city=r[3],
                    state=r[4],
                    street=r[5],
                    linked_manufacturers_count=r[6] or 0,
                    linked_pharmacies_count=r[7] or 0,
                )
                for r in rows
            ]


def get_supplier_by_id(supplier_id: int) -> Optional[SupplierResponse]:
    query = """
        SELECT s.supplier_id, s.name, s.contact, s.city, s.state, s.street,
               (SELECT COUNT(*) FROM supplier_manufacturer sm WHERE sm.supplier_id = s.supplier_id) AS mfg_count,
               (SELECT COUNT(*) FROM supplier_pharmacy sp WHERE sp.supplier_id = s.supplier_id) AS pharm_count
        FROM supplier s
        WHERE s.supplier_id = :1
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [supplier_id])
            r = cur.fetchone()
            if not r:
                return None
            return SupplierResponse(
                supplier_id=r[0],
                name=r[1],
                contact=r[2],
                city=r[3],
                state=r[4],
                street=r[5],
                linked_manufacturers_count=r[6] or 0,
                linked_pharmacies_count=r[7] or 0,
            )


def create_supplier(data: SupplierCreate) -> SupplierResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Check contact uniqueness
            cur.execute("SELECT supplier_id FROM supplier WHERE contact = :1", [data.contact])
            if cur.fetchone():
                raise SupplyChainAlreadyExistsError(f"A supplier with contact '{data.contact}' already exists.")

            if data.supplier_id:
                cur.execute("SELECT supplier_id FROM supplier WHERE supplier_id = :1", [data.supplier_id])
                if cur.fetchone():
                    raise SupplyChainAlreadyExistsError(f"Supplier ID {data.supplier_id} is already in use.")
                new_id = data.supplier_id
            else:
                cur.execute("SELECT NVL(MAX(supplier_id), 800) + 1 FROM supplier")
                new_id = int(cur.fetchone()[0])

            insert_query = """
                INSERT INTO supplier (supplier_id, name, contact, city, state, street)
                VALUES (:1, :2, :3, :4, :5, :6)
            """
            cur.execute(insert_query, [new_id, data.name, data.contact, data.city, data.state, data.street])
            conn.commit()

            return SupplierResponse(
                supplier_id=new_id,
                name=data.name,
                contact=data.contact,
                city=data.city,
                state=data.state,
                street=data.street,
                linked_manufacturers_count=0,
                linked_pharmacies_count=0,
            )


def update_supplier(supplier_id: int, data: SupplierUpdate) -> Optional[SupplierResponse]:
    existing = get_supplier_by_id(supplier_id)
    if not existing:
        return None

    name = data.name if data.name is not None else existing.name
    contact = data.contact if data.contact is not None else existing.contact
    city = data.city if data.city is not None else existing.city
    state = data.state if data.state is not None else existing.state
    street = data.street if data.street is not None else existing.street

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if data.contact and data.contact != existing.contact:
                cur.execute(
                    "SELECT supplier_id FROM supplier WHERE contact = :1 AND supplier_id != :2",
                    [data.contact, supplier_id],
                )
                if cur.fetchone():
                    raise SupplyChainAlreadyExistsError(f"A supplier with contact '{data.contact}' already exists.")

            cur.execute(
                """
                UPDATE supplier
                SET name = :1, contact = :2, city = :3, state = :4, street = :5
                WHERE supplier_id = :6
                """,
                [name, contact, city, state, street, supplier_id],
            )
            conn.commit()

    return get_supplier_by_id(supplier_id)


def delete_supplier(supplier_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM medicine_order WHERE supplier_id = :1", [supplier_id])
            order_count = cur.fetchone()[0]
            if order_count > 0:
                raise SupplyChainDependencyError(
                    f"Cannot delete Supplier {supplier_id}: {order_count} purchase orders reference this supplier."
                )

            # Safely clean up association table references
            cur.execute("DELETE FROM supplier_manufacturer WHERE supplier_id = :1", [supplier_id])
            cur.execute("DELETE FROM supplier_wholesale WHERE supplier_id = :1", [supplier_id])
            cur.execute("DELETE FROM supplier_pharmacy WHERE supplier_id = :1", [supplier_id])

            cur.execute("DELETE FROM supplier WHERE supplier_id = :1", [supplier_id])
            affected = cur.rowcount
            conn.commit()
            return affected > 0


# ==============================================================================
# MANUFACTURER SERVICE
# ==============================================================================
def get_all_manufacturers() -> List[ManufacturerResponse]:
    query = """
        SELECT manufacturer_id, brand_name, city, state, street
        FROM manufacturer
        ORDER BY manufacturer_id ASC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [
                ManufacturerResponse(
                    manufacturer_id=r[0],
                    brand_name=r[1],
                    city=r[2],
                    state=r[3],
                    street=r[4],
                )
                for r in rows
            ]


def get_manufacturer_by_id(manufacturer_id: int) -> Optional[ManufacturerResponse]:
    query = """
        SELECT manufacturer_id, brand_name, city, state, street
        FROM manufacturer
        WHERE manufacturer_id = :1
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [manufacturer_id])
            r = cur.fetchone()
            if not r:
                return None
            return ManufacturerResponse(
                manufacturer_id=r[0],
                brand_name=r[1],
                city=r[2],
                state=r[3],
                street=r[4],
            )


def create_manufacturer(data: ManufacturerCreate) -> ManufacturerResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT manufacturer_id FROM manufacturer WHERE LOWER(brand_name) = LOWER(:1)", [data.brand_name.strip()])
            if cur.fetchone():
                raise SupplyChainAlreadyExistsError(f"Manufacturer brand '{data.brand_name}' already exists.")

            if data.manufacturer_id:
                cur.execute("SELECT manufacturer_id FROM manufacturer WHERE manufacturer_id = :1", [data.manufacturer_id])
                if cur.fetchone():
                    raise SupplyChainAlreadyExistsError(f"Manufacturer ID {data.manufacturer_id} already exists.")
                new_id = data.manufacturer_id
            else:
                cur.execute("SELECT NVL(MAX(manufacturer_id), 700) + 1 FROM manufacturer")
                new_id = int(cur.fetchone()[0])

            cur.execute(
                """
                INSERT INTO manufacturer (manufacturer_id, brand_name, city, state, street)
                VALUES (:1, :2, :3, :4, :5)
                """,
                [new_id, data.brand_name.strip(), data.city.strip(), data.state.strip(), data.street.strip()],
            )
            conn.commit()

            return ManufacturerResponse(
                manufacturer_id=new_id,
                brand_name=data.brand_name.strip(),
                city=data.city.strip(),
                state=data.state.strip(),
                street=data.street.strip(),
            )


def update_manufacturer(manufacturer_id: int, data: ManufacturerUpdate) -> Optional[ManufacturerResponse]:
    existing = get_manufacturer_by_id(manufacturer_id)
    if not existing:
        return None

    brand_name = data.brand_name.strip() if data.brand_name is not None else existing.brand_name
    city = data.city.strip() if data.city is not None else existing.city
    state = data.state.strip() if data.state is not None else existing.state
    street = data.street.strip() if data.street is not None else existing.street

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if data.brand_name and data.brand_name.strip().lower() != existing.brand_name.lower():
                cur.execute(
                    "SELECT manufacturer_id FROM manufacturer WHERE LOWER(brand_name) = LOWER(:1) AND manufacturer_id != :2",
                    [data.brand_name.strip(), manufacturer_id],
                )
                if cur.fetchone():
                    raise SupplyChainAlreadyExistsError(f"Manufacturer brand '{data.brand_name}' already exists.")

            cur.execute(
                """
                UPDATE manufacturer
                SET brand_name = :1, city = :2, state = :3, street = :4
                WHERE manufacturer_id = :5
                """,
                [brand_name, city, state, street, manufacturer_id],
            )
            conn.commit()

    return get_manufacturer_by_id(manufacturer_id)


def delete_manufacturer(manufacturer_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Delete association table links first
            cur.execute("DELETE FROM supplier_manufacturer WHERE manufacturer_id = :1", [manufacturer_id])
            cur.execute("DELETE FROM manufacturer WHERE manufacturer_id = :1", [manufacturer_id])
            affected = cur.rowcount
            conn.commit()
            return affected > 0


# ==============================================================================
# WHOLESALE SUPPLIER SERVICE
# ==============================================================================
def get_all_wholesale_suppliers() -> List[WholesaleSupplierResponse]:
    query = """
        SELECT gst_no, city, state, street
        FROM wholesale_supplier
        ORDER BY gst_no ASC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [
                WholesaleSupplierResponse(
                    gst_no=r[0],
                    city=r[1],
                    state=r[2],
                    street=r[3],
                )
                for r in rows
            ]


def get_wholesale_supplier_by_gst(gst_no: str) -> Optional[WholesaleSupplierResponse]:
    query = """
        SELECT gst_no, city, state, street
        FROM wholesale_supplier
        WHERE gst_no = :1
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [gst_no.strip()])
            r = cur.fetchone()
            if not r:
                return None
            return WholesaleSupplierResponse(
                gst_no=r[0],
                city=r[1],
                state=r[2],
                street=r[3],
            )


def create_wholesale_supplier(data: WholesaleSupplierCreate) -> WholesaleSupplierResponse:
    gst = data.gst_no.strip().upper()
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT gst_no FROM wholesale_supplier WHERE gst_no = :1", [gst])
            if cur.fetchone():
                raise SupplyChainAlreadyExistsError(f"Wholesale supplier with GST '{gst}' already exists.")

            cur.execute(
                """
                INSERT INTO wholesale_supplier (gst_no, city, state, street)
                VALUES (:1, :2, :3, :4)
                """,
                [gst, data.city.strip(), data.state.strip(), data.street.strip()],
            )
            conn.commit()

            return WholesaleSupplierResponse(
                gst_no=gst,
                city=data.city.strip(),
                state=data.state.strip(),
                street=data.street.strip(),
            )


def update_wholesale_supplier(gst_no: str, data: WholesaleSupplierUpdate) -> Optional[WholesaleSupplierResponse]:
    existing = get_wholesale_supplier_by_gst(gst_no)
    if not existing:
        return None

    city = data.city.strip() if data.city is not None else existing.city
    state = data.state.strip() if data.state is not None else existing.state
    street = data.street.strip() if data.street is not None else existing.street

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE wholesale_supplier
                SET city = :1, state = :2, street = :3
                WHERE gst_no = :4
                """,
                [city, state, street, gst_no.strip()],
            )
            conn.commit()

    return get_wholesale_supplier_by_gst(gst_no)


def delete_wholesale_supplier(gst_no: str) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM supplier_wholesale WHERE gst_no = :1", [gst_no.strip()])
            cur.execute("DELETE FROM wholesale_supplier WHERE gst_no = :1", [gst_no.strip()])
            affected = cur.rowcount
            conn.commit()
            return affected > 0


# ==============================================================================
# MEDICINE ORDER SERVICE
# ==============================================================================
def get_all_orders(
    supplier_id: Optional[int] = None,
    pharmacy_id: Optional[int] = None,
) -> List[MedicineOrderResponse]:
    query = """
        SELECT o.order_id, o.supplier_id, o.pharmacy_id, o.quantity_ordered,
               o.order_date, o.arrival_date, o.payment_status, o.order_status,
               s.name AS supplier_name,
               p.name AS pharmacy_name
        FROM medicine_order o
        LEFT JOIN supplier s ON o.supplier_id = s.supplier_id
        LEFT JOIN pharmacy p ON o.pharmacy_id = p.pharmacy_id
        WHERE (1=1)
    """
    params: List[Any] = []
    if supplier_id is not None:
        query += " AND o.supplier_id = :" + str(len(params) + 1)
        params.append(supplier_id)
    if pharmacy_id is not None:
        query += " AND o.pharmacy_id = :" + str(len(params) + 1)
        params.append(pharmacy_id)

    query += " ORDER BY o.order_id DESC"

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            return [
                MedicineOrderResponse(
                    order_id=r[0],
                    supplier_id=r[1],
                    pharmacy_id=r[2],
                    quantity_ordered=r[3],
                    order_date=_row_to_date(r[4]),
                    arrival_date=_row_to_date(r[5]),
                    payment_status=r[6],
                    order_status=r[7],
                    supplier_name=r[8] or f"Supplier #{r[1]}",
                    pharmacy_name=r[9] or f"Pharmacy #{r[2]}",
                )
                for r in rows
            ]


def get_order_by_id(order_id: int) -> Optional[MedicineOrderResponse]:
    query = """
        SELECT o.order_id, o.supplier_id, o.pharmacy_id, o.quantity_ordered,
               o.order_date, o.arrival_date, o.payment_status, o.order_status,
               s.name AS supplier_name,
               p.name AS pharmacy_name
        FROM medicine_order o
        LEFT JOIN supplier s ON o.supplier_id = s.supplier_id
        LEFT JOIN pharmacy p ON o.pharmacy_id = p.pharmacy_id
        WHERE o.order_id = :1
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [order_id])
            r = cur.fetchone()
            if not r:
                return None
            return MedicineOrderResponse(
                order_id=r[0],
                supplier_id=r[1],
                pharmacy_id=r[2],
                quantity_ordered=r[3],
                order_date=_row_to_date(r[4]),
                arrival_date=_row_to_date(r[5]),
                payment_status=r[6],
                order_status=r[7],
                supplier_name=r[8] or f"Supplier #{r[1]}",
                pharmacy_name=r[9] or f"Pharmacy #{r[2]}",
            )


def create_order(data: MedicineOrderCreate) -> MedicineOrderResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Validate supplier exists
            cur.execute("SELECT name FROM supplier WHERE supplier_id = :1", [data.supplier_id])
            sup_row = cur.fetchone()
            if not sup_row:
                raise ValueError(f"Supplier ID {data.supplier_id} does not exist.")
            supplier_name = sup_row[0]

            # Validate pharmacy exists
            cur.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :1", [data.pharmacy_id])
            ph_row = cur.fetchone()
            if not ph_row:
                raise ValueError(f"Pharmacy ID {data.pharmacy_id} does not exist.")
            pharmacy_name = ph_row[0]

            if data.order_id:
                cur.execute("SELECT order_id FROM medicine_order WHERE order_id = :1", [data.order_id])
                if cur.fetchone():
                    raise SupplyChainAlreadyExistsError(f"Order ID {data.order_id} already exists.")
                new_id = data.order_id
            else:
                cur.execute("SELECT NVL(MAX(order_id), 900) + 1 FROM medicine_order")
                new_id = int(cur.fetchone()[0])

            order_date_val = data.order_date or date.today()
            arrival_date_val = data.arrival_date

            insert_query = """
                INSERT INTO medicine_order (
                    order_id, supplier_id, pharmacy_id, quantity_ordered,
                    order_date, arrival_date, payment_status, order_status
                )
                VALUES (
                    :1, :2, :3, :4,
                    TO_DATE(:5, 'YYYY-MM-DD'),
                    CASE WHEN :6 IS NOT NULL THEN TO_DATE(:6, 'YYYY-MM-DD') ELSE NULL END,
                    :7, :8
                )
            """
            cur.execute(
                insert_query,
                [
                    new_id,
                    data.supplier_id,
                    data.pharmacy_id,
                    data.quantity_ordered,
                    order_date_val.strftime("%Y-%m-%d"),
                    arrival_date_val.strftime("%Y-%m-%d") if arrival_date_val else None,
                    data.payment_status.lower(),
                    data.order_status.lower(),
                ],
            )
            conn.commit()

            return MedicineOrderResponse(
                order_id=new_id,
                supplier_id=data.supplier_id,
                pharmacy_id=data.pharmacy_id,
                quantity_ordered=data.quantity_ordered,
                order_date=order_date_val,
                arrival_date=arrival_date_val,
                payment_status=data.payment_status.lower(),
                order_status=data.order_status.lower(),
                supplier_name=supplier_name,
                pharmacy_name=pharmacy_name,
            )


def update_order(order_id: int, data: MedicineOrderUpdate) -> Optional[MedicineOrderResponse]:
    existing = get_order_by_id(order_id)
    if not existing:
        return None

    sup_id = data.supplier_id if data.supplier_id is not None else existing.supplier_id
    ph_id = data.pharmacy_id if data.pharmacy_id is not None else existing.pharmacy_id
    qty = data.quantity_ordered if data.quantity_ordered is not None else existing.quantity_ordered
    arr_date = data.arrival_date if data.arrival_date is not None else existing.arrival_date
    pay_stat = data.payment_status.lower() if data.payment_status is not None else existing.payment_status
    ord_stat = data.order_status.lower() if data.order_status is not None else existing.order_status

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if data.supplier_id and data.supplier_id != existing.supplier_id:
                cur.execute("SELECT supplier_id FROM supplier WHERE supplier_id = :1", [data.supplier_id])
                if not cur.fetchone():
                    raise ValueError(f"Supplier ID {data.supplier_id} does not exist.")

            if data.pharmacy_id and data.pharmacy_id != existing.pharmacy_id:
                cur.execute("SELECT pharmacy_id FROM pharmacy WHERE pharmacy_id = :1", [data.pharmacy_id])
                if not cur.fetchone():
                    raise ValueError(f"Pharmacy ID {data.pharmacy_id} does not exist.")

            update_query = """
                UPDATE medicine_order
                SET supplier_id = :1,
                    pharmacy_id = :2,
                    quantity_ordered = :3,
                    arrival_date = CASE WHEN :4 IS NOT NULL THEN TO_DATE(:4, 'YYYY-MM-DD') ELSE NULL END,
                    payment_status = :5,
                    order_status = :6
                WHERE order_id = :7
            """
            cur.execute(
                update_query,
                [
                    sup_id,
                    ph_id,
                    qty,
                    arr_date.strftime("%Y-%m-%d") if arr_date else None,
                    pay_stat,
                    ord_stat,
                    order_id,
                ],
            )
            conn.commit()

    return get_order_by_id(order_id)


def delete_order(order_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM medicine_order WHERE order_id = :1", [order_id])
            affected = cur.rowcount
            conn.commit()
            return affected > 0
