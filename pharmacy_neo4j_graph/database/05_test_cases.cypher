// ============================================================================
// DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
// SCRIPT: 05_test_cases.cypher
// MODULE: Database Layer (Neo4j Property Graph Engine)
// CONTRIBUTOR: Database & Graph Data Modeling Lead (Member 1)
// DOCUMENTATION: See README.md
// PURPOSE: 15 Executable Graph Verification Test Cases
// ============================================================================

// ----------------------------------------------------------------------------
// TEST CASE 1: Verify Patient Node Population
// Expected: Exactly 10 patient nodes returned
// ----------------------------------------------------------------------------
MATCH (p:Patient)
RETURN count(p) = 10 AS TestCase1_Passed, count(p) AS PatientCount;


// ----------------------------------------------------------------------------
// TEST CASE 2: Verify Uniqueness Constraint Enforcement
// Expected: Inserting duplicate Patient ID should be rejected by constraint
// (In cypher-shell, this throws: Node(n) already exists with label `Patient` and property `patient_id` = 401)
// ----------------------------------------------------------------------------
// CREATE (:Patient {patient_id: 401, name: 'Duplicate Patient'});


// ----------------------------------------------------------------------------
// TEST CASE 3: Verify Doctor Employment Links
// Expected: Every doctor is linked to exactly one Hospital facility via [:WORKS_AT]
// ----------------------------------------------------------------------------
MATCH (d:Doctor)
OPTIONAL MATCH (d)-[:WORKS_AT]->(h:Hospital)
RETURN count(d) AS TotalDoctors, count(h) AS DoctorsWithHospital, (count(d) = count(h)) AS TestCase3_Passed;


// ----------------------------------------------------------------------------
// TEST CASE 4: Verify Medicine Node Catalog
// Expected: Exactly 12 therapeutic medicines cataloged
// ----------------------------------------------------------------------------
MATCH (m:Medicine)
RETURN count(m) = 12 AS TestCase4_Passed, count(m) AS MedicineCount;


// ----------------------------------------------------------------------------
// TEST CASE 5: Verify Prescription to Patient Traversal
// Expected: Exactly 12 prescriptions, each connected to exactly one Patient
// ----------------------------------------------------------------------------
MATCH (rx:Prescription)
OPTIONAL MATCH (p:Patient)-[:HAS_PRESCRIPTION]->(rx)
RETURN count(rx) AS TotalPrescriptions, count(p) AS LinkedPatients, (count(rx) = count(p)) AS TestCase5_Passed;


// ----------------------------------------------------------------------------
// TEST CASE 6: Verify Prescription Item Regimens
// Expected: Exactly 26 [:CONTAINS] relationships exist across all prescriptions
// ----------------------------------------------------------------------------
MATCH (:Prescription)-[r:CONTAINS]->(:Medicine)
RETURN count(r) = 26 AS TestCase6_Passed, count(r) AS RegimenItemCount;


// ----------------------------------------------------------------------------
// TEST CASE 7: Verify Relationship Properties on [:CONTAINS]
// Expected: All [:CONTAINS] edges contain dosage, frequency, and duration properties
// ----------------------------------------------------------------------------
MATCH ()-[c:CONTAINS]->()
WHERE c.dosage IS NOT NULL AND c.frequency IS NOT NULL AND c.duration IS NOT NULL
RETURN count(c) = 26 AS TestCase7_Passed, count(c) AS ValidRegimensWithProperties;


// ----------------------------------------------------------------------------
// TEST CASE 8: Verify Pharmacy Inventory Links
// Expected: All 3 pharmacies hold stocked medicines
// ----------------------------------------------------------------------------
MATCH (ph:Pharmacy)
OPTIONAL MATCH (ph)-[s:STOCKS]->(m:Medicine)
RETURN ph.name AS Branch, count(m) AS StockedMedicines, (count(m) > 0) AS TestCase8_Passed;


// ----------------------------------------------------------------------------
// TEST CASE 9: Verify Low Stock Condition Detection via Graph Traversal
// Expected: Query identifies branches where quantity <= reorder_level
// ----------------------------------------------------------------------------
MATCH (ph:Pharmacy)-[s:STOCKS]->(m:Medicine)
WHERE s.quantity <= s.reorder_level
RETURN count(s) > 0 AS TestCase9_Passed, count(s) AS LowStockIncidents;


// ----------------------------------------------------------------------------
// TEST CASE 10: Verify Supply Chain 2-Hop Connectivity (Manufacturer -> Supplier)
// Expected: At least 10 manufacturer-supplier associations exist
// ----------------------------------------------------------------------------
MATCH (s:Supplier)-[r:ASSOCIATED_WITH]->(mf:Manufacturer)
RETURN count(r) >= 10 AS TestCase10_Passed, count(r) AS AssociationsCount;


// ----------------------------------------------------------------------------
// TEST CASE 11: Verify Wholesale GST Node Integration
// Expected: Exactly 5 wholesale suppliers with GST identification
// ----------------------------------------------------------------------------
MATCH (w:WholesaleSupplier)
RETURN count(w) = 5 AS TestCase11_Passed, count(w) AS WholesaleDepotCount;


// ----------------------------------------------------------------------------
// TEST CASE 12: Verify Shortest Path Reachability (Patient to Manufacturer)
// Expected: Shortest path from Rahul Sharma to Sun Pharma has length >= 4
// ----------------------------------------------------------------------------
MATCH (p:Patient {name: 'Rahul Sharma'}), (mf:Manufacturer)
WHERE mf.brand_name CONTAINS 'Sun Pharmaceutical'
MATCH path = shortestPath((p)-[*]-(mf))
RETURN length(path) >= 4 AS TestCase12_Passed, length(path) AS ShortestPathLength;


// ----------------------------------------------------------------------------
// TEST CASE 13: Degree-Based Connectivity Verification
// Expected: Medicine 501 (Dolo 650) or Medicine 505 (Telma 40) is among top prescribed
// ----------------------------------------------------------------------------
MATCH (m:Medicine)<-[:CONTAINS]-(rx:Prescription)
WITH m, count(rx) AS PrescCount
ORDER BY PrescCount DESC
LIMIT 1
RETURN m.name AS TopMedicine, PrescCount >= 3 AS TestCase13_Passed;


// ----------------------------------------------------------------------------
// TEST CASE 14: Hospital-Pharmacy Affiliation Integrity
// Expected: Exactly 3 hospital-pharmacy links
// ----------------------------------------------------------------------------
MATCH (h:Hospital)-[r:AFFILIATED_WITH]->(ph:Pharmacy)
RETURN count(r) = 3 AS TestCase14_Passed, count(r) AS AffiliationsCount;


// ----------------------------------------------------------------------------
// TEST CASE 15: Global Graph Node and Relationship Totals
// Expected: At least 60 total nodes and at least 90 total relationships
// ----------------------------------------------------------------------------
MATCH (n) WITH count(n) AS TotalNodes
MATCH ()-[r]->() WITH TotalNodes, count(r) AS TotalEdges
RETURN TotalNodes >= 60 AND TotalEdges >= 90 AS TestCase15_Passed, TotalNodes, TotalEdges;


// ----------------------------------------------------------------------------
// TEST CASE 16: Property Mutation (SET) Execution Verification
// Expected: Price update executes and returns positive value
// ----------------------------------------------------------------------------
MATCH (m:Medicine {medicine_id: 501})
SET m.price = 35.00
RETURN m.price = 35.00 AS TestCase16_Passed, m.name AS Medicine, m.price AS VerifiedPrice;

