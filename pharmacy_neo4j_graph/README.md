# PHARMA: Neo4j Graph Intelligence & Clinical Provenance System
> **DBMS DA3 Academic Project Submission: Advanced Graph Database Implementation**

---

## 👥 Project Team & Contributors

| Member Name | Role / Focus Area | GitHub Handle | Folder Contributed |
| :--- | :--- | :--- | :--- |
| **Harshit Sharma** *(Lead)* | Backend Architecture, Flask APIs & Bolt Driver | [@harshitsharma-6854](https://github.com/harshitsharma-6854) | 📁 [`backend/`](backend/) |
| **Teammate 1** | Database Layer, Graph Schema & 22 Cypher Queries | *(Add Username)* | 📁 [`database/`](database/) |
| **Teammate 2** | Frontend UI/UX, Glassmorphism & Vis.js Canvas | *(Add Username)* | 📁 [`frontend/`](frontend/) |

---

## 📌 Executive Summary

**PHARMA Graph Intelligence** is a production-grade property graph database extension engineered with **Neo4j 5.x**, **Cypher Query Language**, **Python/Flask**, and **Vis.js**.

Traditional relational DBMS systems face performance degradation when evaluating multi-hop recursive queries (e.g., $N$-tier drug supply chain provenance or prescription fraud detection rings), requiring 8+ computationally heavy `JOIN` operations. This project models healthcare provenance natively as an **Index-Free Adjacency Property Graph**, achieving sub-millisecond multi-hop graph traversals.

---

## 🏛️ System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 1. FRONTEND PRESENTATION LAYER (Browser Canvas & Controllers)          │
 │    • Templates: graph_intelligence.html, cypher_playground.html, etc.  │
 │    • Interactive Canvas: Vis.js Network with ForceAtlas2 Physics       │
 │    • UI: Dark Glassmorphism, Directional D-Pad, Zoom, Edge Badges      │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST APIs (JSON)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 2. BACKEND APPLICATION LAYER (Python / Flask Microframework)           │
 │    • Entry Point: app.py                                               │
 │    • Service Logic: services/neo4j_service.py                         │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ Bolt Binary Protocol (bolt://:7687)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 3. CONNECTIVITY & SESSION LAYER (Official Neo4j Python Driver)         │
 │    • GraphDatabase.driver() with connection pooling                    │
 │    • Resilient Zero-Crash Demo Fallback Engine                         │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ Declarative Cypher Queries
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 4. DATABASE ENGINE (Neo4j Community / AuraDB 5.x)                      │
 │    • 87 Entity Nodes & 153 Directed Typed Relationships                │
 │    • Node Key Uniqueness Constraints & B-Tree Property Indexes         │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```
pharmacy_neo4j_graph/
├── backend/                    # Python / Flask Application & Bolt Driver Layer
│   ├── app.py                  # Standalone Flask server (Routes & REST APIs)
│   ├── config.py               # Bolt protocol configuration & credentials
│   ├── requirements.txt        # Python dependencies (flask, neo4j, python-dotenv)
│   └── services/
│       ├── __init__.py
│       └── neo4j_service.py    # Bolt Driver, session pooling, zero-crash fallback
├── database/                   # Neo4j Property Graph Engine (Cypher Scripts)
│   ├── 01_constraints.cypher   # Primary key uniqueness constraints & indexes
│   ├── 02_schema.cypher        # Node labels & relationship definitions
│   ├── 03_sample_data.cypher   # Production seed dataset (87 nodes, 153 edges)
│   ├── 04_queries.cypher       # 22 analytical graph queries
│   └── 05_test_cases.cypher    # 15 verification test cases
├── frontend/                   # User Interface, Canvas & Visualizations
│   ├── templates/              # HTML5 Jinja2 Templates
│   │   ├── base.html           # Dark-mode navigation shell & Bolt socket badge
│   │   ├── graph_intelligence.html # Interactive Property Graph Canvas
│   │   ├── graph_explorer.html # Focal Entity Neighborhood Inspector
│   │   ├── path_finder.html    # Multi-Hop Shortest Path Finder
│   │   ├── supply_chain.html   # 5-Tier Pharmaceutical Provenance
│   │   ├── cypher_playground.html # Cypher Query Terminal
│   │   └── comparison.html     # Relational SQL vs Graph Benchmark
│   └── static/                 # CSS & JavaScript Assets
│       ├── css/
│       │   ├── style.css       # SaaS dark theme
│       │   └── graph.css       # Glassmorphism controls & canvas styles
│       ├── js/
│       │   ├── main.js         # Core utilities
│       │   ├── graph_intelligence.js # Vis.js ForceAtlas2 network controller
│       │   ├── graph_explorer.js # Radial traversal controller
│       │   ├── path_finder.js  # Shortest path controller
│       │   ├── supply_chain.js # DAG pipeline controller
│       │   └── cypher_playground.js # Terminal controller
│       └── img/
│           └── logo.png        # Application logo
├── .gitignore                  # Git ignore rules
└── README.md                   # Complete academic project documentation
```

---

## 🧬 Graph Data Model & Schema

### 1. Node Labels (8 Entities)
- **`Patient`**: Demographics, identification, state, city.
- **`Doctor`**: Clinical credentials, medical registration, hospital affiliation.
- **`Hospital`**: Healthcare centers, licensing, bed capacity.
- **`Pharmacy`**: Retail and hospital dispensary branches.
- **`Pharmacist`**: Licensed dispensing personnel.
- **`Medicine`**: Formulary drug catalog, therapeutic category, pricing.
- **`Prescription`**: Clinical prescription headers and authorized regimens.
- **`Manufacturer`**: Industrial synthesis facilities.
- **`Supplier`**: Regional and wholesale distributor depots.

### 2. Directed Relationship Types (9 Types)
```cypher
(:Doctor)-[:WORKS_AT]->(:Hospital)
(:Doctor)-[:WRITES]->(:Prescription)
(:Prescription)-[:CONTAINS_MEDICINE]->(:Medicine)
(:Patient)-[:HAS_PRESCRIPTION]->(:Prescription)
(:Hospital)-[:AFFILIATED_WITH]->(:Pharmacy)
(:Pharmacist)-[:EMPLOYED_AT]->(:Pharmacy)
(:Pharmacy)-[:STOCKS]->(:Medicine)
(:Supplier)-[:SUPPLIES_TO]->(:Pharmacy)
(:Manufacturer)-[:SUPPLIES_BATCH]->(:Supplier)
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Python 3.10+
- (Optional) Neo4j Desktop 5.x / Docker / Neo4j AuraDB

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/harshitsharma-6854/pharmacy-graph-intelligence.git
cd pharmacy-graph-intelligence

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Configure Credentials (Optional for Live Neo4j)
Create a `.env` file in the root or `backend/` directory:
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password_here
NEO4J_DATABASE=neo4j
```
> **Note**: If Neo4j is offline or no password is provided, the system **automatically enables Demo Graph Fallback mode**, serving the complete embedded graph dataset so that evaluation, UI grading, and live demoing never crash.

### 4. Run the Application
```bash
python backend/app.py
```
Open **[http://127.0.0.1:5051](http://127.0.0.1:5051)** in your web browser.

---

## 🖥️ Interactive Web Suite

| Page | URL | Description |
| :--- | :--- | :--- |
| **Graph Dashboard** | `/graph-intelligence` | Interactive 87-node property graph with ForceAtlas2 physics, glassmorphic controls, and edge label toggling. |
| **Graph Explorer** | `/graph-explorer` | Radial 1-hop and 2-hop neighborhood spotlights centered on any selected entity. |
| **Path Finder** | `/path-finder` | Computes Dijkstra shortest path and multi-hop referral chains between any 2 nodes. |
| **Supply Chain Flow** | `/supply-chain` | Hierarchical DAG pipeline showing pharmaceutical provenance from Manufacturer to Patient. |
| **Cypher Query Terminal** | `/cypher-playground` | Interactive query editor with execution metrics, JSON export, and table visualization. |
| **MySQL vs Neo4j** | `/mysql-vs-neo4j` | Side-by-side benchmark analyzing recursive graph traversal vs multi-table SQL JOIN latency. |

---

## 📜 Academic Cypher Scripts Inventory

1. **[`database/01_constraints.cypher`](database/01_constraints.cypher)**: Unique constraints and B-Tree indexes for referential integrity.
2. **[`database/02_schema.cypher`](database/02_schema.cypher)**: Formal graph schema definitions.
3. **[`database/03_sample_data.cypher`](database/03_sample_data.cypher)**: Transformed sample data representing 87 nodes and 153 relationships.
4. **[`database/04_queries.cypher`](database/04_queries.cypher)**: 22 production-grade Cypher analytical queries (paths, loops, fraud detection).
5. **[`database/05_test_cases.cypher`](database/05_test_cases.cypher)**: 15 verification and regression test cases.

---

## 🛡️ License & Academic Integrity
Developed as part of the Database Management Systems (DBMS) DA3 Academic Curriculum.
Distributed for educational and demonstration purposes.
