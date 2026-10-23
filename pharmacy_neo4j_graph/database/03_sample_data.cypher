// ============================================================================
// DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
// SCRIPT: 03_sample_data.cypher
// MODULE: Database Layer (Neo4j Property Graph Engine)
// CONTRIBUTOR: Database & Graph Data Modeling Lead (Member 1)
// DOCUMENTATION: See README.md
// PURPOSE: Realistic Graph Dataset (87 Nodes, 153 Relationships)
// ============================================================================

// ----------------------------------------------------------------------------
// STEP 1: CREATE PATIENT NODES (10 Patients)
// ----------------------------------------------------------------------------
MERGE (p1:Patient {patient_id: 401})
SET p1.name = 'Rahul Sharma', p1.dob = date('1990-05-15'), p1.sex = 'M', p1.city = 'Delhi', p1.state = 'Delhi', p1.street = 'MG Road', p1.contact = '+91 98765 43210'

MERGE (p2:Patient {patient_id: 402})
SET p2.name = 'Priya Singh', p2.dob = date('1985-08-22'), p2.sex = 'F', p2.city = 'Mumbai', p2.state = 'Maharashtra', p2.street = 'Link Road', p2.contact = '+91 98765 43211'

MERGE (p3:Patient {patient_id: 403})
SET p3.name = 'Amit Kumar', p3.dob = date('1978-12-10'), p3.sex = 'M', p3.city = 'Delhi', p3.state = 'Delhi', p3.street = 'Nehru Road', p3.contact = '+91 98765 43212'

MERGE (p4:Patient {patient_id: 404})
SET p4.name = 'Ananya Patel', p4.dob = date('1995-03-30'), p4.sex = 'F', p4.city = 'Pune', p4.state = 'Maharashtra', p4.street = 'FC Road', p4.contact = '+91 98765 43213'

MERGE (p5:Patient {patient_id: 405})
SET p5.name = 'Arjun Rao', p5.dob = date('1982-11-05'), p5.sex = 'M', p5.city = 'Jaipur', p5.state = 'Rajasthan', p5.street = 'MI Road', p5.contact = '+91 98765 43214'

MERGE (p6:Patient {patient_id: 406})
SET p6.name = 'Sneha Reddy', p6.dob = date('1992-07-18'), p6.sex = 'F', p6.city = 'Hyderabad', p6.state = 'Telangana', p6.street = 'Banjara Hills', p6.contact = '+91 98765 43215'

MERGE (p7:Patient {patient_id: 407})
SET p7.name = 'Vikram Malhotra', p7.dob = date('1970-01-25'), p7.sex = 'M', p7.city = 'Mumbai', p7.state = 'Maharashtra', p7.street = 'Marine Drive', p7.contact = '+91 98765 43216'

MERGE (p8:Patient {patient_id: 408})
SET p8.name = 'Pooja Joshi', p8.dob = date('1988-09-14'), p8.sex = 'F', p8.city = 'Pune', p8.state = 'Maharashtra', p8.street = 'JM Road', p8.contact = '+91 98765 43217'

MERGE (p9:Patient {patient_id: 409})
SET p9.name = 'Rajesh Verma', p9.dob = date('1965-04-03'), p9.sex = 'M', p9.city = 'Delhi', p9.state = 'Delhi', p9.street = 'Vikas Marg', p9.contact = '+91 98765 43218'

MERGE (p10:Patient {patient_id: 410})
SET p10.name = 'Neha Gupta', p10.dob = date('1998-12-28'), p10.sex = 'F', p10.city = 'Jaipur', p10.state = 'Rajasthan', p10.street = 'Tonk Road', p10.contact = '+91 98765 43219'


// ----------------------------------------------------------------------------
// STEP 2: CREATE PHARMACY NODES (3 Branches)
// ----------------------------------------------------------------------------
MERGE (ph1:Pharmacy {pharmacy_id: 101})
SET ph1.name = 'MedPlus Central Pharmacy', ph1.rating = 4.8, ph1.city = 'Delhi', ph1.state = 'Delhi', ph1.street = 'Connaught Place', ph1.contact = '+91 11 4123 4567'

MERGE (ph2:Pharmacy {pharmacy_id: 102})
SET ph2.name = 'Apollo HealthCity Pharmacy', ph2.rating = 4.9, ph2.city = 'Mumbai', ph2.state = 'Maharashtra', ph2.street = 'Bandra Kurla Complex', ph2.contact = '+91 22 6123 4567'

MERGE (ph3:Pharmacy {pharmacy_id: 103})
SET ph3.name = 'CareMed Express Pharmacy', ph3.rating = 4.7, ph3.city = 'Pune', ph3.state = 'Maharashtra', ph3.street = 'Shivaji Nagar', ph3.contact = '+91 20 2555 1234'


// ----------------------------------------------------------------------------
// STEP 3: CREATE HOSPITAL NODES & AFFILIATION RELATIONSHIPS (3 Hospitals)
// ----------------------------------------------------------------------------
MERGE (h1:Hospital {hospital_id: 201})
SET h1.name = 'City Multispeciality Hospital', h1.city = 'Delhi', h1.state = 'Delhi', h1.street = 'Ring Road', h1.contact = '+91 11 2345 6789'

MERGE (h2:Hospital {hospital_id: 202})
SET h2.name = 'Apollo Care Hospital', h2.city = 'Mumbai', h2.state = 'Maharashtra', h2.street = 'Andheri West', h2.contact = '+91 22 2678 9012'

MERGE (h3:Hospital {hospital_id: 203})
SET h3.name = 'Ruby Hall Medical Center', h3.city = 'Pune', h3.state = 'Maharashtra', h3.street = 'Sassoon Road', h3.contact = '+91 20 2567 8901'

// Hospital Affiliations
MERGE (h1)-[:AFFILIATED_WITH]->(ph1)
MERGE (h2)-[:AFFILIATED_WITH]->(ph2)
MERGE (h3)-[:AFFILIATED_WITH]->(ph3)


// ----------------------------------------------------------------------------
// STEP 4: CREATE DOCTOR NODES & EMPLOYMENT RELATIONSHIPS (8 Doctors)
// ----------------------------------------------------------------------------
MERGE (d1:Doctor {doctor_id: 301})
SET d1.name = 'Dr. Rajesh Kulkarni', d1.qualification = 'MBBS MD (Cardiology)', d1.experience = 15, d1.contact = '+91 98111 00001'
MERGE (d1)-[:WORKS_AT]->(h1)

MERGE (d2:Doctor {doctor_id: 302})
SET d2.name = 'Dr. Sunita Gupta', d2.qualification = 'MBBS MS (General Surgery)', d2.experience = 12, d2.contact = '+91 98111 00002'
MERGE (d2)-[:WORKS_AT]->(h1)

MERGE (d3:Doctor {doctor_id: 303})
SET d3.name = 'Dr. Arun Singh', d3.qualification = 'MBBS MD (General Medicine)', d3.experience = 18, d3.contact = '+91 98111 00003'
MERGE (d3)-[:WORKS_AT]->(h2)

MERGE (d4:Doctor {doctor_id: 304})
SET d4.name = 'Dr. Ritu Sharma', d4.qualification = 'MBBS DNB (Pediatrics)', d4.experience = 8, d4.contact = '+91 98111 00004'
MERGE (d4)-[:WORKS_AT]->(h2)

MERGE (d5:Doctor {doctor_id: 305})
SET d5.name = 'Dr. Sanjay Joshi', d5.qualification = 'MBBS MD (Pulmonology)', d5.experience = 14, d5.contact = '+91 98111 00005'
MERGE (d5)-[:WORKS_AT]->(h3)

MERGE (d6:Doctor {doctor_id: 306})
SET d6.name = 'Dr. Meera Nair', d6.qualification = 'MBBS MD (Dermatology)', d6.experience = 10, d6.contact = '+91 98111 00006'
MERGE (d6)-[:WORKS_AT]->(h3)

MERGE (d7:Doctor {doctor_id: 307})
SET d7.name = 'Dr. Anil Deshmukh', d7.qualification = 'MBBS MS (Orthopedics)', d7.experience = 16, d7.contact = '+91 98111 00007'
MERGE (d7)-[:WORKS_AT]->(h1)

MERGE (d8:Doctor {doctor_id: 308})
SET d8.name = 'Dr. Kavita Iyer', d8.qualification = 'MBBS MD (Endocrinology)', d8.experience = 9, d8.contact = '+91 98111 00008'
MERGE (d8)-[:WORKS_AT]->(h2)


// ----------------------------------------------------------------------------
// STEP 5: CREATE PHARMACIST NODES & SHIFT ALLOCATIONS (6 Pharmacists)
// ----------------------------------------------------------------------------
MERGE (pc1:Pharmacist {pharmacist_id: 601})
SET pc1.name = 'Suresh Mehta', pc1.shift = 'Morning'
MERGE (pc1)-[:EMPLOYED_AT {shift: 'Morning'}]->(ph1)

MERGE (pc2:Pharmacist {pharmacist_id: 602})
SET pc2.name = 'Ramesh Patil', pc2.shift = 'Evening'
MERGE (pc2)-[:EMPLOYED_AT {shift: 'Evening'}]->(ph1)

MERGE (pc3:Pharmacist {pharmacist_id: 603})
SET pc3.name = 'Anil Kumar', pc3.shift = 'Morning'
MERGE (pc3)-[:EMPLOYED_AT {shift: 'Morning'}]->(ph2)

MERGE (pc4:Pharmacist {pharmacist_id: 604})
SET pc4.name = 'Vikram Shinde', pc4.shift = 'Evening'
MERGE (pc4)-[:EMPLOYED_AT {shift: 'Evening'}]->(ph2)

MERGE (pc5:Pharmacist {pharmacist_id: 605})
SET pc5.name = 'Deepa Sharma', pc5.shift = 'Morning'
MERGE (pc5)-[:EMPLOYED_AT {shift: 'Morning'}]->(ph3)

MERGE (pc6:Pharmacist {pharmacist_id: 606})
SET pc6.name = 'Manoj Tiwari', pc6.shift = 'Night'
MERGE (pc6)-[:EMPLOYED_AT {shift: 'Night'}]->(ph3)


// ----------------------------------------------------------------------------
// STEP 6: CREATE MEDICINE NODES (12 Formulary Items)
// ----------------------------------------------------------------------------
MERGE (m1:Medicine {medicine_id: 501})
SET m1.name = 'Dolo 650 (Paracetamol)', m1.manu_date = date('2024-01-10'), m1.exp_date = date('2026-12-31'), m1.price = 32.50, m1.category = 'Analgesic / Antipyretic'

MERGE (m2:Medicine {medicine_id: 502})
SET m2.name = 'Pantocid 40 (Pantoprazole)', m2.manu_date = date('2024-02-15'), m2.exp_date = date('2026-11-30'), m2.price = 145.00, m2.category = 'Proton Pump Inhibitor'

MERGE (m3:Medicine {medicine_id: 503})
SET m3.name = 'Azithral 500 (Azithromycin)', m3.manu_date = date('2024-03-01'), m3.exp_date = date('2026-08-31'), m3.price = 125.00, m3.category = 'Macrolide Antibiotic'

MERGE (m4:Medicine {medicine_id: 504})
SET m4.name = 'Augmentin 625 Duo', m4.manu_date = date('2024-04-10'), m4.exp_date = date('2026-04-30'), m4.price = 210.00, m4.category = 'Broad-Spectrum Antibiotic'

MERGE (m5:Medicine {medicine_id: 505})
SET m5.name = 'Telma 40 (Telmisartan)', m5.manu_date = date('2024-01-20'), m5.exp_date = date('2027-01-31'), m5.price = 95.00, m5.category = 'Antihypertensive'

MERGE (m6:Medicine {medicine_id: 506})
SET m6.name = 'Glycomet GP 1', m6.manu_date = date('2024-02-01'), m6.exp_date = date('2026-07-31'), m6.price = 110.00, m6.category = 'Antidiabetic'

MERGE (m7:Medicine {medicine_id: 507})
SET m7.name = 'Montair LC', m7.manu_date = date('2024-05-15'), m7.exp_date = date('2026-05-31'), m7.price = 175.00, m7.category = 'Antiallergic / Antiasthmatic'

MERGE (m8:Medicine {medicine_id: 508})
SET m8.name = 'Atorva 20 (Atorvastatin)', m8.manu_date = date('2023-11-01'), m8.exp_date = date('2025-10-31'), m8.price = 185.00, m8.category = 'Lipid Lowering / Statin'

MERGE (m9:Medicine {medicine_id: 509})
SET m9.name = 'Pan-D Capsule', m9.manu_date = date('2024-06-01'), m9.exp_date = date('2026-12-31'), m9.price = 160.00, m9.category = 'Antacid & Prokinetic'

MERGE (m10:Medicine {medicine_id: 510})
SET m10.name = 'Shelcal 500', m10.manu_date = date('2024-03-15'), m10.exp_date = date('2027-03-31'), m10.price = 85.00, m10.category = 'Calcium Supplement'

MERGE (m11:Medicine {medicine_id: 511})
SET m11.name = 'Becosules Z Capsules', m11.manu_date = date('2024-04-01'), m11.exp_date = date('2026-09-30'), m11.price = 48.00, m11.category = 'Multivitamin'

MERGE (m12:Medicine {medicine_id: 512})
SET m12.name = 'Voveran SR 100', m12.manu_date = date('2024-02-20'), m12.exp_date = date('2026-02-28'), m12.price = 92.00, m12.category = 'NSAID / Anti-inflammatory'


// ----------------------------------------------------------------------------
// STEP 7: CREATE PHARMACY INVENTORY STOCK RELATIONSHIPS (:Pharmacy)-[:STOCKS]->(:Medicine)
// ----------------------------------------------------------------------------
MERGE (ph1)-[:STOCKS {quantity: 140, reorder_level: 25, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m1)
MERGE (ph1)-[:STOCKS {quantity: 42, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m2)
MERGE (ph1)-[:STOCKS {quantity: 85, reorder_level: 20, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m3)
MERGE (ph1)-[:STOCKS {quantity: 12, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m4); // Low Stock
MERGE (ph1)-[:STOCKS {quantity: 30, reorder_level: 10, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m5)
MERGE (ph1)-[:STOCKS {quantity: 65, reorder_level: 20, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m6)
MERGE (ph1)-[:STOCKS {quantity: 9, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m7);  // Low Stock
MERGE (ph1)-[:STOCKS {quantity: 0, reorder_level: 10, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m8);  // Out of Stock
MERGE (ph1)-[:STOCKS {quantity: 18, reorder_level: 5, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m9)
MERGE (ph1)-[:STOCKS {quantity: 50, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m10)
MERGE (ph1)-[:STOCKS {quantity: 28, reorder_level: 12, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m11)
MERGE (ph1)-[:STOCKS {quantity: 15, reorder_level: 10, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m12)

MERGE (ph2)-[:STOCKS {quantity: 185, reorder_level: 30, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m1)
MERGE (ph2)-[:STOCKS {quantity: 8, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m2);   // Low Stock
MERGE (ph2)-[:STOCKS {quantity: 90, reorder_level: 20, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m3)
MERGE (ph2)-[:STOCKS {quantity: 60, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m4)
MERGE (ph2)-[:STOCKS {quantity: 45, reorder_level: 10, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m5)
MERGE (ph2)-[:STOCKS {quantity: 70, reorder_level: 20, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m6)
MERGE (ph2)-[:STOCKS {quantity: 80, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m7)
MERGE (ph2)-[:STOCKS {quantity: 35, reorder_level: 12, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m8)
MERGE (ph2)-[:STOCKS {quantity: 4, reorder_level: 5, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m9);    // Low Stock
MERGE (ph2)-[:STOCKS {quantity: 48, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m10)

MERGE (ph3)-[:STOCKS {quantity: 210, reorder_level: 30, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m1)
MERGE (ph3)-[:STOCKS {quantity: 55, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m2)
MERGE (ph3)-[:STOCKS {quantity: 110, reorder_level: 25, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m3)
MERGE (ph3)-[:STOCKS {quantity: 45, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m4)
MERGE (ph3)-[:STOCKS {quantity: 5, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m5);   // Low Stock
MERGE (ph3)-[:STOCKS {quantity: 92, reorder_level: 20, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m6)
MERGE (ph3)-[:STOCKS {quantity: 65, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m7)
MERGE (ph3)-[:STOCKS {quantity: 40, reorder_level: 15, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m8)
MERGE (ph3)-[:STOCKS {quantity: 12, reorder_level: 5, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m9)
MERGE (ph3)-[:STOCKS {quantity: 75, reorder_level: 20, last_updated: datetime('2026-08-30T10:00:00Z')}]->(m10)


// ----------------------------------------------------------------------------
// STEP 8: CREATE MANUFACTURER NODES (5 Producers)
// ----------------------------------------------------------------------------
MERGE (mf1:Manufacturer {manufacturer_id: 701})
SET mf1.brand_name = 'Sun Pharmaceutical Industries Ltd', mf1.city = 'Mumbai', mf1.state = 'Maharashtra', mf1.street = 'Goregaon East'

MERGE (mf2:Manufacturer {manufacturer_id: 702})
SET mf2.brand_name = 'Cipla Ltd', mf2.city = 'Mumbai', mf2.state = 'Maharashtra', mf2.street = 'Mumbai Central'

MERGE (mf3:Manufacturer {manufacturer_id: 703})
SET mf3.brand_name = "Dr. Reddy's Laboratories Ltd", mf3.city = 'Hyderabad', mf3.state = 'Telangana', mf3.street = 'Banjara Hills'

MERGE (mf4:Manufacturer {manufacturer_id: 704})
SET mf4.brand_name = 'Lupin Pharmaceuticals Inc', mf4.city = 'Mumbai', mf4.state = 'Maharashtra', mf4.street = 'Kalina Santacruz'

MERGE (mf5:Manufacturer {manufacturer_id: 705})
SET mf5.brand_name = 'Zydus Lifesciences Ltd', mf5.city = 'Ahmedabad', mf5.state = 'Gujarat', mf5.street = 'Sarkhej-Gandhinagar Highway'


// ----------------------------------------------------------------------------
// STEP 9: CREATE SUPPLIER NODES (5 Distribution Agencies)
// ----------------------------------------------------------------------------
MERGE (s1:Supplier {supplier_id: 801})
SET s1.name = 'Apex Healthcare Distributors', s1.contact = '+91 11 2327 0001', s1.city = 'Delhi', s1.state = 'Delhi', s1.street = 'Ansari Road Daryaganj'

MERGE (s2:Supplier {supplier_id: 802})
SET s2.name = 'Metro Drug Agency', s2.contact = '+91 22 2208 0002', s2.city = 'Mumbai', s2.state = 'Maharashtra', s2.street = 'Princess Street Kalbadevi'

MERGE (s3:Supplier {supplier_id: 803})
SET s3.name = 'MedSource Logistics', s3.contact = '+91 20 2444 0003', s3.city = 'Pune', s3.state = 'Maharashtra', s3.street = 'Swargate Industrial Area'

MERGE (s4:Supplier {supplier_id: 804})
SET s4.name = 'Bharat Pharma Distributors', s4.contact = '+91 141 256 0004', s4.city = 'Jaipur', s4.state = 'Rajasthan', s4.street = 'Johari Bazar'

MERGE (s5:Supplier {supplier_id: 805})
SET s5.name = 'Lifeline Medical Supplies', s5.contact = '+91 40 2461 0005', s5.city = 'Hyderabad', s5.state = 'Telangana', s5.street = 'Koti Medical Complex'


// ----------------------------------------------------------------------------
// STEP 10: CREATE WHOLESALE SUPPLIER NODES (5 GST Entities)
// ----------------------------------------------------------------------------
MERGE (w1:WholesaleSupplier {gst_no: 'GST07AAACB1234C1Z1'})
SET w1.city = 'Delhi', w1.state = 'Delhi', w1.street = 'Chandni Chowk Wholesale Hub'

MERGE (w2:WholesaleSupplier {gst_no: 'GST27AAACC2345D1Z2'})
SET w2.city = 'Mumbai', w2.state = 'Maharashtra', w2.street = 'Kalbadevi Pharma Market'

MERGE (w3:WholesaleSupplier {gst_no: 'GST27AAACD3456E1Z3'})
SET w3.city = 'Pune', w3.state = 'Maharashtra', w3.street = 'Raviwar Peth Wholesale'

MERGE (w4:WholesaleSupplier {gst_no: 'GST08AAACE4567F1Z4'})
SET w4.city = 'Jaipur', w4.state = 'Rajasthan', w4.street = 'Kishanpole Bazar'

MERGE (w5:WholesaleSupplier {gst_no: 'GST36AAACF5678G1Z5'})
SET w5.city = 'Hyderabad', w5.state = 'Telangana', w5.street = 'Sultan Bazar Medical Market'


// ----------------------------------------------------------------------------
// STEP 11: SUPPLY CHAIN MULTI-HOP RELATIONSHIPS
// ----------------------------------------------------------------------------
// (:Supplier)-[:ASSOCIATED_WITH]->(:Manufacturer)
MERGE (s1)-[:ASSOCIATED_WITH]->(mf1)
MERGE (s1)-[:ASSOCIATED_WITH]->(mf2)
MERGE (s2)-[:ASSOCIATED_WITH]->(mf2)
MERGE (s2)-[:ASSOCIATED_WITH]->(mf4)
MERGE (s3)-[:ASSOCIATED_WITH]->(mf3)
MERGE (s3)-[:ASSOCIATED_WITH]->(mf5)
MERGE (s4)-[:ASSOCIATED_WITH]->(mf1)
MERGE (s4)-[:ASSOCIATED_WITH]->(mf5)
MERGE (s5)-[:ASSOCIATED_WITH]->(mf3)
MERGE (s5)-[:ASSOCIATED_WITH]->(mf4)

// (:Supplier)-[:PARTNERS_WITH]->(:WholesaleSupplier)
MERGE (s1)-[:PARTNERS_WITH]->(w1)
MERGE (s2)-[:PARTNERS_WITH]->(w2)
MERGE (s3)-[:PARTNERS_WITH]->(w3)
MERGE (s4)-[:PARTNERS_WITH]->(w4)
MERGE (s5)-[:PARTNERS_WITH]->(w5)

// (:Supplier)-[:SUPPLIES]->(:Medicine)
MERGE (s1)-[:SUPPLIES]->(m1)
MERGE (s1)-[:SUPPLIES]->(m2)
MERGE (s1)-[:SUPPLIES]->(m3)
MERGE (s1)-[:SUPPLIES]->(m7)
MERGE (s2)-[:SUPPLIES]->(m2)
MERGE (s2)-[:SUPPLIES]->(m4)
MERGE (s2)-[:SUPPLIES]->(m8)
MERGE (s2)-[:SUPPLIES]->(m9)
MERGE (s3)-[:SUPPLIES]->(m3)
MERGE (s3)-[:SUPPLIES]->(m5)
MERGE (s3)-[:SUPPLIES]->(m6)
MERGE (s3)-[:SUPPLIES]->(m10)
MERGE (s4)-[:SUPPLIES]->(m1)
MERGE (s4)-[:SUPPLIES]->(m10)
MERGE (s4)-[:SUPPLIES]->(m11)
MERGE (s4)-[:SUPPLIES]->(m12)
MERGE (s5)-[:SUPPLIES]->(m5)
MERGE (s5)-[:SUPPLIES]->(m6)
MERGE (s5)-[:SUPPLIES]->(m7)
MERGE (s5)-[:SUPPLIES]->(m8)


// ----------------------------------------------------------------------------
// STEP 12: CLINICAL PRESCRIPTIONS & ITEM REGIMENS (12 Prescriptions, 26 Regimens)
// ----------------------------------------------------------------------------

// Prescription 1001: Patient 401, Doctor 301
MERGE (rx1:Prescription {prescription_id: 1001})
SET rx1.date = date('2026-08-01'), rx1.diagnosis = 'Hypertensive Heart Disease Evaluation'
MERGE (p1)-[:HAS_PRESCRIPTION]->(rx1)
MERGE (d1)-[:WRITES]->(rx1)
MERGE (rx1)-[:CONTAINS {item_id: 1, dosage: '650mg', frequency: 'Twice Daily (BD)', duration: '5 Days'}]->(m1)
MERGE (rx1)-[:CONTAINS {item_id: 2, dosage: '40mg', frequency: 'Once Daily (OD)', duration: '14 Days'}]->(m5)
MERGE (rx1)-[:CONTAINS {item_id: 3, dosage: '20mg', frequency: 'At Bedtime (HS)', duration: '30 Days'}]->(m8)

// Prescription 1002: Patient 402, Doctor 303
MERGE (rx2:Prescription {prescription_id: 1002})
SET rx2.date = date('2026-08-02'), rx2.diagnosis = 'Acute Acid Peptic Disease'
MERGE (p2)-[:HAS_PRESCRIPTION]->(rx2)
MERGE (d3)-[:WRITES]->(rx2)
MERGE (rx2)-[:CONTAINS {item_id: 4, dosage: '40mg', frequency: 'Before Breakfast', duration: '14 Days'}]->(m2)
MERGE (rx2)-[:CONTAINS {item_id: 5, dosage: '1 Capsule', frequency: 'Daily Morning', duration: '10 Days'}]->(m9)

// Prescription 1003: Patient 403, Doctor 305
MERGE (rx3:Prescription {prescription_id: 1003})
SET rx3.date = date('2026-08-05'), rx3.diagnosis = 'Upper Respiratory Tract Infection'
MERGE (p3)-[:HAS_PRESCRIPTION]->(rx3)
MERGE (d5)-[:WRITES]->(rx3)
MERGE (rx3)-[:CONTAINS {item_id: 6, dosage: '500mg', frequency: 'Once Daily (OD)', duration: '5 Days'}]->(m3)
MERGE (rx3)-[:CONTAINS {item_id: 7, dosage: '650mg', frequency: 'SOS / Fever', duration: '3 Days'}]->(m1)
MERGE (rx3)-[:CONTAINS {item_id: 8, dosage: '10mg', frequency: 'At Bedtime (HS)', duration: '10 Days'}]->(m7)

// Prescription 1004: Patient 404, Doctor 304
MERGE (rx4:Prescription {prescription_id: 1004})
SET rx4.date = date('2026-08-10'), rx4.diagnosis = 'Bacterial Bronchitis'
MERGE (p4)-[:HAS_PRESCRIPTION]->(rx4)
MERGE (d4)-[:WRITES]->(rx4)
MERGE (rx4)-[:CONTAINS {item_id: 9, dosage: '625mg', frequency: 'Twice Daily (BD)', duration: '7 Days'}]->(m4)
MERGE (rx4)-[:CONTAINS {item_id: 10, dosage: '1 Capsule', frequency: 'Once Daily (OD)', duration: '15 Days'}]->(m11)

// Prescription 1005: Patient 405, Doctor 308
MERGE (rx5:Prescription {prescription_id: 1005})
SET rx5.date = date('2026-08-12'), rx5.diagnosis = 'Type 2 Diabetes Mellitus'
MERGE (p5)-[:HAS_PRESCRIPTION]->(rx5)
MERGE (d8)-[:WRITES]->(rx5)
MERGE (rx5)-[:CONTAINS {item_id: 11, dosage: '1 Tablet', frequency: 'With Breakfast', duration: '30 Days'}]->(m6)
MERGE (rx5)-[:CONTAINS {item_id: 12, dosage: '500mg', frequency: 'Post Lunch', duration: '30 Days'}]->(m10)

// Prescription 1006: Patient 406, Doctor 306
MERGE (rx6:Prescription {prescription_id: 1006})
SET rx6.date = date('2026-08-15'), rx6.diagnosis = 'Allergic Rhinitis'
MERGE (p6)-[:HAS_PRESCRIPTION]->(rx6)
MERGE (d6)-[:WRITES]->(rx6)
MERGE (rx6)-[:CONTAINS {item_id: 13, dosage: '10mg', frequency: 'At Bedtime (HS)', duration: '14 Days'}]->(m7)
MERGE (rx6)-[:CONTAINS {item_id: 14, dosage: '1 Capsule', frequency: 'Once Daily (OD)', duration: '30 Days'}]->(m11)

// Prescription 1007: Patient 407, Doctor 307
MERGE (rx7:Prescription {prescription_id: 1007})
SET rx7.date = date('2026-08-18'), rx7.diagnosis = 'Osteoarthritis Knee Pain'
MERGE (p7)-[:HAS_PRESCRIPTION]->(rx7)
MERGE (d7)-[:WRITES]->(rx7)
MERGE (rx7)-[:CONTAINS {item_id: 15, dosage: '100mg', frequency: 'Twice Daily (BD)', duration: '10 Days'}]->(m12)
MERGE (rx7)-[:CONTAINS {item_id: 16, dosage: '40mg', frequency: 'Before Meals', duration: '10 Days'}]->(m2)
MERGE (rx7)-[:CONTAINS {item_id: 17, dosage: '500mg', frequency: 'Once Daily (OD)', duration: '60 Days'}]->(m10)

// Prescription 1008: Patient 408, Doctor 301
MERGE (rx8:Prescription {prescription_id: 1008})
SET rx8.date = date('2026-08-20'), rx8.diagnosis = 'Hypertension & Dyslipidemia'
MERGE (p8)-[:HAS_PRESCRIPTION]->(rx8)
MERGE (d1)-[:WRITES]->(rx8)
MERGE (rx8)-[:CONTAINS {item_id: 18, dosage: '40mg', frequency: 'Morning', duration: '30 Days'}]->(m5)
MERGE (rx8)-[:CONTAINS {item_id: 19, dosage: '20mg', frequency: 'At Bedtime (HS)', duration: '30 Days'}]->(m8)

// Prescription 1009: Patient 409, Doctor 303
MERGE (rx9:Prescription {prescription_id: 1009})
SET rx9.date = date('2026-08-22'), rx9.diagnosis = 'Community Acquired Pneumonia'
MERGE (p9)-[:HAS_PRESCRIPTION]->(rx9)
MERGE (d3)-[:WRITES]->(rx9)
MERGE (rx9)-[:CONTAINS {item_id: 20, dosage: '625mg', frequency: 'Thrice Daily (TDS)', duration: '7 Days'}]->(m4)
MERGE (rx9)-[:CONTAINS {item_id: 21, dosage: '650mg', frequency: 'When Needed', duration: '5 Days'}]->(m1)

// Prescription 1010: Patient 410, Doctor 302
MERGE (rx10:Prescription {prescription_id: 1010})
SET rx10.date = date('2026-08-25'), rx10.diagnosis = 'Post-Operative Wound Care'
MERGE (p10)-[:HAS_PRESCRIPTION]->(rx10)
MERGE (d2)-[:WRITES]->(rx10)
MERGE (rx10)-[:CONTAINS {item_id: 22, dosage: '500mg', frequency: 'Once Daily (OD)', duration: '5 Days'}]->(m3)
MERGE (rx10)-[:CONTAINS {item_id: 23, dosage: '100mg', frequency: 'Twice Daily (BD)', duration: '5 Days'}]->(m12)

// Prescription 1011: Patient 401 (Chronic Follow-Up), Doctor 301
MERGE (rx11:Prescription {prescription_id: 1011})
SET rx11.date = date('2026-08-28'), rx11.diagnosis = 'Chronic Refill Routine'
MERGE (p1)-[:HAS_PRESCRIPTION]->(rx11)
MERGE (d1)-[:WRITES]->(rx11)
MERGE (rx11)-[:CONTAINS {item_id: 24, dosage: '40mg', frequency: 'Morning (OD)', duration: '30 Days'}]->(m5)

// Prescription 1012: Patient 403 (Second Visit), Doctor 305
MERGE (rx12:Prescription {prescription_id: 1012})
SET rx12.date = date('2026-08-30'), rx12.diagnosis = 'Bronchial Asthma Maintenance'
MERGE (p3)-[:HAS_PRESCRIPTION]->(rx12)
MERGE (d5)-[:WRITES]->(rx12)
MERGE (rx12)-[:CONTAINS {item_id: 25, dosage: '10mg', frequency: 'Night (HS)', duration: '30 Days'}]->(m7)
MERGE (rx12)-[:CONTAINS {item_id: 26, dosage: '1 Capsule', frequency: 'Morning (OD)', duration: '30 Days'}]->(m11);
