import datetime
import logging
from typing import List, Optional
import oracledb
from app.database import get_db_connection
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionItemResponse,
    PrescriptionResponse,
)

logger = logging.getLogger("backend.services.prescription")


class PrescriptionNotFoundError(Exception):
    pass


class PrescriptionAlreadyExistsError(Exception):
    pass


def _fetch_items_for_prescriptions(cursor, prescription_ids: List[int]) -> dict:
    if not prescription_ids:
        return {}

    id_list = ",".join(str(i) for i in prescription_ids)
    query = f"""
        SELECT pi.item_id, pi.prescription_id, pi.medicine_id, m.name,
               pi.dosage, pi.frequency, pi.duration, m.price
        FROM prescription_item pi
        JOIN medicine m ON pi.medicine_id = m.medicine_id
        WHERE pi.prescription_id IN ({id_list})
        ORDER BY pi.item_id
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    items_by_rx = {}
    for r in rows:
        item_id, rx_id, med_id, med_name, dosage, freq, duration, price = r
        item = PrescriptionItemResponse(
            item_id=int(item_id),
            prescription_id=int(rx_id),
            medicine_id=int(med_id),
            medicine_name=str(med_name).strip(),
            dosage=str(dosage).strip(),
            frequency=str(freq).strip(),
            duration=str(duration).strip(),
            unit_price=float(price) if price is not None else 0.0,
        )
        items_by_rx.setdefault(int(rx_id), []).append(item)
    return items_by_rx


def get_all_prescriptions(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
) -> List[PrescriptionResponse]:
    conditions = []
    params = {}
    if patient_id is not None:
        conditions.append("p.patient_id = :patient_id")
        params["patient_id"] = patient_id
    if doctor_id is not None:
        conditions.append("p.doctor_id = :doctor_id")
        params["doctor_id"] = doctor_id

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
        SELECT p.prescription_id, p.doctor_id, 
               (d.first_name || ' ' || d.last_name) AS doctor_name,
               p.patient_id, 
               (pt.first_name || ' ' || pt.last_name) AS patient_name,
               p.prescription_date
        FROM prescription p
        JOIN doctor d ON p.doctor_id = d.doctor_id
        JOIN patient pt ON p.patient_id = pt.patient_id
        {where_clause}
        ORDER BY p.prescription_id DESC
    """

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
            if not rows:
                return []

            rx_ids = [int(r[0]) for r in rows]
            items_by_rx = _fetch_items_for_prescriptions(cursor, rx_ids)

            results = []
            for r in rows:
                rx_id, doc_id, doc_name, pat_id, pat_name, rx_date_raw = r
                rx_date = (
                    rx_date_raw.date()
                    if isinstance(rx_date_raw, datetime.datetime)
                    else rx_date_raw
                )
                items = items_by_rx.get(int(rx_id), [])
                cost = sum(it.unit_price or 0.0 for it in items)

                results.append(
                    PrescriptionResponse(
                        prescription_id=int(rx_id),
                        doctor_id=int(doc_id),
                        doctor_name=str(doc_name).strip(),
                        patient_id=int(pat_id),
                        patient_name=str(pat_name).strip(),
                        prescription_date=rx_date,
                        items=items,
                        total_items=len(items),
                        estimated_total_cost=round(cost, 2),
                    )
                )
            return results


def get_prescription_by_id(prescription_id: int) -> Optional[PrescriptionResponse]:
    query = """
        SELECT p.prescription_id, p.doctor_id, 
               (d.first_name || ' ' || d.last_name) AS doctor_name,
               p.patient_id, 
               (pt.first_name || ' ' || pt.last_name) AS patient_name,
               p.prescription_date
        FROM prescription p
        JOIN doctor d ON p.doctor_id = d.doctor_id
        JOIN patient pt ON p.patient_id = pt.patient_id
        WHERE p.prescription_id = :prescription_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, prescription_id=prescription_id)
            row = cursor.fetchone()
            if not row:
                return None

            rx_id, doc_id, doc_name, pat_id, pat_name, rx_date_raw = row
            rx_date = (
                rx_date_raw.date()
                if isinstance(rx_date_raw, datetime.datetime)
                else rx_date_raw
            )
            items_by_rx = _fetch_items_for_prescriptions(cursor, [prescription_id])
            items = items_by_rx.get(prescription_id, [])
            cost = sum(it.unit_price or 0.0 for it in items)

            return PrescriptionResponse(
                prescription_id=int(rx_id),
                doctor_id=int(doc_id),
                doctor_name=str(doc_name).strip(),
                patient_id=int(pat_id),
                patient_name=str(pat_name).strip(),
                prescription_date=rx_date,
                items=items,
                total_items=len(items),
                estimated_total_cost=round(cost, 2),
            )


def create_prescription(data: PrescriptionCreate) -> PrescriptionResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check Doctor exists
            cursor.execute("SELECT first_name || ' ' || last_name FROM doctor WHERE doctor_id = :id", id=data.doctor_id)
            doc_row = cursor.fetchone()
            if not doc_row:
                raise ValueError(f"Doctor with ID {data.doctor_id} does not exist.")
            doc_name = doc_row[0]

            # Check Patient exists
            cursor.execute("SELECT first_name || ' ' || last_name FROM patient WHERE patient_id = :id", id=data.patient_id)
            pat_row = cursor.fetchone()
            if not pat_row:
                raise ValueError(f"Patient with ID {data.patient_id} does not exist.")
            pat_name = pat_row[0]

            # Determine prescription_id
            if data.prescription_id is not None:
                cursor.execute(
                    "SELECT COUNT(*) FROM prescription WHERE prescription_id = :id",
                    id=data.prescription_id,
                )
                if cursor.fetchone()[0] > 0:
                    raise PrescriptionAlreadyExistsError(f"Prescription ID {data.prescription_id} already exists.")
                new_rx_id = data.prescription_id
            else:
                cursor.execute("SELECT NVL(MAX(prescription_id), 1000) + 1 FROM prescription")
                new_rx_id = int(cursor.fetchone()[0])

            rx_date = data.prescription_date or datetime.date.today()

            # Insert Prescription header
            insert_rx = """
                INSERT INTO prescription (prescription_id, doctor_id, patient_id, prescription_date)
                VALUES (:rx_id, :doc_id, :pat_id, :rx_date)
            """
            try:
                cursor.execute(insert_rx, rx_id=new_rx_id, doc_id=data.doctor_id, pat_id=data.patient_id, rx_date=rx_date)

                created_items: List[PrescriptionItemResponse] = []
                # Insert Prescription items
                for item in data.items:
                    # Validate medicine exists
                    cursor.execute("SELECT name, price FROM medicine WHERE medicine_id = :med_id", med_id=item.medicine_id)
                    med_row = cursor.fetchone()
                    if not med_row:
                        raise ValueError(f"Medicine with ID {item.medicine_id} does not exist.")
                    med_name, med_price = med_row

                    cursor.execute("SELECT NVL(MAX(item_id), 0) + 1 FROM prescription_item")
                    new_item_id = int(cursor.fetchone()[0])

                    insert_item = """
                        INSERT INTO prescription_item (item_id, prescription_id, medicine_id, dosage, frequency, duration)
                        VALUES (:item_id, :rx_id, :med_id, :dosage, :frequency, :duration)
                    """
                    cursor.execute(
                        insert_item,
                        item_id=new_item_id,
                        rx_id=new_rx_id,
                        med_id=item.medicine_id,
                        dosage=item.dosage.strip(),
                        frequency=item.frequency.strip(),
                        duration=item.duration.strip(),
                    )
                    created_items.append(
                        PrescriptionItemResponse(
                            item_id=new_item_id,
                            prescription_id=new_rx_id,
                            medicine_id=item.medicine_id,
                            medicine_name=str(med_name).strip(),
                            dosage=item.dosage.strip(),
                            frequency=item.frequency.strip(),
                            duration=item.duration.strip(),
                            unit_price=float(med_price) if med_price is not None else 0.0,
                        )
                    )

                conn.commit()
                logger.info("Created prescription %d with %d items", new_rx_id, len(created_items))
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                logger.error("Oracle error creating prescription: %s", db_err)
                raise

            cost = sum(it.unit_price or 0.0 for it in created_items)
            return PrescriptionResponse(
                prescription_id=new_rx_id,
                doctor_id=data.doctor_id,
                doctor_name=str(doc_name).strip(),
                patient_id=data.patient_id,
                patient_name=str(pat_name).strip(),
                prescription_date=rx_date,
                items=created_items,
                total_items=len(created_items),
                estimated_total_cost=round(cost, 2),
            )


def delete_prescription(prescription_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM prescription WHERE prescription_id = :id", id=prescription_id)
            if cursor.fetchone()[0] == 0:
                return False

            try:
                # Delete items first
                cursor.execute("DELETE FROM prescription_item WHERE prescription_id = :id", id=prescription_id)
                # Delete header
                cursor.execute("DELETE FROM prescription WHERE prescription_id = :id", id=prescription_id)
                conn.commit()
                logger.info("Deleted prescription %d and associated items", prescription_id)
                return True
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                logger.error("Oracle error deleting prescription: %s", db_err)
                raise
