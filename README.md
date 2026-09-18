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

1. [System Architecture](#-system-architecture)
2. [Database Design & Schematics](#-database-design--schematics)
   - [Entity-Relationship (ER) Diagram](#entity-relationship-er-diagram)
   - [Prescription & Order Lifecycle Sequence](#prescription--order-lifecycle-sequence)
3. [Technology Stack](#-technology-stack)
4. [Key Features & Modules](#-key-features--modules)
5. [Database Implementation (PL/SQL)](#-database-implementation-plsql)
   - [Tables & Constraints](#tables--constraints)
   - [Stored Procedures](#stored-procedures)
   - [Database Triggers](#database-triggers)
   - [Stored Functions](#stored-functions)
6. [REST API Architecture](#-rest-api-architecture)
7. [Getting Started & Installation](#-getting-started--installation)
   - [Prerequisites](#prerequisites)
   - [1. Database Configuration](#1-database-configuration)
   - [2. Backend Setup](#2-backend-setup)
   - [3. Frontend Setup](#3-frontend-setup)
8. [Project Structure](#-project-structure)
9. [Contributing & Authors](#-contributing--authors)

---

## 🏛️ System Architecture

The project implements an enterprise-grade **3-Tier Architecture** separating presentation, business logic, and transactional persistence:

```mermaid
flowchart TD
    subgraph Client_Layer["🖥️ Client Presentation Layer"]
        UI["React 19 SPA (Vite + Tailwind CSS)"]
        State["Client State & UI Modals"]
        Router["Tab / Navigation Router"]
        API_Client["Fetch API Client (REST)"]
        UI --> State
        State --> API_Client
        Router --> UI
    end

    subgraph API_Layer["⚙️ Application & Business Logic Layer (FastAPI)"]
        Proxy["Vite Dev Server Proxy (:5173)"]
        FastAPI["FastAPI Application (:8000)"]
        CORS["CORS Middleware"]
        Pydantic["Pydantic Validation Schemas"]
        Routers["API Routers
(Prescriptions, Patients, Facilities, Bills, Supply Chain)"]
        Services["Service Layer (Business Logic)"]
        Driver["python-oracledb Driver (Thin / Thick Mode)"]

        API_Client -- "/api/* requests" --> Proxy
        Proxy --> FastAPI
        FastAPI --> CORS
        CORS --> Routers
        Routers --> Pydantic
        Routers --> Services
        Services --> Driver
    end

    subgraph DB_Layer["💾 Transactional Persistence Layer (Oracle 21c XE)"]
        OracleDB[("Oracle Database (XEPDB1)")]
        Tables["Relational Tables & Foreign Keys"]
        Procedures["PL/SQL Stored Procedures (CRUD)"]
        Triggers["PL/SQL Triggers (Integrity & Rules)"]
        Functions["PL/SQL Functions (Aggregates & Pricing)"]

        Driver -- "SQL*Net / TCP (:1521)" --> OracleDB
        OracleDB --- Tables
        OracleDB --- Procedures
        OracleDB --- Triggers
        OracleDB --- Functions
    end
```

---

## 📊 Database Design & Schematics

### Entity-Relationship (ER) Diagram

The relational schema coordinates healthcare providers, clinical data, and B2B pharmaceutical logistics:

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

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | [React](https://react.dev/) | `^19.2.8` | Component-driven Single Page Application |
| **Frontend Tooling** | [Vite](https://vite.dev/) | `^8.3.0` | Next-generation frontend build tool and dev server |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.3` | Utility-first, responsive CSS framework |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.46.0` | Medical and dashboard SVG iconography |
| **Linting** | [Oxlint](https://oxc.rs/) | `^1.81.0` | High-performance JavaScript/JSX linter |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) | `>=0.115.0` | High-performance asynchronous Python REST framework |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | `>=0.30.0` | Lightning-fast ASGI web server |
| **DB Connector** | [python-oracledb](https://oracle.github.io/python-oracledb/) | `>=2.0.0` | Official Oracle Database driver (Thin & Thick modes) |
| **Validation** | [Pydantic v2](https://docs.pydantic.dev/) | `>=2.0.0` | Strict data parsing, request validation, and schema generation |
| **Database Engine** | [Oracle 21c XE](https://www.oracle.com/database/technologies/xe-downloads.html) | `21c` | Enterprise relational database management system |
| **Database Logic** | [PL/SQL](https://www.oracle.com/database/technologies/appdev/plsql.html) | Native | Stored procedures, integrity triggers, and aggregate functions |

---

## ✨ Key Features & Modules

- **📋 Prescription Administration**: Issue prescriptions linking verified doctors and patients, specify multi-drug dosages, intake frequency, and treatment duration.
- **🧑‍⚕️ Doctor & Hospital Directory**: Manage medical practitioners, qualifications, years of experience, and hospital department affiliations.
- **🏥 Patient Health Registry**: Track patient demographics, multi-contact directories, medical history, and cumulative prescription records.
- **💊 Medicine Inventory & Expiry Tracking**: Monitor unit prices, warehouse availability, manufactured dates, and automatically flag expired medicines (`exp_date > manu_date`).
- **🏪 Pharmacy Network & Staff Rotations**: Organize network pharmacies, customer ratings, locations, and assign pharmacist shifts (`morning`, `evening`, `night`).
- **💳 Automated Patient Billing**: Generate patient bills linked to pharmacies and calculate billing aggregates via PL/SQL routines.
- **🚚 End-to-End Supply Chain**: Manage pharmaceutical suppliers, wholesale partners (GST tracked), manufacturers, and medicine purchase orders with real-time status transitions (`pending` → `processing` → `shipped` → `delivered`).

---

## 🗄️ Database Implementation (PL/SQL)

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

## 🌐 REST API Architecture

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

## 🚀 Getting Started & Installation

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

## 📂 Project Structure

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

## 👥 Contributing & Authors

- **Author**: Sahana H ([@sahanah621](https://github.com/sahanah621))
- **Repository**: [prescription-tracking-system](https://github.com/sahanah621/prescription-tracking-system)
- **Academic Context**: Database Management Systems (DBMS) Course Project.
