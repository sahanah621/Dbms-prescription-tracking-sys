// ============================================================================
// DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
// SCRIPT: 04_queries.cypher
// MODULE: Database Layer (Neo4j Property Graph Engine)
// CONTRIBUTOR: Database & Graph Data Modeling Lead (Member 1)
// DOCUMENTATION: See README.md
// PURPOSE: 22 Comprehensive Academic Cypher Queries Demonstrating Graph Traversal,
//          Multi-Hop Pattern Matching, Degree-Based Connectivity, and Path Finding
// ============================================================================

// ----------------------------------------------------------------------------
// QUERY 1: Basic Node Retrieval with Property Filtering
// Concept: MATCH, WHERE, RETURN
// Purpose: Retrieve all active medicines priced above INR 100
// ----------------------------------------------------------------------------
MATCH (m:Medicine)
WHERE m.price >= 100.0
RETURN m.medicine_id AS MedicineID, m.name AS FormulationName, m.price AS UnitPrice, m.category AS TherapeuticCategory
ORDER BY m.price DESC;


// ----------------------------------------------------------------------------
// QUERY 2: Basic 1-Hop Relationship Traversal (Doctor -> Prescription)
// Concept: Directed Relationship Traversal
// Purpose: List all clinical prescriptions issued by Dr. Rajesh Kulkarni
// ----------------------------------------------------------------------------
MATCH (d:Doctor {name: 'Dr. Rajesh Kulkarni'})-[:WRITES]->(rx:Prescription)
RETURN d.name AS DoctorName, rx.prescription_id AS PrescriptionID, rx.date AS IssueDate, rx.diagnosis AS ClinicalDiagnosis
ORDER BY rx.date DESC;


// ----------------------------------------------------------------------------
// QUERY 3: 1-Hop Traversal (Patient -> Prescription)
// Concept: Path Pattern Matching
// Purpose: Find all prescriptions issued to patient Rahul Sharma
// ----------------------------------------------------------------------------
MATCH (p:Patient {name: 'Rahul Sharma'})-[:HAS_PRESCRIPTION]->(rx:Prescription)
RETURN p.patient_id AS PatientID, p.name AS PatientName, rx.prescription_id AS PrescriptionID, rx.date AS ConsultDate, rx.diagnosis AS Diagnosis;


// ----------------------------------------------------------------------------
// QUERY 4: Traversal with Relationship Properties (Prescription -> Medicine)
// Concept: Extracting Edge Properties (Dosage, Frequency, Duration)
// Purpose: Itemize medication regimen for Prescription #1001
// ----------------------------------------------------------------------------
MATCH (rx:Prescription {prescription_id: 1001})-[c:CONTAINS]->(m:Medicine)
RETURN rx.prescription_id AS PrescriptionID, m.name AS MedicineName, c.dosage AS Dosage, c.frequency AS Frequency, c.duration AS Duration, m.price AS UnitPrice;


// ----------------------------------------------------------------------------
// QUERY 5: Local Branch Stock Traversal (Pharmacy -> Medicine)
// Concept: Traversal with Numerical Threshold Comparison
// Purpose: Identify critical low-stock medications at MedPlus Central Pharmacy (ID 101)
// ----------------------------------------------------------------------------
MATCH (ph:Pharmacy {pharmacy_id: 101})-[s:STOCKS]->(m:Medicine)
WHERE s.quantity <= s.reorder_level
RETURN ph.name AS PharmacyBranch, m.name AS MedicineName, s.quantity AS CurrentUnits, s.reorder_level AS ThresholdUnits, (s.reorder_level - s.quantity) AS DeficitUnits
ORDER BY DeficitUnits DESC;


// ----------------------------------------------------------------------------
// QUERY 6: Supplier Distribution Portfolio (Supplier -> Medicine)
// Concept: Outgoing Relationship Traversal
// Purpose: View all therapeutic drugs supplied by Apex Healthcare Distributors
// ----------------------------------------------------------------------------
MATCH (s:Supplier {name: 'Apex Healthcare Distributors'})-[:SUPPLIES]->(m:Medicine)
RETURN s.name AS SupplierAgency, m.medicine_id AS MedicineID, m.name AS MedicineName, m.price AS UnitPrice
ORDER BY m.name ASC;


// ----------------------------------------------------------------------------
// QUERY 7: 2-Hop Supply Chain Traversal (Manufacturer -> Supplier -> Medicine)
// Concept: Variable / Multi-Step Pattern Traversal
// Purpose: Trace supply channels originating from Sun Pharma through distributors to end medicines
// ----------------------------------------------------------------------------
MATCH (mf:Manufacturer)-[:ASSOCIATED_WITH]-(s:Supplier)-[:SUPPLIES]->(m:Medicine)
WHERE mf.brand_name CONTAINS 'Sun Pharmaceutical'
RETURN mf.brand_name AS Producer, s.name AS LogisticsDistributor, m.name AS SuppliedTherapeutic
ORDER BY m.name ASC;


// ----------------------------------------------------------------------------
// QUERY 8: 2-Hop Clinical Path (Doctor -> Prescription -> Patient)
// Concept: Bidirectional Traversals via Central Node
// Purpose: List all patients treated by Dr. Arun Singh
// ----------------------------------------------------------------------------
MATCH (d:Doctor {name: 'Dr. Arun Singh'})-[:WRITES]->(rx:Prescription)<-[:HAS_PRESCRIPTION]-(p:Patient)
RETURN d.name AS Doctor, rx.prescription_id AS PrescriptionID, p.name AS PatientName, p.city AS PatientCity, rx.date AS TreatmentDate;


// ----------------------------------------------------------------------------
// QUERY 9: Multi-Hop Clinical Traversal (Patient -> Prescription -> Medicine)
// Concept: 2-Hop Forward Traversal
// Purpose: Find all medicines prescribed to patient Priya Singh across all consultations
// ----------------------------------------------------------------------------
MATCH (p:Patient {name: 'Priya Singh'})-[:HAS_PRESCRIPTION]->(rx:Prescription)-[c:CONTAINS]->(m:Medicine)
RETURN p.name AS Patient, rx.prescription_id AS PrescriptionID, m.name AS PrescribedMedicine, c.dosage AS RegimenDosage, c.frequency AS Frequency;


// ----------------------------------------------------------------------------
// QUERY 10: 4-Hop Multi-Tier Traversal (Patient -> Prescription -> Medicine -> Supplier)
// Concept: Multi-Hop Traversals Crossing Domain Boundaries
// Purpose: Trace where a patient's prescribed medicine originates in the supply chain
// ----------------------------------------------------------------------------
MATCH (p:Patient {name: 'Rahul Sharma'})-[:HAS_PRESCRIPTION]->(rx:Prescription)-[:CONTAINS]->(m:Medicine)<-[:SUPPLIES]-(s:Supplier)
RETURN p.name AS Patient, m.name AS Medicine, s.name AS AuthorizedSupplier, s.city AS SupplierCity;


// ----------------------------------------------------------------------------
// QUERY 11: 5-Hop Full Lifecyle Trace (Patient -> Medicine -> Supplier -> Manufacturer)
// Concept: End-to-End Enterprise Graph Traversal
// Purpose: Complete provenance tracking from patient ingestion to factory producer
// ----------------------------------------------------------------------------
MATCH (p:Patient)-[:HAS_PRESCRIPTION]->(:Prescription)-[:CONTAINS]->(m:Medicine)<-[:SUPPLIES]-(s:Supplier)-[:ASSOCIATED_WITH]->(mf:Manufacturer)
WHERE p.name = 'Rahul Sharma'
RETURN DISTINCT p.name AS Patient, m.name AS Medicine, s.name AS Distributor, mf.brand_name AS ManufacturingPlant;


// ----------------------------------------------------------------------------
// QUERY 12: Degree-Based Connectivity Analysis (Most Prescribed Medicines)
// Concept: In-Degree Pattern Count Aggregation
// Purpose: Rank medicines by prescribing frequency across clinical prescriptions
// ----------------------------------------------------------------------------
MATCH (m:Medicine)<-[:CONTAINS]-(rx:Prescription)
RETURN m.medicine_id AS MedicineID, m.name AS MedicineName, m.price AS UnitPrice, count(rx) AS PrescriptionDegree
ORDER BY PrescriptionDegree DESC, m.name ASC
LIMIT 5;


// ----------------------------------------------------------------------------
// QUERY 13: Degree-Based Connectivity Analysis (Chronic Care Patients)
// Concept: Out-Degree Aggregation Filtering
// Purpose: Identify patients with multiple prescription relationships
// ----------------------------------------------------------------------------
MATCH (p:Patient)-[:HAS_PRESCRIPTION]->(rx:Prescription)
WITH p, count(rx) AS TotalConsultations
WHERE TotalConsultations >= 2
RETURN p.patient_id AS PatientID, p.name AS PatientName, p.city AS City, TotalConsultations
ORDER BY TotalConsultations DESC;


// ----------------------------------------------------------------------------
// QUERY 14: Multi-Sourced Therapeutics (Medicines Supplied by Multiple Suppliers)
// Concept: Graph Pattern Branching / In-Degree from Specific Label
// Purpose: Find medicines with diversified supplier redundancy for supply chain resiliency
// ----------------------------------------------------------------------------
MATCH (s:Supplier)-[:SUPPLIES]->(m:Medicine)
WITH m, count(s) AS SupplierCount, collect(s.name) AS SupplierList
WHERE SupplierCount > 1
RETURN m.name AS MedicineName, SupplierCount, SupplierList
ORDER BY SupplierCount DESC;


// ----------------------------------------------------------------------------
// QUERY 15: Network-Wide Formularies (Medicines Stocked at Multiple Pharmacies)
// Concept: Cross-Dispensary Availability Traversal
// Purpose: Identify medicines available across all 3 regional branches
// ----------------------------------------------------------------------------
MATCH (ph:Pharmacy)-[:STOCKS]->(m:Medicine)
WITH m, count(ph) AS StockingBranches, collect(ph.name) AS BranchList
RETURN m.name AS MedicineName, StockingBranches, BranchList
ORDER BY StockingBranches DESC, m.name ASC;


// ----------------------------------------------------------------------------
// QUERY 16: Active Medical Practitioners (Doctors Connected to Multiple Prescriptions)
// Concept: Aggregation of Out-Degree from Doctor Nodes
// Purpose: Evaluate doctor consultation volume across hospital facilities
// ----------------------------------------------------------------------------
MATCH (d:Doctor)-[:WRITES]->(rx:Prescription)
OPTIONAL MATCH (d)-[:WORKS_AT]->(h:Hospital)
RETURN d.name AS DoctorName, d.qualification AS Degrees, h.name AS HospitalCenter, count(rx) AS PrescriptionsIssued
ORDER BY PrescriptionsIssued DESC;


// ----------------------------------------------------------------------------
// QUERY 17: Shortest Path Analysis (Patient to Pharmaceutical Manufacturer)
// Concept: Built-in shortestPath Algorithm
// Purpose: Find the most direct relational path connecting Rahul Sharma to Sun Pharma
// ----------------------------------------------------------------------------
MATCH (p:Patient {name: 'Rahul Sharma'}), (mf:Manufacturer)
WHERE mf.brand_name CONTAINS 'Sun Pharmaceutical'
MATCH path = shortestPath((p)-[*]-(mf))
RETURN [node in nodes(path) | coalesce(node.name, node.brand_name, 'Rx#' + toString(node.prescription_id))] AS TraversalHops,
       length(path) AS TotalDegreesOfSeparation;


// ----------------------------------------------------------------------------
// QUERY 18: All Shortest Paths (Alternative Supply Routes)
// Concept: allShortestPaths Algorithm
// Purpose: Discover all alternative paths between a patient and an emergency distributor
// ----------------------------------------------------------------------------
MATCH (p:Patient {name: 'Amit Kumar'}), (s:Supplier {name: 'Apex Healthcare Distributors'})
MATCH paths = allShortestPaths((p)-[*]-(s))
RETURN length(paths) AS PathLength, count(paths) AS AlternativePathCount;


// ----------------------------------------------------------------------------
// QUERY 19: Co-Prescribed Medication Pattern (Recommendation Graph)
// Concept: Self-Join / Diamond Graph Pattern
// Purpose: Discover which medicines are frequently prescribed together in the same prescription
// ----------------------------------------------------------------------------
MATCH (m1:Medicine)<-[:CONTAINS]-(rx:Prescription)-[:CONTAINS]->(m2:Medicine)
WHERE id(m1) < id(m2)
RETURN m1.name AS MedicineA, m2.name AS MedicineB, count(rx) AS CoPrescriptionFrequency
ORDER BY CoPrescriptionFrequency DESC
LIMIT 5;


// ----------------------------------------------------------------------------
// QUERY 20: Hospital-Doctor-Prescription-Pharmacy Clinical Network
// Concept: Cyclic / Diamond Multi-Entity Network Traversal
// Purpose: Trace clinical cases from hospital affiliation through prescription fulfillment
// ----------------------------------------------------------------------------
MATCH (h:Hospital)<-[:WORKS_AT]-(d:Doctor)-[:WRITES]->(rx:Prescription)-[:CONTAINS]->(m:Medicine)<-[:STOCKS]-(ph:Pharmacy)<-[:AFFILIATED_WITH]-(h)
RETURN h.name AS Hospital, d.name AS Specialist, rx.prescription_id AS PrescriptionID, m.name AS PrescribedDrug, ph.name AS DispensingPharmacy
LIMIT 5;


// ----------------------------------------------------------------------------
// QUERY 21: Full Supply Chain Pipeline for a Specific Medication (Dolo 650)
// Concept: Multi-Node Path Aggregation
// Purpose: Animate the complete supply trajectory of Dolo 650 from Manufacturer to Patient
// ----------------------------------------------------------------------------
MATCH (mf:Manufacturer)<-[:ASSOCIATED_WITH]-(s:Supplier)-[:SUPPLIES]->(m:Medicine {name: 'Dolo 650 (Paracetamol)'})<-[:CONTAINS]-(rx:Prescription)<-[:HAS_PRESCRIPTION]-(p:Patient)
RETURN mf.brand_name AS Producer, s.name AS Distributor, m.name AS Medicine, rx.prescription_id AS PrescriptionID, p.name AS Patient
LIMIT 5;


// ----------------------------------------------------------------------------
// QUERY 22: Graph Global Statistics & Topology Counts
// Concept: Label and Type Cardinality Aggregation
// Purpose: Compute summary metrics of graph population
// ----------------------------------------------------------------------------
MATCH (n)
WITH labels(n)[0] AS EntityType, count(n) AS EntityCount
RETURN EntityType, EntityCount
ORDER BY EntityCount DESC;


// ============================================================================
// SECTION 6: GRAPH MUTATIONS & PROPERTY UPDATES (SET / UPDATE CYPHERS)
// ============================================================================

// ----------------------------------------------------------------------------
// QUERY 23: Update Medicine Retail Price (Graph Property Mutation)
// Concept: Node Property Mutation via SET
// Purpose: Update dynamic market pricing for a pharmaceutical drug and return updated state
// ----------------------------------------------------------------------------
MATCH (m:Medicine {name: 'Dolo 650 (Paracetamol 650mg)'})
SET m.price = 35.00
RETURN m.medicine_id AS MedicineID, m.name AS MedicineName, m.price AS UpdatedPrice_INR;


// ----------------------------------------------------------------------------
// QUERY 24: Restock Pharmacy Inventory Units (Relationship Property Mutation)
// Concept: Relationship Attribute Mutation via SET
// Purpose: Increase inventory stock units for a specific medicine at a pharmacy dispensary
// ----------------------------------------------------------------------------
MATCH (ph:Pharmacy {name: 'Apollo HealthCity Pharmacy'})-[s:STOCKS]->(m:Medicine {name: 'Augmentin 625 Duo (Amoxicillin & Clavulanate)'})
SET s.quantity = s.quantity + 50
RETURN ph.name AS Pharmacy, m.name AS Medicine, s.quantity AS NewStockUnits, s.reorder AS ReorderThreshold;


// ----------------------------------------------------------------------------
// QUERY 25: Update Doctor Seniority & Contact Information
// Concept: Multi-Attribute Entity Node Mutation
// Purpose: Update medical specialist phone contact and increment years of experience
// ----------------------------------------------------------------------------
MATCH (d:Doctor {name: 'Dr. Rajesh Kulkarni'})
SET d.contact = '+91 98201 44552', d.experience = 15
RETURN d.doctor_id AS DoctorID, d.name AS DoctorName, d.contact AS UpdatedContact, d.experience AS YearsExperience;

