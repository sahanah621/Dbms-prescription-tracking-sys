
create or replace procedure add_pharmacy(
    p_pharmacy_id number,
    p_name varchar2,
    p_rating number,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_contact_no varchar2
)
is
begin
    insert into pharmacy
    values(p_pharmacy_id,p_name,p_rating,p_city,p_state,p_street,p_contact_no);
end;
/

create or replace procedure update_pharmacy(
    p_pharmacy_id number,
    p_name varchar2,
    p_rating number,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_contact_no varchar2
)
is
begin
    update pharmacy
    set name=p_name,
        rating=p_rating,
        city=p_city,
        state=p_state,
        street=p_street,
        contact_no=p_contact_no
    where pharmacy_id=p_pharmacy_id;
end;
/

create or replace procedure delete_pharmacy(
    p_pharmacy_id number
)
is
begin
    delete from pharmacy
    where pharmacy_id=p_pharmacy_id;
end;
/



create or replace procedure add_patient(
    p_patient_id number,
    p_dob date,
    p_sex char,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_first_name varchar2,
    p_last_name varchar2
)
is
begin
    insert into patient
    values(p_patient_id,p_dob,p_sex,p_city,p_state,p_street,p_first_name,p_last_name);
end;
/

create or replace procedure update_patient(
    p_patient_id number,
    p_dob date,
    p_sex char,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_first_name varchar2,
    p_last_name varchar2
)
is
begin
    update patient
    set dob=p_dob,
        sex=p_sex,
        city=p_city,
        state=p_state,
        street=p_street,
        first_name=p_first_name,
        last_name=p_last_name
    where patient_id=p_patient_id;
end;
/

create or replace procedure delete_patient(
    p_patient_id number
)
is
begin
    delete from patient
    where patient_id=p_patient_id;
end;
/



create or replace procedure add_patient_contact(
    p_patient_id number,
    p_contact_no varchar2
)
is
begin
    insert into patient_contact
    values(p_patient_id,p_contact_no);
end;
/

create or replace procedure update_patient_contact(
    p_patient_id number,
    p_old_contact_no varchar2,
    p_new_contact_no varchar2
)
is
begin
    update patient_contact
    set contact_no=p_new_contact_no
    where patient_id=p_patient_id
    and contact_no=p_old_contact_no;
end;
/

create or replace procedure delete_patient_contact(
    p_patient_id number,
    p_contact_no varchar2
)
is
begin
    delete from patient_contact
    where patient_id=p_patient_id
    and contact_no=p_contact_no;
end;
/

create or replace procedure add_hospital(
    p_hospital_id number,
    p_pharmacy_id number,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_name varchar2,
    p_contact varchar2
)
is
begin
    insert into hospital
    values(p_hospital_id,p_pharmacy_id,p_city,p_state,p_street,p_name,p_contact);
end;
/

create or replace procedure update_hospital(
    p_hospital_id number,
    p_pharmacy_id number,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_name varchar2,
    p_contact varchar2
)
is
begin
    update hospital
    set pharmacy_id=p_pharmacy_id,
        city=p_city,
        state=p_state,
        street=p_street,
        name=p_name,
        contact=p_contact
    where hospital_id=p_hospital_id;
end;
/

create or replace procedure delete_hospital(
    p_hospital_id number
)
is
begin
    delete from hospital
    where hospital_id=p_hospital_id;
end;
/



create or replace procedure add_doctor(
    p_doctor_id number,
    p_hospital_id number,
    p_experience number,
    p_contact_no varchar2,
    p_first_name varchar2,
    p_last_name varchar2,
    p_qualification varchar2
)
is
begin
    insert into doctor
    values(p_doctor_id,p_hospital_id,p_experience,p_contact_no,p_first_name,p_last_name,p_qualification);
end;
/

create or replace procedure update_doctor(
    p_doctor_id number,
    p_hospital_id number,
    p_experience number,
    p_contact_no varchar2,
    p_first_name varchar2,
    p_last_name varchar2,
    p_qualification varchar2
)
is
begin
    update doctor
    set hospital_id=p_hospital_id,
        experience=p_experience,
        contact_no=p_contact_no,
        first_name=p_first_name,
        last_name=p_last_name,
        qualification=p_qualification
    where doctor_id=p_doctor_id;
end;
/

create or replace procedure delete_doctor(
    p_doctor_id number
)
is
begin
    delete from doctor
    where doctor_id=p_doctor_id;
end;
/



create or replace procedure add_prescription(
    p_prescription_id number,
    p_doctor_id number,
    p_patient_id number,
    p_prescription_date date
)
is
begin
    insert into prescription
    values(p_prescription_id,p_doctor_id,p_patient_id,p_prescription_date);
end;
/

create or replace procedure update_prescription(
    p_prescription_id number,
    p_doctor_id number,
    p_patient_id number,
    p_prescription_date date
)
is
begin
    update prescription
    set doctor_id=p_doctor_id,
        patient_id=p_patient_id,
        prescription_date=p_prescription_date
    where prescription_id=p_prescription_id;
end;
/

create or replace procedure delete_prescription(
    p_prescription_id number
)
is
begin
    delete from prescription
    where prescription_id=p_prescription_id;
end;
/



create or replace procedure add_medicine(
    p_medicine_id number,
    p_manu_date date,
    p_exp_date date,
    p_name varchar2,
    p_price number,
    p_available_quantity number
)
is
begin
    insert into medicine
    values(p_medicine_id,p_manu_date,p_exp_date,p_name,p_price,p_available_quantity);
end;
/

create or replace procedure update_medicine(
    p_medicine_id number,
    p_manu_date date,
    p_exp_date date,
    p_name varchar2,
    p_price number,
    p_available_quantity number
)
is
begin
    update medicine
    set manu_date=p_manu_date,
        exp_date=p_exp_date,
        name=p_name,
        price=p_price,
        available_quantity=p_available_quantity
    where medicine_id=p_medicine_id;
end;
/

create or replace procedure delete_medicine(
    p_medicine_id number
)
is
begin
    delete from medicine
    where medicine_id=p_medicine_id;
end;
/



create or replace procedure add_prescription_item(
    p_item_id number,
    p_prescription_id number,
    p_medicine_id number,
    p_dosage varchar2,
    p_frequency varchar2,
    p_duration varchar2
)
is
begin
    insert into prescription_item
    values(p_item_id,p_prescription_id,p_medicine_id,p_dosage,p_frequency,p_duration);
end;
/

create or replace procedure update_prescription_item(
    p_item_id number,
    p_prescription_id number,
    p_medicine_id number,
    p_dosage varchar2,
    p_frequency varchar2,
    p_duration varchar2
)
is
begin
    update prescription_item
    set prescription_id=p_prescription_id,
        medicine_id=p_medicine_id,
        dosage=p_dosage,
        frequency=p_frequency,
        duration=p_duration
    where item_id=p_item_id;
end;
/

create or replace procedure delete_prescription_item(
    p_item_id number
)
is
begin
    delete from prescription_item
    where item_id=p_item_id;
end;
/



create or replace procedure add_bill(
    p_bill_id number,
    p_pharmacy_id number,
    p_amount number,
    p_patient_id number
)
is
begin
    insert into bill
    values(p_bill_id,p_pharmacy_id,p_amount,p_patient_id);
end;
/

create or replace procedure update_bill(
    p_bill_id number,
    p_pharmacy_id number,
    p_amount number,
    p_patient_id number
)
is
begin
    update bill
    set pharmacy_id=p_pharmacy_id,
        amount=p_amount,
        patient_id=p_patient_id
    where bill_id=p_bill_id;
end;
/

create or replace procedure delete_bill(
    p_bill_id number
)
is
begin
    delete from bill
    where bill_id=p_bill_id;
end;
/



create or replace procedure add_pharmacist(
    p_pharmacist_id number,
    p_pharmacy_id number,
    p_shift varchar2,
    p_name varchar2
)
is
begin
    insert into pharmacist
    values(p_pharmacist_id,p_pharmacy_id,p_shift,p_name);
end;
/

create or replace procedure update_pharmacist(
    p_pharmacist_id number,
    p_pharmacy_id number,
    p_shift varchar2,
    p_name varchar2
)
is
begin
    update pharmacist
    set pharmacy_id=p_pharmacy_id,
        shift=p_shift,
        name=p_name
    where pharmacist_id=p_pharmacist_id;
end;
/

create or replace procedure delete_pharmacist(
    p_pharmacist_id number
)
is
begin
    delete from pharmacist
    where pharmacist_id=p_pharmacist_id;
end;
/



create or replace procedure add_manufacturer(
    p_manufacturer_id number,
    p_brand_name varchar2,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2
)
is
begin
    insert into manufacturer
    values(p_manufacturer_id,p_brand_name,p_city,p_state,p_street);
end;
/

create or replace procedure update_manufacturer(
    p_manufacturer_id number,
    p_brand_name varchar2,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2
)
is
begin
    update manufacturer
    set brand_name=p_brand_name,
        city=p_city,
        state=p_state,
        street=p_street
    where manufacturer_id=p_manufacturer_id;
end;
/

create or replace procedure delete_manufacturer(
    p_manufacturer_id number
)
is
begin
    delete from manufacturer
    where manufacturer_id=p_manufacturer_id;
end;
/



create or replace procedure add_supplier(
    p_supplier_id number,
    p_contact varchar2,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_name varchar2
)
is
begin
    insert into supplier
    values(p_supplier_id,p_contact,p_city,p_state,p_street,p_name);
end;
/

create or replace procedure update_supplier(
    p_supplier_id number,
    p_contact varchar2,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2,
    p_name varchar2
)
is
begin
    update supplier
    set contact=p_contact,
        city=p_city,
        state=p_state,
        street=p_street,
        name=p_name
    where supplier_id=p_supplier_id;
end;
/

create or replace procedure delete_supplier(
    p_supplier_id number
)
is
begin
    delete from supplier
    where supplier_id=p_supplier_id;
end;
/



create or replace procedure add_supplier_manufacturer(
    p_supplier_id number,
    p_manufacturer_id number
)
is
begin
    insert into supplier_manufacturer
    values(p_supplier_id,p_manufacturer_id);
end;
/

create or replace procedure update_supplier_manufacturer(
    p_supplier_id number,
    p_old_manufacturer_id number,
    p_new_manufacturer_id number
)
is
begin
    update supplier_manufacturer
    set manufacturer_id=p_new_manufacturer_id
    where supplier_id=p_supplier_id
    and manufacturer_id=p_old_manufacturer_id;
end;
/

create or replace procedure delete_supplier_manufacturer(
    p_supplier_id number,
    p_manufacturer_id number
)
is
begin
    delete from supplier_manufacturer
    where supplier_id=p_supplier_id
    and manufacturer_id=p_manufacturer_id;
end;
/



create or replace procedure add_wholesale_supplier(
    p_gst_no varchar2,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2
)
is
begin
    insert into wholesale_supplier
    values(p_gst_no,p_city,p_state,p_street);
end;
/

create or replace procedure update_wholesale_supplier(
    p_gst_no varchar2,
    p_city varchar2,
    p_state varchar2,
    p_street varchar2
)
is
begin
    update wholesale_supplier
    set city=p_city,
        state=p_state,
        street=p_street
    where gst_no=p_gst_no;
end;
/

create or replace procedure delete_wholesale_supplier(
    p_gst_no varchar2
)
is
begin
    delete from wholesale_supplier
    where gst_no=p_gst_no;
end;
/



create or replace procedure add_supplier_wholesale(
    p_supplier_id number,
    p_gst_no varchar2
)
is
begin
    insert into supplier_wholesale
    values(p_supplier_id,p_gst_no);
end;
/

create or replace procedure update_supplier_wholesale(
    p_supplier_id number,
    p_old_gst_no varchar2,
    p_new_gst_no varchar2
)
is
begin
    update supplier_wholesale
    set gst_no=p_new_gst_no
    where supplier_id=p_supplier_id
    and gst_no=p_old_gst_no;
end;
/

create or replace procedure delete_supplier_wholesale(
    p_supplier_id number,
    p_gst_no varchar2
)
is
begin
    delete from supplier_wholesale
    where supplier_id=p_supplier_id
    and gst_no=p_gst_no;
end;
/



create or replace procedure add_supplier_pharmacy(
    p_supplier_id number,
    p_pharmacy_id number
)
is
begin
    insert into supplier_pharmacy
    values(p_supplier_id,p_pharmacy_id);
end;
/

create or replace procedure update_supplier_pharmacy(
    p_supplier_id number,
    p_old_pharmacy_id number,
    p_new_pharmacy_id number
)
is
begin
    update supplier_pharmacy
    set pharmacy_id=p_new_pharmacy_id
    where supplier_id=p_supplier_id
    and pharmacy_id=p_old_pharmacy_id;
end;
/

create or replace procedure delete_supplier_pharmacy(
    p_supplier_id number,
    p_pharmacy_id number
)
is
begin
    delete from supplier_pharmacy
    where supplier_id=p_supplier_id
    and pharmacy_id=p_pharmacy_id;
end;
/



create or replace procedure add_medicine_order(
    p_order_id number,
    p_supplier_id number,
    p_arrival_date date,
    p_payment_status varchar2,
    p_order_date date,
    p_order_status varchar2,
    p_pharmacy_id number,
    p_quantity_ordered number
)
is
begin
    insert into medicine_order
    values(p_order_id,p_supplier_id,p_arrival_date,p_payment_status,p_order_date,p_order_status,p_pharmacy_id,p_quantity_ordered);
end;
/

create or replace procedure update_medicine_order(
    p_order_id number,
    p_supplier_id number,
    p_arrival_date date,
    p_payment_status varchar2,
    p_order_date date,
    p_order_status varchar2,
    p_pharmacy_id number,
    p_quantity_ordered number
)
is
begin
    update medicine_order
    set supplier_id=p_supplier_id,
        arrival_date=p_arrival_date,
        payment_status=p_payment_status,
        order_date=p_order_date,
        order_status=p_order_status,
        pharmacy_id=p_pharmacy_id,
        quantity_ordered=p_quantity_ordered
    where order_id=p_order_id;
end;
/

create or replace procedure delete_medicine_order(
    p_order_id number
)
is
begin
    delete from medicine_order
    where order_id=p_order_id;
end;
/