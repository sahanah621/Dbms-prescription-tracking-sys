# 🩺 Prescription Tracking & Healthcare Management System (DBMS)

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Oracle Database](https://img.shields.io/badge/Database-Oracle%2021c%20XE-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![License](https://img.shields.io/badge/License-Academic%20Project-blue.svg)](#)

A comprehensive, full-stack **Database Management System (DBMS)** engineered to track medical prescriptions from clinical generation to pharmacy dispensing. The system bridges doctors, patients, pharmacies, hospitals, and pharmaceutical supply chains with strict relational constraints, automated PL/SQL business logic, and a responsive web dashboard.

---

## 📑 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
   - [Visual Technology Badge Wall](#visual-technology-badge-wall)
     - [Frontend & Presentation Architecture](#frontend--presentation-architecture)
     - [Backend Core & REST Runtime](#backend-core--rest-runtime)
     - [Enterprise Database & Storage Architecture](#enterprise-database--storage-architecture)
     - [Database Intelligence & PL/SQL Engine](#database-intelligence--plsql-engine)
     - [Infrastructure, Tooling & Verification](#infrastructure-tooling--verification)
3. [Database Design & Workflows](#3-database-design--workflows)
   - [Clinical Dispensation & Verification Flowchart](#clinical-dispensation--verification-flowchart)
   - [Entity-Relationship (ER) Diagram](#entity-relationship-er-diagram)
   - [Prescription & Order Lifecycle Sequence](#prescription--order-lifecycle-sequence)
4. [Key Features & Modules](#4-key-features--modules)
5. [Database Implementation (PL/SQL)](#5-database-implementation-plsql)
   - [Tables & Constraints](#tables--constraints)
   - [Stored Procedures](#stored-procedures)
   - [Database Triggers](#database-triggers)
   - [Stored Functions](#stored-functions)
6. [REST API Architecture](#6-rest-api-architecture)
7. [Getting Started & Installation](#7-getting-started--installation)
   - [Prerequisites](#prerequisites)
   - [1. Database Configuration](#1-database-configuration)
   - [2. Backend Setup](#2-backend-setup)
   - [3. Frontend Setup](#3-frontend-setup)
8. [Project Structure](#8-project-structure)
9. [Contributors](#9-contributors)

---

## 1. System Architecture

The project implements an enterprise-grade **3-Tier Architecture** separating presentation, business logic, and transactional persistence. The diagram below details the data flow between all subsystem tiers:

```mermaid
flowchart TD
    %% Styling Class Definitions
    classDef clientNode fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef apiNode fill:#0f766e,stroke:#2dd4bf,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef dbNode fill:#991b1b,stroke:#f87171,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef plsqlNode fill:#6b21a8,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef proxyNode fill:#1e293b,stroke:#64748b,stroke-width:2px,color:#38bdf8,font-weight:bold;

    subgraph Client_Layer["🖥️ Tier 1: Client Presentation Layer (React 19 + Vite)"]
        UI["React 19 SPA<br/>Tailwind CSS & Lucide Icons"]:::clientNode
        State["Client State Management<br/>Modals, Forms & Tabs"]:::clientNode
        API_Client["Centralized REST Client<br/>api/client.js"]:::clientNode
        UI <--> State
        State <--> API_Client
    end

    subgraph Gateway_Layer["🌐 Network Gateway"]
        Proxy["Vite Dev Server Proxy (:5173)<br/>Route: /api/* ➜ 127.0.0.1:8000"]:::proxyNode
    end

    subgraph API_Layer["⚙️ Tier 2: Application & Business Logic Layer (FastAPI)"]
        FastAPI["FastAPI Engine (:8000)<br/>OpenAPI 3.1 & Swagger"]:::apiNode
        CORS["CORS Security Middleware<br/>Allowed Origins Enforcement"]:::apiNode
        Routers["Modular API Routers<br/>Prescriptions, Patients, Facilities, Bills, Supply Chain"]:::apiNode
        Pydantic["Pydantic v2 Schemas<br/>Strict Request/Response Validation"]:::apiNode
        Services["Service Layer<br/>Transactional Business Logic"]:::apiNode
        Driver["python-oracledb Driver<br/>Thin Mode / Thick Mode OCI"]:::apiNode

        FastAPI --> CORS
        CORS --> Routers
        Routers <--> Pydantic
        Routers --> Services
        Services --> Driver
    end

    subgraph DB_Layer["💾 Tier 3: Transactional Persistence Layer (Oracle 21c XE)"]
        OracleDB[("Oracle Database 21c XE<br/>Service: XEPDB1 (:1521)")]:::dbNode
        Tables["14 Normalized Relational Tables<br/>Referential Integrity & Check Constraints"]:::dbNode
        Procedures["PL/SQL Stored Procedures<br/>Atomically Encapsulated CRUD"]:::plsqlNode
        Triggers["PL/SQL Triggers<br/>Chronological & Status Validation Rules"]:::plsqlNode
        Functions["PL/SQL Functions<br/>Aggregates, Dynamic Pricing & Stock Queries"]:::plsqlNode

        OracleDB --- Tables
        OracleDB --- Procedures
        OracleDB --- Triggers
        OracleDB --- Functions
    end

    API_Client -- "HTTP /api/*" --> Proxy
    Proxy -- "Reverse Proxy" --> FastAPI
    Driver -- "SQL*Net / TCP Protocol" --> OracleDB
```

---

## 2. Technology Stack

### Visual Technology Badge Wall

#### Frontend & Presentation Architecture
[![REACT](https://img.shields.io/badge/REACT-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![VITE](https://img.shields.io/badge/VITE-8.3.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TAILWIND CSS](https://img.shields.io/badge/TAILWIND_CSS-4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JAVASCRIPT](https://img.shields.io/badge/JAVASCRIPT-ES6+%20%2F%20JSX-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![LUCIDE REACT](https://img.shields.io/badge/LUCIDE_REACT-1.46.0-F43F5E?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)
[![OXLINT](https://img.shields.io/badge/OXLINT-1.81.0-F59E0B?style=for-the-badge)](https://oxc.rs/)
[![HTML5](https://img.shields.io/badge/HTML5-SEMANTIC_UI-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![CSS3](https://img.shields.io/badge/CSS3-RESPONSIVE_SAAS-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)

#### Backend Core & REST Runtime
[![PYTHON](https://img.shields.io/badge/PYTHON-3.10%2B%20%2F%203.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FASTAPI](https://img.shields.io/badge/FASTAPI-0.115.0+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![UVICORN](https://img.shields.io/badge/UVICORN-0.30.0+_ASGI-2C3E50?style=for-the-badge&logo=uvicorn&logoColor=white)](https://www.uvicorn.org/)
[![PYDANTIC](https://img.shields.io/badge/PYDANTIC-v2.0+_MODELS-E92063?style=for-the-badge&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![PYTHON-ORACLEDB](https://img.shields.io/badge/PYTHON--ORACLEDB-2.0+_DRIVER-F80000?style=for-the-badge)](https://oracle.github.io/python-oracledb/)
[![REST APIS](https://img.shields.io/badge/REST_APIS-MICRO--ROUTING-0284C7?style=for-the-badge)](#)
[![PYTHON-DOTENV](https://img.shields.io/badge/PYTHON--DOTENV-1.0.0-4B5563?style=for-the-badge)](https://pypi.org/project/python-dotenv/)
[![CORS](https://img.shields.io/badge/CORS-SECURE_ORIGINS-8B5CF6?style=for-the-badge)](#)

#### Enterprise Database & Storage Architecture
[![ORACLE 21C](https://img.shields.io/badge/ORACLE-21c_XE-F80000?style=for-the-badge&logo=oracle&logoColor=white)](https://www.oracle.com/database/technologies/xe-downloads.html)
[![PDB SERVICE](https://img.shields.io/badge/PDB_SERVICE-XEPDB1-0284C7?style=for-the-badge)](#)
[![ACID](https://img.shields.io/badge/ACID-STRICT_INTEGRITY-059669?style=for-the-badge)](#)
[![RELATIONAL TABLES](https://img.shields.io/badge/RELATIONAL_SCHEMA-14_TABLES-4F46E5?style=for-the-badge)](#)
[![CONSTRAINTS](https://img.shields.io/badge/CONSTRAINTS-PK_%2F_FK_%2F_CHECK-D97706?style=for-the-badge)](#)
[![SEED DATA](https://img.shields.io/badge/SEED_RECORDS-50+_SAMPLE_DATA-10B981?style=for-the-badge)](#)

#### Database Intelligence & PL/SQL Engine
[![STORED PROCEDURES](https://img.shields.io/badge/PL%2FSQL-STORED_PROCEDURES-059669?style=for-the-badge)](#)
[![ACTIVE TRIGGERS](https://img.shields.io/badge/TRIGGERS-4_VALIDATION_RULES-DC2626?style=for-the-badge)](#)
[![STORED FUNCTIONS](https://img.shields.io/badge/FUNCTIONS-DYNAMIC_PRICING_%26_SUMS-7C3AED?style=for-the-badge)](#)
[![TRANSACTIONS](https://img.shields.io/badge/ACID-SAVEPOINT_%26_ROLLBACK-B45309?style=for-the-badge)](#)
[![CHRONO INTEGRITY](https://img.shields.io/badge/RULES-FUTURE_DATE_GUARDS-EF4444?style=for-the-badge)](#)

#### Infrastructure, Tooling & Verification
[![GIT](https://img.shields.io/badge/GIT-VERSION_CONTROL-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)
[![SWAGGER UI](https://img.shields.io/badge/OPENAPI_3.1-SWAGGER_DOCS-85EA2D?style=for-the-badge&logo=openapi-initiative&logoColor=black)](http://127.0.0.1:8000/docs)
[![VITE PROXY](https://img.shields.io/badge/NETWORK-PORT_5173_%E2%86%92_8000-0284C7?style=for-the-badge)](#)
[![VERIFICATION](https://img.shields.io/badge/BUILD_%26_LINT-PASSING-10B981?style=for-the-badge)](#)
[![SQL CLIENTS](https://img.shields.io/badge/SQL_CLIENTS-SQL*PLUS_%2F_SQL_DEV-374151?style=for-the-badge)](#)

---

## 3. Database Design & Workflows

### Clinical Dispensation & Verification Flowchart

The state-driven decision flowchart below models the clinical and inventory integrity lifecycle when a pharmacist processes a prescription dispensation:

```mermaid
flowchart TD
    %% Custom Color Palette Definition
    classDef startNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef reqNode fill:#0369a1,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef govCheck fill:#9f1239,stroke:#e11d48,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef stockCheck fill:#6b21a8,stroke:#a855f7,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef rejectState fill:#881337,stroke:#f43f5e,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef approveState fill:#581c87,stroke:#9333ea,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef execState fill:#065f46,stroke:#10b981,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef rollbackState fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef telemetryNode fill:#1e293b,stroke:#475569,stroke-width:1px,color:#94a3b8;

    Start["Pharmacist Initiates Clinical Dispensation<br/>(e.g., Rx #1015, Apollo Healthcare)"]:::startNode
    ReqState["State: DISPENSATION_REQUESTED"]:::reqNode

    GovCheck{"Clinical Governance Check<br/>Prescribing Doctor Valid &<br/>Patient Active in Relational DB"}:::govCheck

    HttpError["HTTP 403 Forbidden / 422<br/>Unregistered Doctor or Inactive Patient"]:::rejectState
    RejectState["State: DISPENSATION_REJECTED"]:::rejectState
    RejectLog["Rejection Event Logged"]:::telemetryNode

    StockCheck{"Dispensary Stock & Expiry Check<br/>Available Units ≥ Required Units &<br/>Batch Exp_Date > SYSDATE"}:::stockCheck

    ApproveState["State: DISPENSATION_APPROVED"]:::approveState
    ApproveLog["Approval Audit Log Generated"]:::telemetryNode

    ExecTx["State: ATOMICALLY_EXECUTE_TRANSACTION<br/>INVENTORY Units Decremented & Bill Generated"]:::execState
    Rollback["1-Click ACID Rollback<br/>ROLLBACK WORK TO PRE-DISPENSE"]:::rollbackState
    CompleteState["State: DISPENSATION_COMPLETED<br/>Bill Emitted & Receipt Ready"]:::execState

    Telemetry["Chained Telemetry & Security Audit Trail"]:::telemetryNode

    %% Flow connections
    Start --> ReqState
    ReqState --> GovCheck

    GovCheck -- "Referential Violation - Invalid Doctor / Patient" --> HttpError
    HttpError --> RejectState
    RejectState --> RejectLog

    GovCheck -- "Referential Verification Passed" --> StockCheck

    StockCheck -- "Stock Depleted / Expired Batch Detected" --> RejectState
    StockCheck -- "Inventory Verification Confirmed" --> ApproveState

    ApproveState --> ApproveLog
    ApproveState --> ExecTx

    ExecTx -- "Trigger Exception / Stock Dropped < 0" --> Rollback
    ExecTx -- "All Constraints Satisfied" --> CompleteState

    %% Telemetry linkages
    ReqState -.-> Telemetry
    RejectState -.-> Telemetry
    CompleteState -.-> Telemetry
```

---

### Entity-Relationship (ER) Diagram

The relational schema establishes strict referential integrity across medical practitioners, patients, hospital affiliations, pharmaceutical stock, and B2B supply logistics:

```mermaid
erDiagram
    PATIENT ||--o{ PATIENT_CONTACT : "has"
    PATIENT ||--o{ PRESCRIPTION : "receives"
    PATIENT ||--o{ BILL : "pays"
    
    DOCTOR ||--o{ PRESCRIPTION : "issues"
    HOSPITAL ||--o{ DOCTOR : "employs"
    PHARMACY ||--o{ HOSPITAL : "supplies/partners"
    PHARMACY ||--o{ PHARMACIST : "employs"
    PHARMACY ||--o{ BILL : "issues"
    PHARMACY ||--o{ MEDICINE_ORDER : "places"
    
    PRESCRIPTION ||--|{ PRESCRIPTION_ITEM : "contains"
    MEDICINE ||--o{ PRESCRIPTION_ITEM : "dispensed_in"
    
    SUPPLIER ||--o{ MEDICINE_ORDER : "fulfills"
    SUPPLIER }|--|{ MANUFACTURER : "sources_from"
    SUPPLIER }|--|{ WHOLESALE_SUPPLIER : "partners_with"
    SUPPLIER }|--|{ PHARMACY : "supplies"

    PATIENT {
        number patient_id PK
        varchar2 first_name
        varchar2 last_name
        date dob
        char sex
        varchar2 city
        varchar2 state
        varchar2 street
    }

    PATIENT_CONTACT {
        number patient_id PK,FK
        varchar2 contact_no PK
    }

    DOCTOR {
        number doctor_id PK
        number hospital_id FK
        varchar2 first_name
        varchar2 last_name
        varchar2 qualification
        number experience
        varchar2 contact_no UK
    }

    HOSPITAL {
        number hospital_id PK
        number pharmacy_id FK
        varchar2 name
        varchar2 contact UK
        varchar2 city
        varchar2 state
        varchar2 street
    }

    PHARMACY {
        number pharmacy_id PK
        varchar2 name
        number rating
        varchar2 contact_no UK
        varchar2 city
        varchar2 state
        varchar2 street
    }

    PHARMACIST {
        number pharmacist_id PK
        number pharmacy_id FK
        varchar2 name
        varchar2 shift
    }

    PRESCRIPTION {
        number prescription_id PK
        number doctor_id FK
        number patient_id FK
        date prescription_date
    }

    PRESCRIPTION_ITEM {
        number item_id PK
        number prescription_id FK
        number medicine_id FK
        varchar2 dosage
        varchar2 frequency
        varchar2 duration
    }

    MEDICINE {
        number medicine_id PK
        varchar2 name
        number price
        number available_quantity
        date manu_date
        date exp_date
    }

    BILL {
        number bill_id PK
        number pharmacy_id FK
        number patient_id FK
        number amount
    }

    MEDICINE_ORDER {
        number order_id PK
        number supplier_id FK
        number pharmacy_id FK
        number quantity_ordered
        date order_date
        date arrival_date
        varchar2 order_status
        varchar2 payment_status
    }

    SUPPLIER {
        number supplier_id PK
        varchar2 name
        varchar2 contact UK
        varchar2 city
        varchar2 state
        varchar2 street
    }

    MANUFACTURER {
        number manufacturer_id PK
        varchar2 brand_name UK
        varchar2 city
        varchar2 state
        varchar2 street
    }

    WHOLESALE_SUPPLIER {
        varchar2 gst_no PK
        varchar2 city
        varchar2 state
        varchar2 street
    }
```

---

### Prescription & Order Lifecycle Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    actor Patient
    participant System as Frontend Dashboard
    participant API as FastAPI Backend
    participant DB as Oracle 21c Database
    actor Pharmacy as Pharmacist / Pharmacy

    Doctor->>System: Enter prescription & medications
    System->>API: POST /api/prescriptions/
    API->>DB: CALL add_prescription(...) & add_prescription_item(...)
    Note over DB: Trigger validates prescription_date <= SYSDATE
    DB-->>API: Success (Created)
    API-->>System: 201 Created

    Patient->>Pharmacy: Requests fulfillment
    Pharmacy->>System: Check medicine stock & pricing
    System->>API: GET /api/medicines/
    API->>DB: SELECT find_medicine_price(), get_medicine_stock()
    DB-->>API: Stock & unit prices
    API-->>System: Medicine inventory data

    Pharmacy->>System: Generate Bill
    System->>API: POST /api/bills/
    API->>DB: CALL add_bill(...)
    DB-->>API: Bill record created
    API-->>System: 201 Created with total

    alt Low Inventory Threshold
        Pharmacy->>System: Place Restock Order
        System->>API: POST /api/supply-chain/orders/
        API->>DB: CALL create_medicine_order(...)
        Note over DB: Trigger trg_medicine_order_validate checks dates
        DB-->>API: Order placed
        API-->>System: Order status: pending
    end
```

---

## 4. Key Features & Modules

- **📋 Prescription Administration**: Issue prescriptions linking verified doctors and patients, specify multi-drug dosages, intake frequency, and treatment duration.
- **🧑‍⚕️ Doctor & Hospital Directory**: Manage medical practitioners, qualifications, years of experience, and hospital department affiliations.
- **🏥 Patient Health Registry**: Track patient demographics, multi-contact directories, medical history, and cumulative prescription records.
- **💊 Medicine Inventory & Expiry Tracking**: Monitor unit prices, warehouse availability, manufactured dates, and automatically flag expired medicines (`exp_date > manu_date`).
- **🏪 Pharmacy Network & Staff Rotations**: Organize network pharmacies, customer ratings, locations, and assign pharmacist shifts (`morning`, `evening`, `night`).
- **💳 Automated Patient Billing**: Generate patient bills linked to pharmacies and calculate billing aggregates via PL/SQL routines.
- **🚚 End-to-End Supply Chain**: Manage pharmaceutical suppliers, wholesale partners (GST tracked), manufacturers, and medicine purchase orders with real-time status transitions (`pending` → `processing` → `shipped` → `delivered`).

---

## 5. Database Implementation (PL/SQL)

The database schema is organized under the `database/` directory and enforces relational integrity via PL/SQL scripts:

### Tables & Constraints (`01_tables.sql`)
- **Referential Integrity**: Cascading and foreign key constraints across 14 normalized relational tables.
- **Domain Constraints**:
  - `medicine`: Price must be strictly positive (`price > 0`), non-negative stock (`available_quantity >= 0`), and valid expiry (`exp_date > manu_date`).
  - `pharmacist`: Shifts restricted to `('morning', 'evening', 'night')`.
  - `medicine_order`: Status constrained to `('pending', 'processing', 'shipped', 'delivered', 'cancelled')`.

### Stored Procedures (`03_procedures.sql`)
Encapsulates transactional CRUD operations to avoid ad-hoc queries:
- `add_patient`, `update_patient`, `delete_patient`
- `add_doctor`, `update_doctor`, `delete_doctor`
- `add_pharmacy`, `update_pharmacy`, `delete_pharmacy`
- `add_prescription`, `add_prescription_item`
- `add_medicine`, `update_medicine_stock`
- `add_bill`, `create_medicine_order`, `update_order_status`

### Database Triggers (`04_triggers.sql`)
Enforces runtime business rules and chronological validity:
- `trg_patient_dob_validate`: Rejects patient birth dates set in the future (`:new.dob > SYSDATE`).
- `trg_prescription_date_validate`: Rejects prescription issue dates set in the future (`:new.prescription_date > SYSDATE`).
- `trg_medicine_order_validate`: Rejects orders where arrival precedes the order date (`:new.arrival_date < :new.order_date`).
- `trg_medicine_order_delivered`: Ensures an arrival date is explicitly recorded when an order status is marked as `delivered`.

### Stored Functions (`05_functions.sql`)
Reusable analytical functions:
- `find_medicine_price(p_medicine_id NUMBER) RETURN NUMBER`: Retrieves current unit price for a given drug.
- `get_medicine_stock(p_medicine_id NUMBER) RETURN NUMBER`: Returns on-hand inventory count.
- `get_doctor_experience(p_doctor_id NUMBER) RETURN NUMBER`: Returns doctor's years of practice.
- `get_patient_bill_total(p_patient_id NUMBER) RETURN NUMBER`: Uses `NVL(SUM(amount), 0)` to calculate total billing incurred by a patient across all pharmacies.

---

## 6. REST API Architecture

The FastAPI backend exposes modular, documented endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and Oracle DB connectivity state |
| `GET` / `POST` | `/api/prescriptions` | Query existing prescriptions or issue new ones with line items |
| `GET` / `POST` | `/api/patients` | Search patient records and register new profiles |
| `GET` / `POST` | `/api/medicines` | Query catalog, check stock, and register new drugs |
| `GET` / `POST` | `/api/facilities/pharmacies` | List pharmacies, ratings, and physical locations |
| `GET` / `POST` | `/api/facilities/doctors` | List doctors, hospital affiliations, and specialties |
| `GET` / `POST` | `/api/facilities/hospitals` | Hospital department directory and contacts |
| `GET` / `POST` | `/api/bills` | Generate patient invoices and query billing history |
| `GET` / `POST` | `/api/supply-chain/orders` | Issue pharmaceutical stock orders to suppliers |
| `GET` | `/docs` | Interactive OpenAPI / Swagger UI documentation |

---

## 7. Getting Started & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.18.0+` (or `v22.x+`) with `npm`
- **Python**: `3.10+` or `3.11+`
- **Oracle Database**: 21c XE (or Oracle Cloud Autonomous Database)
- **SQL Client**: SQL*Plus, Oracle SQL Developer, or DBeaver

---

### 1. Database Configuration

1. Launch your Oracle Database service (`XEPDB1` pluggable database).
2. Connect using `SQL*Plus` or `SQL Developer` as your administrative user:
   ```bash
   sqlplus PDBADMIN@//localhost:1521/XEPDB1
   ```
3. Execute the SQL scripts in numerical sequence:
   ```sql
   @database/01_tables.sql
   @database/02_data.sql
   @database/03_procedures.sql
   @database/04_triggers.sql
   @database/05_functions.sql
   ```
4. Verify table and procedure creation:
   ```sql
   SELECT table_name FROM user_tables;
   SELECT object_name, object_type FROM user_objects WHERE object_type IN ('PROCEDURE', 'TRIGGER', 'FUNCTION');
   ```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS / Linux:
   python3 -m venv .venv
   source .venv/bin/activate

   # On Windows:
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to match your Oracle Database credentials:
   ```ini
   ORACLE_USER=PDBADMIN
   ORACLE_PASSWORD=your_secure_password
   ORACLE_HOST=localhost
   ORACLE_PORT=1521
   ORACLE_SERVICE=XEPDB1
   DEBUG=True
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   Access the interactive Swagger documentation at **`http://127.0.0.1:8000/docs`**.

---

### 3. Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *Note: Vite is pre-configured to proxy `/api/*` requests to the backend at `http://127.0.0.1:8000`.*

5. Build for production:
   ```bash
   npm run build
   ```

---

## 8. Project Structure

```
DBMS/
├── database/                    # Oracle 21c PL/SQL Database Layer
│   ├── 01_tables.sql            # Schema definitions, primary/foreign keys & constraints
│   ├── 02_data.sql              # Seed data for hospitals, doctors, patients, pharmacies
│   ├── 03_procedures.sql        # Transactional stored procedures (CRUD logic)
│   ├── 04_triggers.sql          # Integrity triggers (Date validation & delivery rules)
│   └── 05_functions.sql         # Query & calculation functions (Stock, pricing, billing)
│
├── frontend/                    # React 19 + Vite + Tailwind CSS Client
│   ├── public/                  # Favicon & static vector assets
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/                 # Centralized HTTP client
│   │   │   └── client.js
│   │   ├── assets/              # Branding and vector artwork
│   │   │   └── hero.png
│   │   ├── components/          # Reusable UI widgets
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── StatsOverview.jsx
│   │   ├── pages/               # Application view modules
│   │   │   ├── BillingPage.jsx
│   │   │   ├── DoctorsPage.jsx
│   │   │   ├── HospitalsPage.jsx
│   │   │   ├── MedicinesPage.jsx
│   │   │   ├── PatientsPage.jsx
│   │   │   ├── PharmaciesPage.jsx
│   │   │   ├── PrescriptionsPage.jsx
│   │   │   └── SuppliersPage.jsx
│   │   ├── App.jsx              # Main routing & application layout
│   │   ├── main.jsx             # React DOM entry point
│   │   ├── index.css            # Tailwind CSS directives
│   │   └── App.css              # Custom styling
│   ├── index.html               # SPA HTML shell
│   ├── package.json             # Frontend dependency manifest
│   ├── vite.config.js           # Vite configuration & backend proxy
│   └── .oxlintrc.json           # Linter rules
│
├── .gitignore                   # Ignored files (node_modules, .venv, .env)
└── README.md                    # Comprehensive project documentation
```

---

## 9. Contributors

- **Sahana H** — [@sahanah621](https://github.com/sahanah621)
- **Harshit Sharma** — [@harshitsharma-6854](https://github.com/harshitsharma-6854)
- **Sreya** — [@sreyakj](https://github.com/sreyakj)

---

- **Repository**: [prescription-tracking-system](https://github.com/sahanah621/prescription-tracking-system)
- **Academic Context**: Database Management Systems (DBMS) Course Project.
