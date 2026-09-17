create table pharmacy(
    pharmacy_id number primary key,
    name varchar2(100) not null,
    rating number(2,1) default 0.0,
    city varchar2(50) not null,
    state varchar2(50) not null,
    street varchar2(100) not null,
    contact_no varchar2(15) not null unique
);

create table patient(
    patient_id number primary key,
    dob date not null,
    sex char(1) not null,
    city varchar2(50) not null,
    state varchar2(50) not null,
    street varchar2(100) not null,
    first_name varchar2(30) not null,
    last_name varchar2(30) not null
);

create table patient_contact(
    patient_id number,
    contact_no varchar2(15),
    primary key(patient_id,contact_no),
    foreign key(patient_id) references patient(patient_id)
);

create table hospital(
    hospital_id number primary key,
    pharmacy_id number not null,
    city varchar2(50) not null,
    state varchar2(50) not null,
    street varchar2(100) not null,
    name varchar2(100) not null,
    contact varchar2(15) not null unique,
    foreign key(pharmacy_id) references pharmacy(pharmacy_id)
);

create table doctor(
    doctor_id number primary key,
    hospital_id number not null,
    experience number default 0 check(experience>=0),
    contact_no varchar2(15) not null unique,
    first_name varchar2(30) not null,
    last_name varchar2(30) not null,
    qualification varchar2(100) not null,
    foreign key(hospital_id) references hospital(hospital_id)
);

create table prescription(
    prescription_id number primary key,
    doctor_id number not null,
    patient_id number not null,
    prescription_date date default sysdate not null,
    foreign key(doctor_id) references doctor(doctor_id),
    foreign key(patient_id) references patient(patient_id)
);

create table medicine(
    medicine_id number primary key,
    manu_date date not null,
    exp_date date not null,
    name varchar2(100) not null,
    price number(10,2) not null check(price>0),
    available_quantity number default 0 not null check(available_quantity>=0),
    check(exp_date>manu_date)
);

create table prescription_item(
    item_id number primary key,
    prescription_id number not null,
    medicine_id number not null,
    dosage varchar2(50) not null,
    frequency varchar2(50) not null,
    duration varchar2(50) not null,
    foreign key(prescription_id) references prescription(prescription_id),
    foreign key(medicine_id) references medicine(medicine_id)
);

create table bill(
    bill_id number primary key,
    pharmacy_id number not null,
    amount number(10,2) not null check(amount>=0),
    patient_id number not null,
    foreign key(pharmacy_id) references pharmacy(pharmacy_id),
    foreign key(patient_id) references patient(patient_id)
);

create table pharmacist(
    pharmacist_id number primary key,
    pharmacy_id number not null,
    shift varchar2(20) not null check(shift in('morning','evening','night')),
    name varchar2(60) not null,
    foreign key(pharmacy_id) references pharmacy(pharmacy_id)
);

create table manufacturer(
    manufacturer_id number primary key,
    brand_name varchar2(100) not null unique,
    city varchar2(50) not null,
    state varchar2(50) not null,
    street varchar2(100) not null
);

create table supplier(
    supplier_id number primary key,
    contact varchar2(15) not null unique,
    city varchar2(50) not null,
    state varchar2(50) not null,
    street varchar2(100) not null,
    name varchar2(100) not null
);

create table supplier_manufacturer(
    supplier_id number,
    manufacturer_id number,
    primary key(supplier_id,manufacturer_id),
    foreign key(supplier_id) references supplier(supplier_id),
    foreign key(manufacturer_id) references manufacturer(manufacturer_id)
);

create table wholesale_supplier(
    gst_no varchar2(20) primary key,
    city varchar2(50) not null,
    state varchar2(50) not null,
    street varchar2(100) not null
);

create table supplier_wholesale(
    supplier_id number,
    gst_no varchar2(20),
    primary key(supplier_id,gst_no),
    foreign key(supplier_id) references supplier(supplier_id),
    foreign key(gst_no) references wholesale_supplier(gst_no)
);

create table supplier_pharmacy(
    supplier_id number,
    pharmacy_id number,
    primary key(supplier_id,pharmacy_id),
    foreign key(supplier_id) references supplier(supplier_id),
    foreign key(pharmacy_id) references pharmacy(pharmacy_id)
);

create table medicine_order(
    order_id number primary key,
    supplier_id number not null,
    arrival_date date,
    payment_status varchar2(20) default 'pending' not null check(payment_status in('pending','paid','partial','refunded')),
    order_date date default sysdate not null,
    order_status varchar2(20) default 'pending' not null check(order_status in('pending','processing','shipped','delivered','cancelled')),
    pharmacy_id number not null,
    quantity_ordered number not null check(quantity_ordered>0),
    foreign key(supplier_id) references supplier(supplier_id),
    foreign key(pharmacy_id) references pharmacy(pharmacy_id)
);