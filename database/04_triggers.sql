set define off;

create or replace trigger trg_patient_dob_validate
before insert or update on patient
for each row
begin
    if :new.dob > sysdate then
        raise_application_error(-20001,'date of birth cannot be in the future');
    end if;
end;
/

create or replace trigger trg_prescription_date_validate
before insert or update on prescription
for each row
begin
    if :new.prescription_date > sysdate then
        raise_application_error(-20002,'prescription date cannot be in the future');
    end if;
end;
/

create or replace trigger trg_medicine_order_validate
before insert or update on medicine_order
for each row
begin
    if :new.arrival_date is not null and :new.arrival_date < :new.order_date then
        raise_application_error(-20003,'arrival date cannot be before order date');
    end if;
end;
/

create or replace trigger trg_medicine_order_delivered
before insert or update on medicine_order
for each row
begin
    if lower(:new.order_status)='delivered' and :new.arrival_date is null then
        raise_application_error(-20004,'arrival date is required for delivered orders');
    end if;
end;
/