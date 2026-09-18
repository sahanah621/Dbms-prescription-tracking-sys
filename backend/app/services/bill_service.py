import logging
from typing import List, Optional
from app.database import get_db_connection
from app.schemas.bill import BillCreate, BillResponse, BillUpdate, PatientBillSummaryResponse

logger = logging.getLogger("backend.services.bill")


class BillNotFoundError(Exception):
    pass


class BillAlreadyExistsError(Exception):
    pass


def get_all_bills(patient_id: Optional[int] = None) -> List[BillResponse]:
    conditions = []
    params = {}
    if patient_id is not None:
        conditions.append("b.patient_id = :patient_id")
        params["patient_id"] = patient_id

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
        SELECT b.bill_id, b.pharmacy_id, ph.name as pharmacy_name,
               b.amount, b.patient_id, (pt.first_name || ' ' || pt.last_name) as patient_name
        FROM bill b
        JOIN pharmacy ph ON b.pharmacy_id = ph.pharmacy_id
        JOIN patient pt ON b.patient_id = pt.patient_id
        {where_clause}
        ORDER BY b.bill_id DESC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [
                BillResponse(
                    bill_id=int(r[0]),
                    pharmacy_id=int(r[1]),
                    pharmacy_name=str(r[2]).strip(),
                    amount=float(r[3]),
                    patient_id=int(r[4]),
                    patient_name=str(r[5]).strip(),
                )
                for r in rows
            ]


def get_bill_by_id(bill_id: int) -> Optional[BillResponse]:
    query = """
        SELECT b.bill_id, b.pharmacy_id, ph.name as pharmacy_name,
               b.amount, b.patient_id, (pt.first_name || ' ' || pt.last_name) as patient_name
        FROM bill b
        JOIN pharmacy ph ON b.pharmacy_id = ph.pharmacy_id
        JOIN patient pt ON b.patient_id = pt.patient_id
        WHERE b.bill_id = :id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, id=bill_id)
            r = cursor.fetchone()
            if not r:
                return None
            return BillResponse(
                bill_id=int(r[0]),
                pharmacy_id=int(r[1]),
                pharmacy_name=str(r[2]).strip(),
                amount=float(r[3]),
                patient_id=int(r[4]),
                patient_name=str(r[5]).strip(),
            )


def create_bill(data: BillCreate) -> BillResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Validate Pharmacy
            cursor.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :id", id=data.pharmacy_id)
            pharm = cursor.fetchone()
            if not pharm:
                raise ValueError(f"Pharmacy ID {data.pharmacy_id} does not exist.")
            pharm_name = pharm[0]

            # Validate Patient
            cursor.execute("SELECT first_name || ' ' || last_name FROM patient WHERE patient_id = :id", id=data.patient_id)
            pat = cursor.fetchone()
            if not pat:
                raise ValueError(f"Patient ID {data.patient_id} does not exist.")
            pat_name = pat[0]

            if data.bill_id is not None:
                cursor.execute("SELECT COUNT(*) FROM bill WHERE bill_id = :id", id=data.bill_id)
                if cursor.fetchone()[0] > 0:
                    raise BillAlreadyExistsError(f"Bill ID {data.bill_id} already exists.")
                new_id = data.bill_id
            else:
                cursor.execute("SELECT NVL(MAX(bill_id), 1100) + 1 FROM bill")
                new_id = int(cursor.fetchone()[0])

            insert_q = """
                INSERT INTO bill (bill_id, pharmacy_id, amount, patient_id)
                VALUES (:id, :pharm_id, :amount, :pat_id)
            """
            cursor.execute(
                insert_q,
                id=new_id,
                pharm_id=data.pharmacy_id,
                amount=data.amount,
                pat_id=data.patient_id,
            )
            conn.commit()
            return BillResponse(
                bill_id=new_id,
                pharmacy_id=data.pharmacy_id,
                pharmacy_name=str(pharm_name).strip(),
                amount=data.amount,
                patient_id=data.patient_id,
                patient_name=str(pat_name).strip(),
            )


def update_bill(bill_id: int, data: BillUpdate) -> Optional[BillResponse]:
    current = get_bill_by_id(bill_id)
    if not current:
        return None

    pharm_id = data.pharmacy_id if data.pharmacy_id is not None else current.pharmacy_id
    pat_id = data.patient_id if data.patient_id is not None else current.patient_id
    amount = data.amount if data.amount is not None else current.amount

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :id", id=pharm_id)
            pharm = cursor.fetchone()
            if not pharm:
                raise ValueError(f"Pharmacy ID {pharm_id} does not exist.")
            pharm_name = pharm[0]

            cursor.execute("SELECT first_name || ' ' || last_name FROM patient WHERE patient_id = :id", id=pat_id)
            pat = cursor.fetchone()
            if not pat:
                raise ValueError(f"Patient ID {pat_id} does not exist.")
            pat_name = pat[0]

            cursor.execute(
                """
                UPDATE bill
                SET pharmacy_id = :pharm_id, amount = :amount, patient_id = :pat_id
                WHERE bill_id = :id
                """,
                pharm_id=pharm_id,
                amount=amount,
                pat_id=pat_id,
                id=bill_id,
            )
            conn.commit()
            return BillResponse(
                bill_id=bill_id,
                pharmacy_id=pharm_id,
                pharmacy_name=str(pharm_name).strip(),
                amount=amount,
                patient_id=pat_id,
                patient_name=str(pat_name).strip(),
            )


def delete_bill(bill_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM bill WHERE bill_id = :id", id=bill_id)
            if cursor.fetchone()[0] == 0:
                return False
            cursor.execute("DELETE FROM bill WHERE bill_id = :id", id=bill_id)
            conn.commit()
            return True


def get_patient_bill_summary(patient_id: int) -> Optional[PatientBillSummaryResponse]:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check patient
            cursor.execute("SELECT first_name || ' ' || last_name FROM patient WHERE patient_id = :id", id=patient_id)
            pat = cursor.fetchone()
            if not pat:
                return None
            patient_name = pat[0]

            # Call Oracle PL/SQL Function: get_patient_bill_total
            cursor.execute("SELECT get_patient_bill_total(:id) FROM dual", id=patient_id)
            total = cursor.fetchone()[0]

            # Fetch patient bills
            bills = get_all_bills(patient_id=patient_id)

            return PatientBillSummaryResponse(
                patient_id=patient_id,
                patient_name=str(patient_name).strip(),
                total_billed_amount=float(total) if total is not None else 0.0,
                total_bills_count=len(bills),
                bills=bills,
            )
