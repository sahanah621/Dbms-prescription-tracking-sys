// ============================================================================
// DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
// SCRIPT: 01_constraints.cypher
// MODULE: Database Layer (Neo4j Property Graph Engine)
// CONTRIBUTOR: Database & Graph Data Modeling Lead (Member 1)
// DOCUMENTATION: See README.md
// PURPOSE: Node Key Uniqueness Constraints & Property Indexes
// NEO4J VERSION: 5.x / 4.4+ Compatible
// ============================================================================

// ----------------------------------------------------------------------------
// PART 1: UNIQUENESS CONSTRAINTS (Ensures Referential Entity Integrity)
// ----------------------------------------------------------------------------

// 1. Patient Entity Key Constraint
CREATE CONSTRAINT patient_id_unique IF NOT EXISTS
FOR (p:Patient)
REQUIRE p.patient_id IS UNIQUE;

// 2. Doctor Entity Key Constraint
CREATE CONSTRAINT doctor_id_unique IF NOT EXISTS
FOR (d:Doctor)
REQUIRE d.doctor_id IS UNIQUE;

// 3. Hospital Entity Key Constraint
CREATE CONSTRAINT hospital_id_unique IF NOT EXISTS
FOR (h:Hospital)
REQUIRE h.hospital_id IS UNIQUE;

// 4. Pharmacy Branch Key Constraint
CREATE CONSTRAINT pharmacy_id_unique IF NOT EXISTS
FOR (ph:Pharmacy)
REQUIRE ph.pharmacy_id IS UNIQUE;

// 5. Pharmacist Staff Key Constraint
CREATE CONSTRAINT pharmacist_id_unique IF NOT EXISTS
FOR (pc:Pharmacist)
REQUIRE pc.pharmacist_id IS UNIQUE;

// 6. Medicine Formulary Key Constraint
CREATE CONSTRAINT medicine_id_unique IF NOT EXISTS
FOR (m:Medicine)
REQUIRE m.medicine_id IS UNIQUE;

// 7. Clinical Prescription Header Key Constraint
CREATE CONSTRAINT prescription_id_unique IF NOT EXISTS
FOR (rx:Prescription)
REQUIRE rx.prescription_id IS UNIQUE;

// 8. Pharmaceutical Manufacturer Key Constraint
CREATE CONSTRAINT manufacturer_id_unique IF NOT EXISTS
FOR (mf:Manufacturer)
REQUIRE mf.manufacturer_id IS UNIQUE;

// 9. Supply Logistics Distributor Key Constraint
CREATE CONSTRAINT supplier_id_unique IF NOT EXISTS
FOR (s:Supplier)
REQUIRE s.supplier_id IS UNIQUE;

// 10. Wholesale Depot (GST Identification) Key Constraint
CREATE CONSTRAINT wholesale_gst_unique IF NOT EXISTS
FOR (w:WholesaleSupplier)
REQUIRE w.gst_no IS UNIQUE;


// ----------------------------------------------------------------------------
// PART 2: PROPERTY INDEXES (Accelerates Label Filtering & Text Lookups)
// ----------------------------------------------------------------------------

// Fast lookup for patients by name
CREATE INDEX patient_name_idx IF NOT EXISTS
FOR (p:Patient)
ON (p.name);

// Fast lookup for medicines by brand / formulation name
CREATE INDEX medicine_name_idx IF NOT EXISTS
FOR (m:Medicine)
ON (m.name);

// Fast lookup for medical practitioners by doctor name
CREATE INDEX doctor_name_idx IF NOT EXISTS
FOR (d:Doctor)
ON (d.name);

// Fast lookup for pharmacy branches by name and city
CREATE INDEX pharmacy_name_idx IF NOT EXISTS
FOR (ph:Pharmacy)
ON (ph.name);

CREATE INDEX pharmacy_city_idx IF NOT EXISTS
FOR (ph:Pharmacy)
ON (ph.city);

// Fast lookup for supply distributors by agency name
CREATE INDEX supplier_name_idx IF NOT EXISTS
FOR (s:Supplier)
ON (s.name);

// Fast lookup for prescriptions by clinical date
CREATE INDEX prescription_date_idx IF NOT EXISTS
FOR (rx:Prescription)
ON (rx.date);

// Fast lookup for hospital facilities by institution name
CREATE INDEX hospital_name_idx IF NOT EXISTS
FOR (h:Hospital)
ON (h.name);
