set define off;

create or replace function find_medicine_price(
    p_medicine_id number
)
return number
is
    v_price number;
begin
    select price
    into v_price
    from medicine
    where medicine_id=p_medicine_id;

    return v_price;
end;
/

create or replace function get_medicine_stock(
    p_medicine_id number
)
return number
is
    v_quantity number;
begin
    select available_quantity
    into v_quantity
    from medicine
    where medicine_id=p_medicine_id;

    return v_quantity;
end;
/

create or replace function get_doctor_experience(
    p_doctor_id number
)
return number
is
    v_experience number;
begin
    select experience
    into v_experience
    from doctor
    where doctor_id=p_doctor_id;

    return v_experience;
end;
/

create or replace function get_patient_bill_total(
    p_patient_id number
)
return number
is
    v_total number;
begin
    select nvl(sum(amount),0)
    into v_total
    from bill
    where patient_id=p_patient_id;

    return v_total;
end;
/