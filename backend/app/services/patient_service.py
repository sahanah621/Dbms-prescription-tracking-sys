import datetime
import logging
from typing import Any, Dict, List, Optional
import oracledb
from app.database import get_db_connection
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate

logger = logging.getLogger("backend.services.patient")


class PatientNotFoundError(Exception):
    """Raised when a patient record is not found."""
    pass


class PatientAlreadyExistsError(Exception):
    """Raised when attempting to create a patient with an existing ID."""
    pass


class PatientDependencyError(Exception):
    """Raised when a patient cannot be deleted due to foreign key constraints."""
    pass


def _row_to_patient(row: tuple) -> PatientResponse:
    """Helper to convert a database tuple to a PatientResponse schema."""
    patient_id, raw_dob, raw_sex, city, state, street, first_name, last_name = row
    
    # Handle datetime vs date from Oracle driver
    if isinstance(raw_dob, datetime.datetime):
        dob = raw_dob.date()
    else:
        dob = raw_dob

    return PatientResponse(
        patient_id=int(patient_id),
        dob=dob,
        sex=str(raw_sex).strip(),
        city=str(city).strip(),
        state=str(state).strip(),
        street=str(street).strip(),
        first_name=str(first_name).strip(),
        last_name=str(last_name).strip(),
    )


def get_all_patients() -> List[PatientResponse]:
    """Retrieve all patients from Oracle, ordered by patient_id."""
    query = """
        SELECT patient_id, dob, sex, city, state, street, first_name, last_name
        FROM patient
        ORDER BY patient_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            return [_row_to_patient(r) for r in rows]


def get_patient_by_id(patient_id: int) -> Optional[PatientResponse]:
    """Retrieve a single patient by ID."""
    query = """
        SELECT patient_id, dob, sex, city, state, street, first_name, last_name
        FROM patient
        WHERE patient_id = :patient_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, patient_id=patient_id)
            row = cursor.fetchone()
            if row:
                return _row_to_patient(row)
            return None


def create_patient(patient_data: PatientCreate) -> PatientResponse:
    """
    Insert a new patient record into the Oracle database.
    If patient_id is not provided, assigns the next available ID.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Determine or validate patient_id
            if patient_data.patient_id is not None:
                cursor.execute(
                    "SELECT COUNT(*) FROM patient WHERE patient_id = :patient_id",
                    patient_id=patient_data.patient_id,
                )
                if cursor.fetchone()[0] > 0:
                    raise PatientAlreadyExistsError(
                        f"Patient with ID {patient_data.patient_id} already exists."
                    )
                new_id = patient_data.patient_id
            else:
                cursor.execute("SELECT NVL(MAX(patient_id), 400) + 1 FROM patient")
                new_id = int(cursor.fetchone()[0])

            insert_query = """
                INSERT INTO patient (
                    patient_id, dob, sex, city, state, street, first_name, last_name
                ) VALUES (
                    :patient_id, :dob, :sex, :city, :state, :street, :first_name, :last_name
                )
            """

            # Bind values
            params = {
                "patient_id": new_id,
                "dob": patient_data.dob,
                "sex": patient_data.sex.upper(),
                "city": patient_data.city.strip(),
                "state": patient_data.state.strip(),
                "street": patient_data.street.strip(),
                "first_name": patient_data.first_name.strip(),
                "last_name": patient_data.last_name.strip(),
            }

            try:
                cursor.execute(insert_query, params)
                conn.commit()
                logger.info("Created patient ID %d successfully", new_id)
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                error_obj = db_err.args[0] if db_err.args else None
                error_code = getattr(error_obj, "code", None)
                error_msg = getattr(error_obj, "message", str(db_err))
                logger.error("Oracle error inserting patient [%s]: %s", error_code, error_msg)
                raise

            return PatientResponse(
                patient_id=new_id,
                dob=patient_data.dob,
                sex=patient_data.sex.upper(),
                city=patient_data.city.strip(),
                state=patient_data.state.strip(),
                street=patient_data.street.strip(),
                first_name=patient_data.first_name.strip(),
                last_name=patient_data.last_name.strip(),
            )


def update_patient(patient_id: int, patient_update: PatientUpdate) -> Optional[PatientResponse]:
    """
    Update an existing patient's details in the Oracle database.
    Returns the updated patient, or None if the patient was not found.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check existing patient
            cursor.execute(
                """
                SELECT patient_id, dob, sex, city, state, street, first_name, last_name
                FROM patient
                WHERE patient_id = :patient_id
                """,
                patient_id=patient_id,
            )
            current = cursor.fetchone()
            if not current:
                return None

            current_patient = _row_to_patient(current)

            # Merge updated fields
            updated_dob = patient_update.dob if patient_update.dob is not None else current_patient.dob
            updated_sex = (
                patient_update.sex.upper() if patient_update.sex is not None else current_patient.sex
            )
            updated_city = (
                patient_update.city.strip() if patient_update.city is not None else current_patient.city
            )
            updated_state = (
                patient_update.state.strip()
                if patient_update.state is not None
                else current_patient.state
            )
            updated_street = (
                patient_update.street.strip()
                if patient_update.street is not None
                else current_patient.street
            )
            updated_first_name = (
                patient_update.first_name.strip()
                if patient_update.first_name is not None
                else current_patient.first_name
            )
            updated_last_name = (
                patient_update.last_name.strip()
                if patient_update.last_name is not None
                else current_patient.last_name
            )

            update_query = """
                UPDATE patient
                SET dob = :dob,
                    sex = :sex,
                    city = :city,
                    state = :state,
                    street = :street,
                    first_name = :first_name,
                    last_name = :last_name
                WHERE patient_id = :patient_id
            """

            params = {
                "patient_id": patient_id,
                "dob": updated_dob,
                "sex": updated_sex,
                "city": updated_city,
                "state": updated_state,
                "street": updated_street,
                "first_name": updated_first_name,
                "last_name": updated_last_name,
            }

            try:
                cursor.execute(update_query, params)
                conn.commit()
                logger.info("Updated patient ID %d successfully", patient_id)
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                error_obj = db_err.args[0] if db_err.args else None
                error_code = getattr(error_obj, "code", None)
                error_msg = getattr(error_obj, "message", str(db_err))
                logger.error("Oracle error updating patient [%s]: %s", error_code, error_msg)
                raise

            return PatientResponse(
                patient_id=patient_id,
                dob=updated_dob,
                sex=updated_sex,
                city=updated_city,
                state=updated_state,
                street=updated_street,
                first_name=updated_first_name,
                last_name=updated_last_name,
            )


def delete_patient(patient_id: int) -> bool:
    """
    Delete a patient record by ID from the Oracle database.
    Returns True if deleted, or False if patient does not exist.
    Raises PatientDependencyError if foreign key constraints block deletion.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check existence
            cursor.execute(
                "SELECT COUNT(*) FROM patient WHERE patient_id = :patient_id",
                patient_id=patient_id,
            )
            if cursor.fetchone()[0] == 0:
                return False

            try:
                cursor.execute(
                    "DELETE FROM patient WHERE patient_id = :patient_id",
                    patient_id=patient_id,
                )
                conn.commit()
                logger.info("Deleted patient ID %d successfully", patient_id)
                return True
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                error_obj = db_err.args[0] if db_err.args else None
                error_code = getattr(error_obj, "code", None)
                error_msg = getattr(error_obj, "message", str(db_err))

                # ORA-02292: integrity constraint violated - child record found
                if error_code == 2292:
                    logger.warning("Foreign key violation deleting patient %d: %s", patient_id, error_msg)
                    raise PatientDependencyError(
                        f"Cannot delete patient {patient_id} because dependent records (e.g. contact numbers, prescriptions, or bills) exist."
                    )
                logger.error("Oracle error deleting patient [%s]: %s", error_code, error_msg)
                raise
