set define off;



insert into pharmacy(pharmacy_id,name,rating,city,state,street,contact_no) values
(101,'Apollo HealthCity Pharmacy',4.8,'Mumbai','Maharashtra','Ground Floor, Bandra Reclamation, Hill Road','+912226405555');

insert into pharmacy(pharmacy_id,name,rating,city,state,street,contact_no) values
(102,'MedPlus Community Care',4.6,'Bengaluru','Karnataka','82 100-Ft Road, 4th Block, Koramangala','+918041207788');

insert into pharmacy(pharmacy_id,name,rating,city,state,street,contact_no) values
(103,'Fortis MedStore Express',4.9,'New Delhi','Delhi','Gate No 2, Sector B, Vasant Kunj Marg','+911142776200');



insert into hospital(hospital_id,pharmacy_id,city,state,street,name,contact) values
(201,101,'Mumbai','Maharashtra','A-791 Bandra West, Near Lilavati Road','Lilavati Hospital & Research Centre','+912226751000');

insert into hospital(hospital_id,pharmacy_id,city,state,street,name,contact) values
(202,102,'Bengaluru','Karnataka','98 HAL Old Airport Road, Kodihalli','Manipal Hospital Bengaluru','+918025024444');

insert into hospital(hospital_id,pharmacy_id,city,state,street,name,contact) values
(203,103,'New Delhi','Delhi','Sri Aurobindo Marg, Ansari Nagar East','AIIMS Apex Trauma & Medical Center','+911126588500');



insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(301,201,14,'+919820144552','Rajesh','Kulkarni','MBBS, MD (General Medicine)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(302,201,18,'+919820511984','Sunita','Deshmukh','MBBS, MS (General Surgery)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(303,202,11,'+919741088231','Anand','Narayanaswamy','MBBS, MD, DM (Cardiology)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(304,202,8,'+919845177210','Pooja','Rao','MBBS, DCH, MD (Pediatrics)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(305,202,15,'+919611233490','Venkatesh','Bhat','MBBS, MS (Orthopedics)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(306,203,20,'+919811055671','Arvind','Aggarwal','MBBS, MD, DM (Neurology)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(307,203,9,'+919818844321','Meenakshi','Sundaram','MBBS, MD (Pulmonology)');

insert into doctor(doctor_id,hospital_id,experience,contact_no,first_name,last_name,qualification) values
(308,203,12,'+919910299012','Kabir','Malhotra','MBBS, MD (Endocrinology)');



insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(401,to_date('1982-04-14','yyyy-mm-dd'),'M','Mumbai','Maharashtra','Flat 402, Sea View Apts, Worli Seaface','Rahul','Sharma');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(402,to_date('1990-09-22','yyyy-mm-dd'),'F','Mumbai','Maharashtra','12 Gokul Dham, Andheri East','Priya','Patel');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(403,to_date('1975-11-05','yyyy-mm-dd'),'M','Bengaluru','Karnataka','204 Silver Oak Enclave, Indiranagar','Suresh','Menon');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(404,to_date('1988-03-19','yyyy-mm-dd'),'F','Bengaluru','Karnataka','45 Green Glen Layout, Bellandur','Deepika','Iyer');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(405,to_date('1964-07-30','yyyy-mm-dd'),'M','Bengaluru','Karnataka','108 Brigade Gateway, Malleshwaram','Ramesh','Gowda');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(406,to_date('1995-12-11','yyyy-mm-dd'),'F','New Delhi','Delhi','C-14 Hauz Khas Enclave, South Delhi','Ananya','Verma');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(407,to_date('1970-01-25','yyyy-mm-dd'),'M','New Delhi','Delhi','B-4/88 Safdarjung Enclave','Vikram','Singh');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(408,to_date('1985-08-16','yyyy-mm-dd'),'F','New Delhi','Delhi','Plot 12 Sector 14, Rohini','Sneha','Gupta');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(409,to_date('1958-05-02','yyyy-mm-dd'),'M','Mumbai','Maharashtra','71 Parsi Colony, Dadar East','Homi','Wadia');

insert into patient(patient_id,dob,sex,city,state,street,first_name,last_name) values
(410,to_date('2001-10-28','yyyy-mm-dd'),'F','Bengaluru','Karnataka','5th Cross, HSR Layout Sector 2','Kavya','Reddy');



insert into patient_contact(patient_id,contact_no) values
(401,'+919820012345');

insert into patient_contact(patient_id,contact_no) values
(401,'+912224930011');

insert into patient_contact(patient_id,contact_no) values
(402,'+919821123456');

insert into patient_contact(patient_id,contact_no) values
(403,'+919845034567');

insert into patient_contact(patient_id,contact_no) values
(403,'+919845099887');

insert into patient_contact(patient_id,contact_no) values
(404,'+919900045678');

insert into patient_contact(patient_id,contact_no) values
(405,'+919844056789');

insert into patient_contact(patient_id,contact_no) values
(406,'+919810067890');

insert into patient_contact(patient_id,contact_no) values
(407,'+919811178901');

insert into patient_contact(patient_id,contact_no) values
(408,'+919818089012');

insert into patient_contact(patient_id,contact_no) values
(409,'+919820290123');

insert into patient_contact(patient_id,contact_no) values
(410,'+919980001234');



insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(501,to_date('2024-01-15','yyyy-mm-dd'),to_date('2026-12-31','yyyy-mm-dd'),'Dolo 650 (Paracetamol 650mg)',32.50,100);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(502,to_date('2023-11-10','yyyy-mm-dd'),to_date('2025-10-31','yyyy-mm-dd'),'Augmentin 625 Duo (Amoxicillin & Clavulanate)',205.00,80);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(503,to_date('2024-02-01','yyyy-mm-dd'),to_date('2027-01-31','yyyy-mm-dd'),'Glycomet GP 1 (Metformin 500mg + Glimepiride 1mg)',118.50,120);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(504,to_date('2023-08-20','yyyy-mm-dd'),to_date('2026-07-31','yyyy-mm-dd'),'Atorva 20 (Atorvastatin 20mg)',185.00,75);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(505,to_date('2024-03-05','yyyy-mm-dd'),to_date('2026-02-28','yyyy-mm-dd'),'Azithral 500 (Azithromycin 500mg)',124.00,60);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(506,to_date('2024-04-10','yyyy-mm-dd'),to_date('2027-03-31','yyyy-mm-dd'),'Pantocid 40 (Pantoprazole 40mg)',142.00,90);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(507,to_date('2023-09-15','yyyy-mm-dd'),to_date('2025-08-31','yyyy-mm-dd'),'Cetzine 10 (Cetirizine 10mg)',48.00,110);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(508,to_date('2024-01-10','yyyy-mm-dd'),to_date('2026-06-30','yyyy-mm-dd'),'Ascoril D Plus Cough Syrup 100ml',115.00,50);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(509,to_date('2023-12-01','yyyy-mm-dd'),to_date('2025-11-30','yyyy-mm-dd'),'Lantus Solostar Insulin Pen (100 IU/ml)',890.00,30);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(510,to_date('2024-02-25','yyyy-mm-dd'),to_date('2027-01-15','yyyy-mm-dd'),'Telma 40 (Telmisartan 40mg)',155.00,85);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(511,to_date('2023-05-10','yyyy-mm-dd'),to_date('2025-04-30','yyyy-mm-dd'),'Montair LC (Montelukast + Levocetirizine)',178.00,55);

insert into medicine(medicine_id,manu_date,exp_date,name,price,available_quantity) values
(512,to_date('2022-01-10','yyyy-mm-dd'),to_date('2024-06-30','yyyy-mm-dd'),'Combiflam Tablet (Ibuprofen + Paracetamol)',45.00,0);




insert into pharmacist(pharmacist_id,pharmacy_id,shift,name) values
(601,101,'morning','Manoj Kumar Tiwari');

insert into pharmacist(pharmacist_id,pharmacy_id,shift,name) values
(602,101,'evening','Shilpa Nair');

insert into pharmacist(pharmacist_id,pharmacy_id,shift,name) values
(603,102,'morning','Girish Channappa');

insert into pharmacist(pharmacist_id,pharmacy_id,shift,name) values
(604,102,'night','Karthik Somayaji');

insert into pharmacist(pharmacist_id,pharmacy_id,shift,name) values
(605,103,'morning','Harish Chander Sharma');

insert into pharmacist(pharmacist_id,pharmacy_id,shift,name) values
(606,103,'evening','Pratibha Chauhan');




insert into manufacturer(manufacturer_id,brand_name,city,state,street) values
(701,'Sun Pharmaceutical Industries Ltd','Mumbai','Maharashtra','Sun House, CTS No. 201 B/1, Western Express Hwy, Goregaon East');

insert into manufacturer(manufacturer_id,brand_name,city,state,street) values
(702,'Cipla Limited','Mumbai','Maharashtra','Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel');

insert into manufacturer(manufacturer_id,brand_name,city,state,street) values
(703,'Dr. Reddy Laboratories','Hyderabad','Telangana','8-2-337 Road No 3, Banjara Hills');

insert into manufacturer(manufacturer_id,brand_name,city,state,street) values
(704,'Lupin Pharmaceuticals','Mumbai','Maharashtra','Kalpataru Inspire, 3rd Floor, Off Western Express Hwy, Santacruz East');

insert into manufacturer(manufacturer_id,brand_name,city,state,street) values
(705,'Torrent Pharmaceuticals Ltd','Ahmedabad','Gujarat','Torrent House, Off Ashram Road, Navrangpura');




insert into supplier(supplier_id,contact,city,state,street,name) values
(801,'+912228504433','Mumbai','Maharashtra','Gala 14, New Sonal Industrial Estate, Sakinaka, Andheri','Apex Pharma Distributors LLP');

insert into supplier(supplier_id,contact,city,state,street,name) values
(802,'+918022269911','Bengaluru','Karnataka','42 OTC Road, Chickpet Commercial Complex','Karnataka Medico Supplies');

insert into supplier(supplier_id,contact,city,state,street,name) values
(803,'+911123861120','New Delhi','Delhi','Shop 108 Bhagirath Palace, Chandni Chowk','Capital Healthcare Logistics');

insert into supplier(supplier_id,contact,city,state,street,name) values
(804,'+914024657788','Hyderabad','Telangana','15-4-282 Gowliguda Chaman, Koti','Deccan Drug Distributors');

insert into supplier(supplier_id,contact,city,state,street,name) values
(805,'+917926583344','Ahmedabad','Gujarat','B-12 Relief Commercial Hub, Relief Road','Western Gujarat Pharma Trade');




insert into supplier_manufacturer(supplier_id,manufacturer_id) values (801,701);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (801,702);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (801,704);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (802,701);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (802,703);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (802,705);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (803,702);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (803,703);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (804,703);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (804,704);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (805,701);
insert into supplier_manufacturer(supplier_id,manufacturer_id) values (805,705);




insert into wholesale_supplier(gst_no,city,state,street) values
('27AAACH1234F1Z5','Mumbai','Maharashtra','Building C, APMC Market Yard, Vashi, Navi Mumbai');

insert into wholesale_supplier(gst_no,city,state,street) values
('29AABCK5678P1ZQ','Bengaluru','Karnataka','Warehouse 18, Peenya Industrial Area 3rd Phase');

insert into wholesale_supplier(gst_no,city,state,street) values
('07AABCW9012M1Z8','New Delhi','Delhi','Godown 4, Okhla Industrial Area Phase II');

insert into wholesale_supplier(gst_no,city,state,street) values
('36AABCS3456L1Z2','Hyderabad','Telangana','Shed 9, Autonagar Industrial Corridor, LB Nagar');

insert into wholesale_supplier(gst_no,city,state,street) values
('24AABCT7890N1Z9','Ahmedabad','Gujarat','Plot 55, Vatva GIDC Phase IV');




insert into supplier_wholesale(supplier_id,gst_no) values (801,'27AAACH1234F1Z5');
insert into supplier_wholesale(supplier_id,gst_no) values (802,'29AABCK5678P1ZQ');
insert into supplier_wholesale(supplier_id,gst_no) values (803,'07AABCW9012M1Z8');
insert into supplier_wholesale(supplier_id,gst_no) values (804,'36AABCS3456L1Z2');
insert into supplier_wholesale(supplier_id,gst_no) values (805,'24AABCT7890N1Z9');
insert into supplier_wholesale(supplier_id,gst_no) values (801,'29AABCK5678P1ZQ');




insert into supplier_pharmacy(supplier_id,pharmacy_id) values (801,101);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (801,102);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (802,102);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (803,103);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (804,101);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (804,102);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (805,101);
insert into supplier_pharmacy(supplier_id,pharmacy_id) values (805,103);




insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(901,801,101,to_date('2026-08-01','yyyy-mm-dd'),to_date('2026-08-04','yyyy-mm-dd'),'paid','delivered',250);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(902,801,101,to_date('2026-08-10','yyyy-mm-dd'),to_date('2026-08-14','yyyy-mm-dd'),'paid','delivered',180);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(903,802,102,to_date('2026-08-12','yyyy-mm-dd'),to_date('2026-08-16','yyyy-mm-dd'),'paid','delivered',300);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(904,803,103,to_date('2026-08-15','yyyy-mm-dd'),to_date('2026-08-19','yyyy-mm-dd'),'paid','delivered',150);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(905,804,101,to_date('2026-08-20','yyyy-mm-dd'),to_date('2026-08-24','yyyy-mm-dd'),'partial','delivered',120);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(906,802,102,to_date('2026-08-25','yyyy-mm-dd'),to_date('2026-08-29','yyyy-mm-dd'),'paid','delivered',220);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(907,803,103,to_date('2026-08-28','yyyy-mm-dd'),to_date('2026-09-02','yyyy-mm-dd'),'paid','delivered',190);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(908,801,101,to_date('2026-08-30','yyyy-mm-dd'),to_date('2026-09-05','yyyy-mm-dd'),'pending','processing',140);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(909,805,103,to_date('2026-09-01','yyyy-mm-dd'),to_date('2026-09-06','yyyy-mm-dd'),'pending','shipped',200);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(910,802,102,to_date('2026-09-02','yyyy-mm-dd'),null,'pending','pending',100);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(911,804,102,to_date('2026-08-05','yyyy-mm-dd'),null,'refunded','cancelled',80);

insert into medicine_order(order_id,supplier_id,pharmacy_id,order_date,arrival_date,payment_status,order_status,quantity_ordered) values
(912,805,101,to_date('2026-09-03','yyyy-mm-dd'),to_date('2026-09-08','yyyy-mm-dd'),'pending','processing',160);



insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1001,301,401,to_date('2026-08-10','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1002,301,402,to_date('2026-08-12','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1003,303,403,to_date('2026-08-14','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1004,304,404,to_date('2026-08-18','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1005,305,405,to_date('2026-08-20','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1006,306,406,to_date('2026-08-22','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1007,307,407,to_date('2026-08-25','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1008,308,408,to_date('2026-08-28','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1009,301,409,to_date('2026-08-30','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1010,303,410,to_date('2026-09-01','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1011,302,401,to_date('2026-09-02','yyyy-mm-dd'));

insert into prescription(prescription_id,doctor_id,patient_id,prescription_date) values
(1012,306,407,to_date('2026-09-03','yyyy-mm-dd'));



insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(1,1001,501,'650mg','Thrice Daily (TDS)','5 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(2,1001,506,'40mg','Once Daily Before Breakfast (OD)','10 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(3,1002,502,'625mg','Twice Daily After Food (BD)','7 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(4,1002,507,'10mg','Once Daily at Bedtime (HS)','5 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(5,1003,503,'500mg','Twice Daily with Meals (BD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(6,1003,504,'20mg','Once Daily at Night (OD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(7,1003,510,'40mg','Once Daily Morning (OD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(8,1004,501,'250mg','SOS As Needed','3 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(9,1004,508,'5ml','Thrice Daily (TDS)','5 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(10,1005,501,'650mg','Twice Daily (BD)','5 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(11,1005,506,'40mg','Once Daily (OD)','7 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(12,1006,507,'10mg','Once Daily (OD)','10 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(13,1006,511,'10mg','Once Daily at Night (HS)','14 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(14,1007,505,'500mg','Once Daily for 3 Days (OD)','3 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(15,1007,508,'10ml','Thrice Daily (TDS)','7 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(16,1008,503,'500mg','Twice Daily (BD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(17,1008,509,'18 IU','Once Daily Subcutaneous (OD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(18,1009,504,'20mg','Once Daily (OD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(19,1009,510,'40mg','Once Daily Morning (OD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(20,1010,502,'625mg','Twice Daily (BD)','5 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(21,1010,506,'40mg','Once Daily (OD)','7 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(22,1011,501,'650mg','Twice Daily (BD)','3 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(23,1011,506,'40mg','Once Daily (OD)','5 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(24,1012,504,'20mg','Once Daily (OD)','30 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(25,1012,507,'10mg','Once Daily (OD)','7 Days');

insert into prescription_item(item_id,prescription_id,medicine_id,dosage,frequency,duration) values
(26,1002,501,'650mg','SOS (As Needed)','3 Days');



insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1101,101,401,174.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1102,101,402,285.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1103,102,403,458.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1104,102,404,147.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1105,102,405,174.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1106,103,406,226.00);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1107,103,407,239.00);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1108,103,408,1008.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1109,101,409,340.00);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1110,102,410,347.00);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1111,101,401,174.50);

insert into bill(bill_id,pharmacy_id,patient_id,amount) values
(1112,103,407,233.00);

commit;

