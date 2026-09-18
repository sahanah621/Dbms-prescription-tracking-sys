import datetime
import logging
from typing import List, Optional
import oracledb
from app.database import get_db_connection
from app.schemas.medicine import MedicineCreate, MedicineResponse, MedicineUpdate

logger = logging.getLogger("backend.services.medicine")


class MedicineNotFoundError(Exception):
    pass


class MedicineAlreadyExistsError(Exception):
    pass


class MedicineDependencyError(Exception):
    pass


def _row_to_medicine(row: tuple) -> MedicineResponse:
    medicine_id, manu_date_raw, exp_date_raw, name, price, available_qty = row
    manu_date = manu_date_raw.date() if isinstance(manu_date_raw, datetime.datetime) else manu_date_raw
    exp_date = exp_date_raw.date() if isinstance(exp_date_raw, datetime.datetime) else exp_date_raw
    is_expired = exp_date < datetime.date.today()

    return MedicineResponse(
        medicine_id=int(medicine_id),
        name=str(name).strip(),
        manu_date=manu_date,
        exp_date=exp_date,
        price=float(price),
        available_quantity=int(available_qty),
        is_expired=is_expired,
    )


def get_all_medicines() -> List[MedicineResponse]:
    query = """
        SELECT medicine_id, manu_date, exp_date, name, price, available_quantity
        FROM medicine
        ORDER BY medicine_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            return [_row_to_medicine(r) for r in rows]


def get_medicine_by_id(medicine_id: int) -> Optional[MedicineResponse]:
    query = """
        SELECT medicine_id, manu_date, exp_date, name, price, available_quantity
        FROM medicine
        WHERE medicine_id = :medicine_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, medicine_id=medicine_id)
            row = cursor.fetchone()
            if row:
                return _row_to_medicine(row)
            return None


def create_medicine(data: MedicineCreate) -> MedicineResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            if data.medicine_id is not None:
                cursor.execute(
                    "SELECT COUNT(*) FROM medicine WHERE medicine_id = :medicine_id",
                    medicine_id=data.medicine_id,
                )
                if cursor.fetchone()[0] > 0:
                    raise MedicineAlreadyExistsError(f"Medicine ID {data.medicine_id} already exists.")
                new_id = data.medicine_id
            else:
                cursor.execute("SELECT NVL(MAX(medicine_id), 500) + 1 FROM medicine")
                new_id = int(cursor.fetchone()[0])

            insert_query = """
                INSERT INTO medicine (
                    medicine_id, manu_date, exp_date, name, price, available_quantity
                ) VALUES (
                    :medicine_id, :manu_date, :exp_date, :name, :price, :available_quantity
                )
            """
            params = {
                "medicine_id": new_id,
                "manu_date": data.manu_date,
                "exp_date": data.exp_date,
                "name": data.name.strip(),
                "price": data.price,
                "available_quantity": data.available_quantity,
            }

            try:
                cursor.execute(insert_query, params)
                conn.commit()
                logger.info("Created medicine ID %d", new_id)
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                logger.error("Oracle error inserting medicine: %s", db_err)
                raise

            is_expired = data.exp_date < datetime.date.today()
            return MedicineResponse(
                medicine_id=new_id,
                name=data.name.strip(),
                manu_date=data.manu_date,
                exp_date=data.exp_date,
                price=data.price,
                available_quantity=data.available_quantity,
                is_expired=is_expired,
            )


def update_medicine(medicine_id: int, update_data: MedicineUpdate) -> Optional[MedicineResponse]:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT medicine_id, manu_date, exp_date, name, price, available_quantity
                FROM medicine
                WHERE medicine_id = :medicine_id
                """,
                medicine_id=medicine_id,
            )
            current = cursor.fetchone()
            if not current:
                return None

            current_med = _row_to_medicine(current)

            new_name = update_data.name.strip() if update_data.name is not None else current_med.name
            new_manu = update_data.manu_date if update_data.manu_date is not None else current_med.manu_date
            new_exp = update_data.exp_date if update_data.exp_date is not None else current_med.exp_date
            new_price = update_data.price if update_data.price is not None else current_med.price
            new_qty = (
                update_data.available_quantity
                if update_data.available_quantity is not None
                else current_med.available_quantity
            )

            if new_exp <= new_manu:
                raise ValueError("Expiry date must be after manufacturing date.")

            update_query = """
                UPDATE medicine
                SET name = :name,
                    manu_date = :manu_date,
                    exp_date = :exp_date,
                    price = :price,
                    available_quantity = :available_quantity
                WHERE medicine_id = :medicine_id
            """
            params = {
                "medicine_id": medicine_id,
                "name": new_name,
                "manu_date": new_manu,
                "exp_date": new_exp,
                "price": new_price,
                "available_quantity": new_qty,
            }

            try:
                cursor.execute(update_query, params)
                conn.commit()
                logger.info("Updated medicine ID %d", medicine_id)
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                logger.error("Oracle error updating medicine: %s", db_err)
                raise

            return MedicineResponse(
                medicine_id=medicine_id,
                name=new_name,
                manu_date=new_manu,
                exp_date=new_exp,
                price=new_price,
                available_quantity=new_qty,
                is_expired=new_exp < datetime.date.today(),
            )


def delete_medicine(medicine_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM medicine WHERE medicine_id = :id", id=medicine_id)
            if cursor.fetchone()[0] == 0:
                return False

            try:
                cursor.execute("DELETE FROM medicine WHERE medicine_id = :id", id=medicine_id)
                conn.commit()
                logger.info("Deleted medicine ID %d", medicine_id)
                return True
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                error_obj = db_err.args[0] if db_err.args else None
                error_code = getattr(error_obj, "code", None)
                if error_code == 2292:
                    raise MedicineDependencyError(
                        f"Cannot delete medicine {medicine_id} because it is referenced in existing prescriptions."
                    )
                logger.error("Oracle error deleting medicine: %s", db_err)
                raise
