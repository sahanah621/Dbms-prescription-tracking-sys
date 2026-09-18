import logging
from typing import List, Optional
import oracledb
from app.database import get_db_connection
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

logger = logging.getLogger("backend.services.facility")


class EntityNotFoundError(Exception):
    pass


class EntityAlreadyExistsError(Exception):
    pass


class EntityDependencyError(Exception):
    pass


# ==========================================
# PHARMACY SERVICE
# ==========================================
def get_all_pharmacies() -> List[PharmacyResponse]:
    query = """
        SELECT pharmacy_id, name, rating, city, state, street, contact_no
        FROM pharmacy
        ORDER BY pharmacy_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            return [
                PharmacyResponse(
                    pharmacy_id=int(r[0]),
                    name=str(r[1]).strip(),
                    rating=float(r[2]) if r[2] is not None else 0.0,
                    city=str(r[3]).strip(),
                    state=str(r[4]).strip(),
                    street=str(r[5]).strip(),
                    contact_no=str(r[6]).strip(),
                )
                for r in rows
            ]


def get_pharmacy_by_id(pharmacy_id: int) -> Optional[PharmacyResponse]:
    query = """
        SELECT pharmacy_id, name, rating, city, state, street, contact_no
        FROM pharmacy
        WHERE pharmacy_id = :id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, id=pharmacy_id)
            r = cursor.fetchone()
            if not r:
                return None
            return PharmacyResponse(
                pharmacy_id=int(r[0]),
                name=str(r[1]).strip(),
                rating=float(r[2]) if r[2] is not None else 0.0,
                city=str(r[3]).strip(),
                state=str(r[4]).strip(),
                street=str(r[5]).strip(),
                contact_no=str(r[6]).strip(),
            )


def create_pharmacy(data: PharmacyCreate) -> PharmacyResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            if data.pharmacy_id is not None:
                cursor.execute("SELECT COUNT(*) FROM pharmacy WHERE pharmacy_id = :id", id=data.pharmacy_id)
                if cursor.fetchone()[0] > 0:
                    raise EntityAlreadyExistsError(f"Pharmacy ID {data.pharmacy_id} already exists.")
                new_id = data.pharmacy_id
            else:
                cursor.execute("SELECT NVL(MAX(pharmacy_id), 100) + 1 FROM pharmacy")
                new_id = int(cursor.fetchone()[0])

            insert_q = """
                INSERT INTO pharmacy (pharmacy_id, name, rating, city, state, street, contact_no)
                VALUES (:id, :name, :rating, :city, :state, :street, :contact_no)
            """
            cursor.execute(
                insert_q,
                id=new_id,
                name=data.name.strip(),
                rating=data.rating,
                city=data.city.strip(),
                state=data.state.strip(),
                street=data.street.strip(),
                contact_no=data.contact_no.strip(),
            )
            conn.commit()
            return PharmacyResponse(
                pharmacy_id=new_id,
                name=data.name.strip(),
                rating=data.rating,
                city=data.city.strip(),
                state=data.state.strip(),
                street=data.street.strip(),
                contact_no=data.contact_no.strip(),
            )


def update_pharmacy(pharmacy_id: int, data: PharmacyUpdate) -> Optional[PharmacyResponse]:
    current = get_pharmacy_by_id(pharmacy_id)
    if not current:
        return None

    name = data.name.strip() if data.name is not None else current.name
    rating = data.rating if data.rating is not None else current.rating
    city = data.city.strip() if data.city is not None else current.city
    state = data.state.strip() if data.state is not None else current.state
    street = data.street.strip() if data.street is not None else current.street
    contact_no = data.contact_no.strip() if data.contact_no is not None else current.contact_no

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE pharmacy
                SET name = :name, rating = :rating, city = :city, state = :state, street = :street, contact_no = :contact_no
                WHERE pharmacy_id = :id
                """,
                name=name,
                rating=rating,
                city=city,
                state=state,
                street=street,
                contact_no=contact_no,
                id=pharmacy_id,
            )
            conn.commit()
            return PharmacyResponse(
                pharmacy_id=pharmacy_id,
                name=name,
                rating=rating,
                city=city,
                state=state,
                street=street,
                contact_no=contact_no,
            )


def delete_pharmacy(pharmacy_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM pharmacy WHERE pharmacy_id = :id", id=pharmacy_id)
            if cursor.fetchone()[0] == 0:
                return False
            try:
                cursor.execute("DELETE FROM pharmacy WHERE pharmacy_id = :id", id=pharmacy_id)
                conn.commit()
                return True
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                err_code = getattr(db_err.args[0], "code", None) if db_err.args else None
                if err_code == 2292:
                    raise EntityDependencyError("Cannot delete pharmacy because hospitals, pharmacists, or orders depend on it.")
                raise


# ==========================================
# PHARMACIST SERVICE
# ==========================================
def get_all_pharmacists() -> List[PharmacistResponse]:
    query = """
        SELECT p.pharmacist_id, p.pharmacy_id, ph.name as pharmacy_name, p.shift, p.name
        FROM pharmacist p
        JOIN pharmacy ph ON p.pharmacy_id = ph.pharmacy_id
        ORDER BY p.pharmacist_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            return [
                PharmacistResponse(
                    pharmacist_id=int(r[0]),
                    pharmacy_id=int(r[1]),
                    pharmacy_name=str(r[2]).strip(),
                    shift=str(r[3]).strip(),
                    name=str(r[4]).strip(),
                )
                for r in rows
            ]


def get_pharmacist_by_id(pharmacist_id: int) -> Optional[PharmacistResponse]:
    query = """
        SELECT p.pharmacist_id, p.pharmacy_id, ph.name as pharmacy_name, p.shift, p.name
        FROM pharmacist p
        JOIN pharmacy ph ON p.pharmacy_id = ph.pharmacy_id
        WHERE p.pharmacist_id = :id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, id=pharmacist_id)
            r = cursor.fetchone()
            if not r:
                return None
            return PharmacistResponse(
                pharmacist_id=int(r[0]),
                pharmacy_id=int(r[1]),
                pharmacy_name=str(r[2]).strip(),
                shift=str(r[3]).strip(),
                name=str(r[4]).strip(),
            )


def create_pharmacist(data: PharmacistCreate) -> PharmacistResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check pharmacy exists
            cursor.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :id", id=data.pharmacy_id)
            pharm = cursor.fetchone()
            if not pharm:
                raise ValueError(f"Pharmacy ID {data.pharmacy_id} does not exist.")
            pharm_name = pharm[0]

            if data.pharmacist_id is not None:
                cursor.execute("SELECT COUNT(*) FROM pharmacist WHERE pharmacist_id = :id", id=data.pharmacist_id)
                if cursor.fetchone()[0] > 0:
                    raise EntityAlreadyExistsError(f"Pharmacist ID {data.pharmacist_id} already exists.")
                new_id = data.pharmacist_id
            else:
                cursor.execute("SELECT NVL(MAX(pharmacist_id), 600) + 1 FROM pharmacist")
                new_id = int(cursor.fetchone()[0])

            insert_q = """
                INSERT INTO pharmacist (pharmacist_id, pharmacy_id, shift, name)
                VALUES (:id, :pharm_id, :shift, :name)
            """
            cursor.execute(
                insert_q,
                id=new_id,
                pharm_id=data.pharmacy_id,
                shift=data.shift.lower().strip(),
                name=data.name.strip(),
            )
            conn.commit()
            return PharmacistResponse(
                pharmacist_id=new_id,
                pharmacy_id=data.pharmacy_id,
                pharmacy_name=str(pharm_name).strip(),
                shift=data.shift.lower().strip(),
                name=data.name.strip(),
            )


def update_pharmacist(pharmacist_id: int, data: PharmacistUpdate) -> Optional[PharmacistResponse]:
    current = get_pharmacist_by_id(pharmacist_id)
    if not current:
        return None

    pharm_id = data.pharmacy_id if data.pharmacy_id is not None else current.pharmacy_id
    name = data.name.strip() if data.name is not None else current.name
    shift = data.shift.lower().strip() if data.shift is not None else current.shift

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :id", id=pharm_id)
            pharm = cursor.fetchone()
            if not pharm:
                raise ValueError(f"Pharmacy ID {pharm_id} does not exist.")
            pharm_name = pharm[0]

            cursor.execute(
                """
                UPDATE pharmacist
                SET pharmacy_id = :pharm_id, shift = :shift, name = :name
                WHERE pharmacist_id = :id
                """,
                pharm_id=pharm_id,
                shift=shift,
                name=name,
                id=pharmacist_id,
            )
            conn.commit()
            return PharmacistResponse(
                pharmacist_id=pharmacist_id,
                pharmacy_id=pharm_id,
                pharmacy_name=str(pharm_name).strip(),
                shift=shift,
                name=name,
            )


def delete_pharmacist(pharmacist_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM pharmacist WHERE pharmacist_id = :id", id=pharmacist_id)
            if cursor.fetchone()[0] == 0:
                return False
            cursor.execute("DELETE FROM pharmacist WHERE pharmacist_id = :id", id=pharmacist_id)
            conn.commit()
            return True


# ==========================================
# HOSPITAL SERVICE
# ==========================================
def get_all_hospitals() -> List[HospitalResponse]:
    query = """
        SELECT h.hospital_id, h.pharmacy_id, p.name as pharmacy_name,
               h.city, h.state, h.street, h.name, h.contact
        FROM hospital h
        JOIN pharmacy p ON h.pharmacy_id = p.pharmacy_id
        ORDER BY h.hospital_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            return [
                HospitalResponse(
                    hospital_id=int(r[0]),
                    pharmacy_id=int(r[1]),
                    pharmacy_name=str(r[2]).strip(),
                    city=str(r[3]).strip(),
                    state=str(r[4]).strip(),
                    street=str(r[5]).strip(),
                    name=str(r[6]).strip(),
                    contact=str(r[7]).strip(),
                )
                for r in rows
            ]


def get_hospital_by_id(hospital_id: int) -> Optional[HospitalResponse]:
    query = """
        SELECT h.hospital_id, h.pharmacy_id, p.name as pharmacy_name,
               h.city, h.state, h.street, h.name, h.contact
        FROM hospital h
        JOIN pharmacy p ON h.pharmacy_id = p.pharmacy_id
        WHERE h.hospital_id = :id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, id=hospital_id)
            r = cursor.fetchone()
            if not r:
                return None
            return HospitalResponse(
                hospital_id=int(r[0]),
                pharmacy_id=int(r[1]),
                pharmacy_name=str(r[2]).strip(),
                city=str(r[3]).strip(),
                state=str(r[4]).strip(),
                street=str(r[5]).strip(),
                name=str(r[6]).strip(),
                contact=str(r[7]).strip(),
            )


def create_hospital(data: HospitalCreate) -> HospitalResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :id", id=data.pharmacy_id)
            pharm = cursor.fetchone()
            if not pharm:
                raise ValueError(f"Pharmacy ID {data.pharmacy_id} does not exist.")
            pharm_name = pharm[0]

            if data.hospital_id is not None:
                cursor.execute("SELECT COUNT(*) FROM hospital WHERE hospital_id = :id", id=data.hospital_id)
                if cursor.fetchone()[0] > 0:
                    raise EntityAlreadyExistsError(f"Hospital ID {data.hospital_id} already exists.")
                new_id = data.hospital_id
            else:
                cursor.execute("SELECT NVL(MAX(hospital_id), 200) + 1 FROM hospital")
                new_id = int(cursor.fetchone()[0])

            insert_q = """
                INSERT INTO hospital (hospital_id, pharmacy_id, city, state, street, name, contact)
                VALUES (:id, :pharm_id, :city, :state, :street, :name, :contact)
            """
            cursor.execute(
                insert_q,
                id=new_id,
                pharm_id=data.pharmacy_id,
                city=data.city.strip(),
                state=data.state.strip(),
                street=data.street.strip(),
                name=data.name.strip(),
                contact=data.contact.strip(),
            )
            conn.commit()
            return HospitalResponse(
                hospital_id=new_id,
                pharmacy_id=data.pharmacy_id,
                pharmacy_name=str(pharm_name).strip(),
                city=data.city.strip(),
                state=data.state.strip(),
                street=data.street.strip(),
                name=data.name.strip(),
                contact=data.contact.strip(),
            )


def update_hospital(hospital_id: int, data: HospitalUpdate) -> Optional[HospitalResponse]:
    current = get_hospital_by_id(hospital_id)
    if not current:
        return None

    pharm_id = data.pharmacy_id if data.pharmacy_id is not None else current.pharmacy_id
    city = data.city.strip() if data.city is not None else current.city
    state = data.state.strip() if data.state is not None else current.state
    street = data.street.strip() if data.street is not None else current.street
    name = data.name.strip() if data.name is not None else current.name
    contact = data.contact.strip() if data.contact is not None else current.contact

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM pharmacy WHERE pharmacy_id = :id", id=pharm_id)
            pharm = cursor.fetchone()
            if not pharm:
                raise ValueError(f"Pharmacy ID {pharm_id} does not exist.")
            pharm_name = pharm[0]

            cursor.execute(
                """
                UPDATE hospital
                SET pharmacy_id = :pharm_id, city = :city, state = :state, street = :street, name = :name, contact = :contact
                WHERE hospital_id = :id
                """,
                pharm_id=pharm_id,
                city=city,
                state=state,
                street=street,
                name=name,
                contact=contact,
                id=hospital_id,
            )
            conn.commit()
            return HospitalResponse(
                hospital_id=hospital_id,
                pharmacy_id=pharm_id,
                pharmacy_name=str(pharm_name).strip(),
                city=city,
                state=state,
                street=street,
                name=name,
                contact=contact,
            )


def delete_hospital(hospital_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM hospital WHERE hospital_id = :id", id=hospital_id)
            if cursor.fetchone()[0] == 0:
                return False
            try:
                cursor.execute("DELETE FROM hospital WHERE hospital_id = :id", id=hospital_id)
                conn.commit()
                return True
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                err_code = getattr(db_err.args[0], "code", None) if db_err.args else None
                if err_code == 2292:
                    raise EntityDependencyError("Cannot delete hospital because doctor records are affiliated with it.")
                raise


# ==========================================
# DOCTOR SERVICE
# ==========================================
def get_all_doctors() -> List[DoctorResponse]:
    query = """
        SELECT d.doctor_id, d.hospital_id, h.name as hospital_name,
               d.first_name, d.last_name, d.qualification, d.experience, d.contact_no
        FROM doctor d
        JOIN hospital h ON d.hospital_id = h.hospital_id
        ORDER BY d.doctor_id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            return [
                DoctorResponse(
                    doctor_id=int(r[0]),
                    hospital_id=int(r[1]),
                    hospital_name=str(r[2]).strip(),
                    first_name=str(r[3]).strip(),
                    last_name=str(r[4]).strip(),
                    qualification=str(r[5]).strip(),
                    experience=int(r[6]) if r[6] is not None else 0,
                    contact_no=str(r[7]).strip(),
                )
                for r in rows
            ]


def get_doctor_by_id(doctor_id: int) -> Optional[DoctorResponse]:
    query = """
        SELECT d.doctor_id, d.hospital_id, h.name as hospital_name,
               d.first_name, d.last_name, d.qualification, d.experience, d.contact_no
        FROM doctor d
        JOIN hospital h ON d.hospital_id = h.hospital_id
        WHERE d.doctor_id = :id
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, id=doctor_id)
            r = cursor.fetchone()
            if not r:
                return None
            return DoctorResponse(
                doctor_id=int(r[0]),
                hospital_id=int(r[1]),
                hospital_name=str(r[2]).strip(),
                first_name=str(r[3]).strip(),
                last_name=str(r[4]).strip(),
                qualification=str(r[5]).strip(),
                experience=int(r[6]) if r[6] is not None else 0,
                contact_no=str(r[7]).strip(),
            )


def create_doctor(data: DoctorCreate) -> DoctorResponse:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM hospital WHERE hospital_id = :id", id=data.hospital_id)
            hosp = cursor.fetchone()
            if not hosp:
                raise ValueError(f"Hospital ID {data.hospital_id} does not exist.")
            hosp_name = hosp[0]

            if data.doctor_id is not None:
                cursor.execute("SELECT COUNT(*) FROM doctor WHERE doctor_id = :id", id=data.doctor_id)
                if cursor.fetchone()[0] > 0:
                    raise EntityAlreadyExistsError(f"Doctor ID {data.doctor_id} already exists.")
                new_id = data.doctor_id
            else:
                cursor.execute("SELECT NVL(MAX(doctor_id), 300) + 1 FROM doctor")
                new_id = int(cursor.fetchone()[0])

            insert_q = """
                INSERT INTO doctor (doctor_id, hospital_id, experience, contact_no, first_name, last_name, qualification)
                VALUES (:id, :hosp_id, :exp, :contact, :first_name, :last_name, :qual)
            """
            cursor.execute(
                insert_q,
                id=new_id,
                hosp_id=data.hospital_id,
                exp=data.experience,
                contact=data.contact_no.strip(),
                first_name=data.first_name.strip(),
                last_name=data.last_name.strip(),
                qual=data.qualification.strip(),
            )
            conn.commit()
            return DoctorResponse(
                doctor_id=new_id,
                hospital_id=data.hospital_id,
                hospital_name=str(hosp_name).strip(),
                first_name=data.first_name.strip(),
                last_name=data.last_name.strip(),
                qualification=data.qualification.strip(),
                experience=data.experience,
                contact_no=data.contact_no.strip(),
            )


def update_doctor(doctor_id: int, data: DoctorUpdate) -> Optional[DoctorResponse]:
    current = get_doctor_by_id(doctor_id)
    if not current:
        return None

    hosp_id = data.hospital_id if data.hospital_id is not None else current.hospital_id
    first_name = data.first_name.strip() if data.first_name is not None else current.first_name
    last_name = data.last_name.strip() if data.last_name is not None else current.last_name
    qual = data.qualification.strip() if data.qualification is not None else current.qualification
    exp = data.experience if data.experience is not None else current.experience
    contact_no = data.contact_no.strip() if data.contact_no is not None else current.contact_no

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM hospital WHERE hospital_id = :id", id=hosp_id)
            hosp = cursor.fetchone()
            if not hosp:
                raise ValueError(f"Hospital ID {hosp_id} does not exist.")
            hosp_name = hosp[0]

            cursor.execute(
                """
                UPDATE doctor
                SET hospital_id = :hosp_id, experience = :exp, contact_no = :contact,
                    first_name = :first_name, last_name = :last_name, qualification = :qual
                WHERE doctor_id = :id
                """,
                hosp_id=hosp_id,
                exp=exp,
                contact=contact_no,
                first_name=first_name,
                last_name=last_name,
                qual=qual,
                id=doctor_id,
            )
            conn.commit()
            return DoctorResponse(
                doctor_id=doctor_id,
                hospital_id=hosp_id,
                hospital_name=str(hosp_name).strip(),
                first_name=first_name,
                last_name=last_name,
                qualification=qual,
                experience=exp,
                contact_no=contact_no,
            )


def delete_doctor(doctor_id: int) -> bool:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM doctor WHERE doctor_id = :id", id=doctor_id)
            if cursor.fetchone()[0] == 0:
                return False
            try:
                cursor.execute("DELETE FROM doctor WHERE doctor_id = :id", id=doctor_id)
                conn.commit()
                return True
            except oracledb.DatabaseError as db_err:
                conn.rollback()
                err_code = getattr(db_err.args[0], "code", None) if db_err.args else None
                if err_code == 2292:
                    raise EntityDependencyError("Cannot delete doctor because prescriptions exist for this doctor.")
                raise
