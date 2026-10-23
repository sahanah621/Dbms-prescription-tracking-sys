// ============================================================================
// DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
// SCRIPT: 02_schema.cypher
// MODULE: Database Layer (Neo4j Property Graph Engine)
// CONTRIBUTOR: Database & Graph Data Modeling Lead (Member 1)
// DOCUMENTATION: See README.md
// PURPOSE: Formal Property Graph Schema & Relationship Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// GRAPH ARCHITECTURAL TOPOLOGY
// ----------------------------------------------------------------------------
// The Property Graph Model represents the interconnected entities of the
// Pharmacy System as Nodes and directed, typed Relationships with properties.
//
// Nodes (10 Entity Types):
//   (:Patient)            - Registered patients receiving healthcare services
//   (:Doctor)             - Licensed clinical practitioners prescribing medications
//   (:Hospital)           - Partner healthcare institutions employing doctors
//   (:Pharmacy)           - Dispensing network branches holding local stock
//   (:Pharmacist)         - Licensed staff assigned to pharmacy shifts
//   (:Medicine)           - Therapeutic formulary catalog items
//   (:Prescription)       - Consultation orders linking patient and doctor
//   (:Manufacturer)       - Pharmaceutical production corporations
//   (:Supplier)           - Regional logistics & distribution agencies
//   (:WholesaleSupplier)  - GST-registered wholesale depots
//
// Relationships (12 Relationship Types):
//   (:Patient)-[:HAS_PRESCRIPTION]->(:Prescription)
//   (:Doctor)-[:WRITES]->(:Prescription)
//   (:Doctor)-[:WORKS_AT]->(:Hospital)
//   (:Hospital)-[:AFFILIATED_WITH]->(:Pharmacy)
//   (:Prescription)-[:CONTAINS {dosage, frequency, duration}]->(:Medicine)
//   (:Pharmacy)-[:STOCKS {quantity, reorder_level, last_updated}]->(:Medicine)
//   (:Pharmacist)-[:EMPLOYED_AT {shift}]->(:Pharmacy)
//   (:Supplier)-[:SUPPLIES]->(:Medicine)
//   (:Supplier)-[:ASSOCIATED_WITH]->(:Manufacturer)
//   (:Supplier)-[:PARTNERS_WITH]->(:WholesaleSupplier)
//   (:Pharmacy)-[:PLACES_ORDER {order_id, date, arrival_date, quantity, status, payment}]->(:Supplier)
//   (:Pharmacy)-[:ISSUES_BILL {bill_id, amount, date}]->(:Patient)
// ----------------------------------------------------------------------------

// Schema Validation Query: Verify that all required node labels and relationship types exist
MATCH (n)
RETURN DISTINCT labels(n) AS NodeLabels, count(n) AS NodeCount;

MATCH ()-[r]->()
RETURN DISTINCT type(r) AS RelationshipTypes, count(r) AS RelationshipCount;
