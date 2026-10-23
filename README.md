# Prescription Tracking System

A comprehensive multi-tier clinical prescription and pharmacy management platform containing both **DA2 (Relational Core)** and **DA3 (Advanced Graph Intelligence Extension)**:

1. **DA2 (Relational Core)**: Full-stack prescription and billing system built with **FastAPI**, **React 19 with Vite**, and **Relational SQL Database**.
2. **DA3 (Graph Intelligence)**: Enterprise graph network system located in [**`📁 pharmacy_neo4j_graph/`**](./pharmacy_neo4j_graph) powered by **Neo4j 5.x Cloud AuraDB**, **Python Flask**, and **Interactive Vis.js Canvas**.

---

## 🌐 DA3: Advanced Neo4j Graph Intelligence Extension

Located in [**`📁 pharmacy_neo4j_graph/`**](./pharmacy_neo4j_graph), DA3 extends the prescription tracking system with property graph capabilities:

- **Neo4j 5.x Cloud AuraDB**: Fully seeded cloud graph database with 87 clinical entities and 153 directed relationships.
- **Interactive Graph Dashboard**: Real-time force-directed canvas visualizing doctors, patients, pharmacies, medicines, and supply chain networks.
- **Radial Graph Explorer**: 1-hop and 2-hop focal entity exploration with anti-collision physics.
- **Supply Chain Path Finder**: Shortest path graph routing (Dijkstra / BFS) from patient to pharmaceutical manufacturer.
- **Interactive Cypher Console**: Live terminal supporting 13 academic Cypher presets (degree centrality, multi-hop traversals, diamond recommendations, and `SET` property updates).

👉 *For complete DA3 setup, Cypher schemas, and instructions, see [**`pharmacy_neo4j_graph/README.md`**](./pharmacy_neo4j_graph/README.md).*

---

## Features
 The records of each table can be added ,deleted and updated .We can also perform search operation on the records.
- **Prescriptions**: Issue prescriptions with multiple medicines in a single transaction. Each medicine includes dosage, frequency, and duration. Total estimated costs are calculated automatically from catalog prices.
- **Patients**: Register and update patient records (name, date of birth, gender, address). Database triggers prevent entering future birth dates, and foreign key checks prevent accidental deletion of patients with existing clinical records.
- **Medicine Inventory**: Track medicine names, prices, available stock, manufacturing dates, and expiry dates. The system automatically tags expired medicines.
- **Doctors and Hospitals**: Maintain doctor profiles, medical qualifications, experience, contact numbers, and hospital affiliations.
- **Pharmacies and Pharmacists**: Manage pharmacy branches, ratings, and pharmacist duty shifts (morning, evening, night).
- **Billing**: Generate pharmacy invoices for patients. Automatically calculates cumulative patient bill totals using an Oracle PL/SQL stored function.
- **Supply Chain**: Manage suppliers, manufacturers, wholesale distributors, and medicine restock orders. Track order progress from pending to delivered, with date validation triggers.
- **Live System Health**: Real-time database status indicator in the top navigation bar checking Oracle connection health and active schema via `/api/health`.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: FastAPI, Uvicorn, Pydantic v2
- **Database**: Oracle Database 21c Express Edition (XE), pluggable database `XEPDB1`
- **Database Driver**: `python-oracledb` (supports both Thin mode and Thick mode client fallback)

---

## How It Works

1. **Frontend**: The React application runs on Vite (port 5173). It communicates with the backend through REST API calls and provides an administrative dashboard with live stats and module navigation.
2. **Backend**: The FastAPI server (port 8000) handles HTTP requests, validates input using Pydantic schemas, and manages database transactions.
3. **Database**: Oracle Database 21c XE stores all clinical and supply chain data across 17 tables, enforcing data integrity through foreign keys, triggers, stored procedures, and functions.

---

## Database

The database is built on Oracle Database 21c XE and consists of:

- **17 Relational Tables**:
  - Clinical: `patient`, `patient_contact`, `doctor`, `hospital`, `prescription`, `prescription_item`, `medicine`, `bill`
  - Pharmacy: `pharmacy`, `pharmacist`
  - Supply Chain: `supplier`, `manufacturer`, `wholesale_supplier`, `supplier_manufacturer`, `supplier_wholesale`, `supplier_pharmacy`, `medicine_order`
- **Triggers (`04_triggers.sql`)**:
  - `trg_patient_dob_validate`: Prevents future dates of birth.
  - `trg_prescription_date_validate`: Prevents future prescription dates.
  - `trg_medicine_order_validate`: Ensures order arrival date is on or after the order date.
  - `trg_medicine_order_delivered`: Requires an arrival date before an order can be marked as delivered.
- **Stored Functions (`05_functions.sql`)**:
  - `get_patient_bill_total`: Calculates total billed amount for a patient.
  - `find_medicine_price`: Returns the unit price of a medicine.
  - `get_medicine_stock`: Returns the available quantity of a medicine.
  - `get_doctor_experience`: Returns the experience in years for a doctor.
- **Stored Procedures (`03_procedures.sql`)**: Contains `add_*`, `update_*`, and `delete_*` procedures for managing all database entities.

---

## Project Structure

```text
Dbms-prescription-tracking-sys/
├── backend/                       # [DA2] FastAPI Python backend
├── database/                      # [DA2] Relational SQL scripts, triggers & procedures
├── frontend/                      # [DA2] React 19 + Vite dashboard
└── pharmacy_neo4j_graph/          # [DA3] Advanced Neo4j Graph Intelligence Extension
    ├── backend/                   # Flask Graph API & Neo4j driver
    │   ├── app.py
    │   ├── config.py
    │   ├── requirements.txt
    │   └── services/neo4j_service.py
    ├── database/                  # OpenCypher constraints, schemas, & seed loaders
    │   ├── 01_constraints.cypher
    │   ├── 02_schema.cypher
    │   ├── 03_sample_data.cypher
    │   ├── 04_queries.cypher
    │   ├── 05_test_cases.cypher
    │   └── load_data.py
    ├── frontend/                  # Interactive Graph canvas, explorer, & pathfinder
    ├── .env.example               # Example Neo4j cloud configuration
    └── README.md                  # Comprehensive DA3 documentation
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Oracle Database 21c Express Edition (XE)** with pluggable database `XEPDB1`
- **Git**

---

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/sahanah621/Dbms-prescription-tracking-sys.git
cd Dbms-prescription-tracking-sys
```

### 2. Set up the Oracle Database

Connect to your Oracle database using SQL*Plus or SQL Developer as `PDBADMIN` (or your target user) on `localhost:1521/XEPDB1`:

```sql
@database/01_tables.sql
@database/02_data.sql
@database/03_procedures.sql
@database/04_triggers.sql
@database/05_functions.sql
COMMIT;
```

### 3. Set up the backend

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```ini


### 4. Set up the frontend

In a separate terminal:

```bash
cd frontend
npm install
```

---

## Running the Project

Start the backend in terminal 1:

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in terminal 2:

```bash
cd frontend
npm run dev
```

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **Interactive Swagger Docs**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/api/health

---

## API Endpoints

All endpoints are prefixed with `/api`:

- **Health**: `GET /api/health`
- **Patients**: `GET`, `POST /api/patients` and `GET`, `PUT`, `DELETE /api/patients/{id}`
- **Medicines**: `GET`, `POST /api/medicines` and `GET`, `PUT`, `DELETE /api/medicines/{id}`
- **Prescriptions**: `GET`, `POST /api/prescriptions` and `GET`, `DELETE /api/prescriptions/{id}`
- **Pharmacies**: `GET`, `POST /api/pharmacies` and `GET`, `PUT`, `DELETE /api/pharmacies/{id}`
- **Pharmacists**: `GET`, `POST /api/pharmacists` and `GET`, `PUT`, `DELETE /api/pharmacists/{id}`
- **Hospitals**: `GET`, `POST /api/hospitals` and `GET`, `PUT`, `DELETE /api/hospitals/{id}`
- **Doctors**: `GET`, `POST /api/doctors` and `GET`, `PUT`, `DELETE /api/doctors/{id}`
- **Billing**: `GET`, `POST /api/bills`, `GET /api/bills/summary/{patient_id}`, and `GET`, `PUT`, `DELETE /api/bills/{id}`
- **Suppliers**: `GET`, `POST /api/suppliers` and `GET`, `PUT`, `DELETE /api/suppliers/{id}`
- **Manufacturers**: `GET`, `POST /api/manufacturers` and `GET`, `PUT`, `DELETE /api/manufacturers/{id}`
- **Wholesale Suppliers**: `GET`, `POST /api/wholesale-suppliers` and `GET`, `PUT`, `DELETE /api/wholesale-suppliers/{gst_no}`
- **Medicine Orders**: `GET`, `POST /api/medicine-orders` and `GET`, `PUT`, `DELETE /api/medicine-orders/{id}`

---

## Contributors

- **Sahana H** ([@sahanah621](https://github.com/sahanah621))
- **Harshit Sharma**
- **Sreya**

---

