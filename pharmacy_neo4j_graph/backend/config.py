"""
============================================================================
DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
MODULE: Backend Application & API Layer (Python Flask)
CONTRIBUTOR: Backend Architecture & API Integration Lead (Member 2)
DOCUMENTATION: See README.md
PURPOSE: Bolt Protocol & Flask Application Configuration
============================================================================
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present (checks backend/ and project root)
base_dir = Path(__file__).resolve().parent
project_root = base_dir.parent
load_dotenv(base_dir / '.env')
load_dotenv(project_root / '.env')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'pharma-neo4j-graph-secret-key-2026')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    
    # Neo4j Graph Database Configuration (Bolt Protocol)
    NEO4J_URI = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
    NEO4J_USERNAME = os.environ.get('NEO4J_USERNAME', 'neo4j')
    NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD', '')
    NEO4J_DATABASE = os.environ.get('NEO4J_DATABASE', 'neo4j')
    NEO4J_SCRIPTS_DIR = project_root / 'database'
